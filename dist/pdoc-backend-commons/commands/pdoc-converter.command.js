"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var common_admin_command_1 = require("../../backend-commons/commands/common-admin.command");
var date_utils_1 = require("@dps/mycms-commons/dist/commons/utils/date.utils");
var file_utils_1 = require("@dps/mycms-commons/dist/commons/utils/file.utils");
var pdoc_file_utils_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-file.utils");
var string_utils_1 = require("@dps/mycms-commons/dist/commons/utils/string.utils");
var pdoc_adapter_response_mapper_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper");
var viewer_manager_module_1 = require("../../media-commons/modules/viewer-manager.module");
var PDocConverterCommand = /** @class */ (function (_super) {
    __extends(PDocConverterCommand, _super);
    function PDocConverterCommand() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PDocConverterCommand.prototype.createValidationRules = function () {
        return {
            backend: new generic_validator_util_1.SimpleConfigFilePathValidationRule(true),
            srcFile: new generic_validator_util_1.SimpleFilePathValidationRule(true),
            file: new generic_validator_util_1.SimpleFilePathValidationRule(true),
            exportId: new generic_validator_util_1.SimpleFilePathValidationRule(false),
            renameFileIfExists: new generic_validator_util_1.WhiteListValidationRule(false, [true, false, 'true', 'false'], false),
            profiles: new generic_validator_util_1.IdCsvValidationRule(false),
            langkeys: new generic_validator_util_1.IdCsvValidationRule(false)
        };
    };
    PDocConverterCommand.prototype.definePossibleActions = function () {
        return ['extractPDocViewerFile', 'createPDocViewerFile', 'migrateLegacyPDocFile', 'migratePDocFileToMapperFile'];
    };
    PDocConverterCommand.prototype.processCommandArgs = function (argv) {
        var filePathConfigJson = argv['backend'];
        if (filePathConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required backendConfig: "--backend"');
        }
        var backendConfig = JSON.parse(fs.readFileSync(filePathConfigJson, { encoding: 'utf8' }));
        var viewerManagerModule = new viewer_manager_module_1.ViewerManagerModule();
        var responseMapper = new pdoc_adapter_response_mapper_1.PDocAdapterResponseMapper(backendConfig);
        var action = argv['action'];
        var exportId = argv['exportId'];
        var promise;
        var dataFileName = pdoc_file_utils_1.PDocFileUtils.normalizeCygwinPath(argv['file']);
        if (dataFileName === undefined) {
            return Promise.reject('option --file expected');
        }
        var srcFile = pdoc_file_utils_1.PDocFileUtils.normalizeCygwinPath(argv['srcFile']);
        if (srcFile === undefined) {
            console.error(srcFile + ' missing parameter - usage: --srcFile SRCFILE', argv);
            return Promise.reject(srcFile + ' missing parameter - usage: --srcFile SRCFILE');
        }
        var renameFileIfExists = !!argv['renameFileIfExists'];
        var fileCheckPromise;
        if (fs.existsSync(dataFileName)) {
            if (!renameFileIfExists) {
                return Promise.reject('exportfile already exists');
            }
            var newFile = dataFileName + '.' + date_utils_1.DateUtils.formatToFileNameDate(new Date(), '', '-', '') + '-migration.MOVED';
            fileCheckPromise = file_utils_1.FileUtils.moveFile(dataFileName, newFile, false);
        }
        else {
            fileCheckPromise = Promise.resolve();
        }
        switch (action) {
            case 'extractPDocViewerFile':
                var src = fs.readFileSync(srcFile, { encoding: 'utf8' });
                var matcher = src.match(/`\s*(\{.*})\s*`\s*;/s);
                if (!matcher || matcher.length !== 2) {
                    promise = Promise.reject('cant extract json');
                    return promise;
                }
                var jsonSrc_1 = matcher[1].replace(/\\\\/g, '\\');
                promise = fileCheckPromise.then(function () {
                    fs.writeFileSync(dataFileName, jsonSrc_1);
                }).catch(function (reason) {
                    return Promise.reject('exportfile already exists and cant be renamed: ' + reason);
                });
                break;
            case 'createPDocViewerFile':
                if (exportId === undefined) {
                    console.error(action + ' missing parameter - usage: --exportId EXPORTID', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportId EXPORTID');
                    return promise;
                }
                var pdocs_1 = JSON.parse(fs.readFileSync(srcFile, { encoding: 'utf8' })).pdocs;
                promise = fileCheckPromise.then(function () {
                    fs.writeFileSync(dataFileName, viewerManagerModule.fullJsonToJsTargetContentConverter(JSON.stringify({ pdocs: pdocs_1 }, undefined, ' '), exportId, 'importStaticDataPDocsJsonP'));
                }).catch(function (reason) {
                    return Promise.reject('exportfile already exists and cant be renamed: ' + reason);
                });
                break;
            case 'migratePDocFileToMapperFile':
                var srcRecords = JSON.parse(fs.readFileSync(srcFile, { encoding: 'utf8' })).pdocs;
                var resultValues_1 = [];
                for (var _i = 0, srcRecords_1 = srcRecords; _i < srcRecords_1.length; _i++) {
                    var doc = srcRecords_1[_i];
                    resultValues_1.push(this.migratePDocRecordToMapperFile(responseMapper, doc));
                }
                promise = fileCheckPromise.then(function () {
                    fs.writeFileSync(dataFileName, JSON.stringify({ pdocs: resultValues_1 }, undefined, ' '));
                }).catch(function (reason) {
                    return Promise.reject('exportfile already exists and cant be renamed: ' + reason);
                });
                break;
            case 'migrateLegacyPDocFile':
                var profiles = argv['profiles'];
                if (profiles === undefined || profiles.length < 2) {
                    return Promise.reject('option --profiles expected');
                }
                var langkeys = argv['langkeys'];
                if (langkeys === undefined || langkeys.length < 2) {
                    return Promise.reject('option --langkeys expected');
                }
                var docs_2 = JSON.parse(fs.readFileSync(srcFile, { encoding: 'utf8' })).pdocs;
                for (var _a = 0, docs_1 = docs_2; _a < docs_1.length; _a++) {
                    var doc = docs_1[_a];
                    this.migrateLegacyPDocRecord(doc, profiles, langkeys);
                }
                promise = fileCheckPromise.then(function () {
                    fs.writeFileSync(dataFileName, JSON.stringify({ pdocs: docs_2 }, undefined, ' '));
                }).catch(function (reason) {
                    return Promise.reject('exportfile already exists and cant be renamed: ' + reason);
                });
                break;
            default:
                console.error('unknown action:', argv);
                return Promise.reject('unknown action');
        }
        return promise;
    };
    PDocConverterCommand.prototype.migrateLegacyPDocRecord = function (doc, profiles, langkeys) {
        var flags = doc.flags
            ? doc.flags.split(',')
            : [];
        for (var _i = 0, _a = [
            'flgShowSearch',
            'flgShowNews',
            'flgShowTopTen',
            'flgShowAdminArea',
            'flgShowDashboard',
            'flgShowStatisticBoard'
        ]; _i < _a.length; _i++) {
            var flag = _a[_i];
            if (doc[flag] === true || doc[flag] === 'true') {
                flags.push(flag.replace('flg', 'flg_'));
            }
        }
        doc.flags = string_utils_1.StringUtils.uniqueKeywords(flags.join(','))
            .join(',');
        doc.profiles = profiles;
        doc.langkeys = langkeys;
        doc.subtype = doc.type;
        doc.type = 'PAGE';
        if (!doc.key) {
            doc.key = doc.id;
        }
    };
    PDocConverterCommand.prototype.migratePDocRecordToMapperFile = function (responseMapper, doc) {
        if (!doc.key) {
            doc.key = doc.id;
        }
        return responseMapper.mapToAdapterDocument({}, doc);
    };
    return PDocConverterCommand;
}(common_admin_command_1.CommonAdminCommand));
exports.PDocConverterCommand = PDocConverterCommand;
//# sourceMappingURL=pdoc-converter.command.js.map