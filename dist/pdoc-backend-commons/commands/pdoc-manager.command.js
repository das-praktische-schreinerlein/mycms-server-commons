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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var common_admin_command_1 = require("../../backend-commons/commands/common-admin.command");
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var pdoc_export_service_1 = require("../modules/pdoc-export.service");
var pdoc_serverplaylist_service_1 = require("../modules/pdoc-serverplaylist.service");
var pdoc_adapter_response_mapper_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper");
var pdoc_dataservice_module_1 = require("../modules/pdoc-dataservice.module");
var js_data_1 = require("js-data");
var pdoc_searchform_1 = require("@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform");
var viewer_manager_module_1 = require("../../media-commons/modules/viewer-manager.module");
var PageManagerCommand = /** @class */ (function (_super) {
    __extends(PageManagerCommand, _super);
    function PageManagerCommand() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PageManagerCommand.prototype.createValidationRules = function () {
        return {
            action: new generic_validator_util_1.KeywordValidationRule(true),
            backend: new generic_validator_util_1.SimpleConfigFilePathValidationRule(true),
            exportDir: new generic_validator_util_1.SimpleFilePathValidationRule(false),
            exportName: new generic_validator_util_1.SimpleFilePathValidationRule(false),
            exportId: new generic_validator_util_1.SimpleFilePathValidationRule(false),
            ignoreErrors: new generic_validator_util_1.NumberValidationRule(false, 1, 999999999, 10),
            parallel: new generic_validator_util_1.NumberValidationRule(false, 1, 99, 10),
            pageNum: new generic_validator_util_1.NumberValidationRule(false, 1, 999999999, 1),
            fulltext: new generic_validator_util_1.SolrValidationRule(false),
            profiles: new generic_validator_util_1.IdCsvValidationRule(false),
            langkeys: new generic_validator_util_1.IdCsvValidationRule(false),
            directoryProfile: new generic_validator_util_1.KeywordValidationRule(false),
            fileNameProfile: new generic_validator_util_1.KeywordValidationRule(false)
        };
    };
    PageManagerCommand.prototype.definePossibleActions = function () {
        return [
            'exportPDocFile', 'exportPDocViewerFile', 'exportPageFile'
        ];
    };
    PageManagerCommand.prototype.processCommandArgs = function (argv) {
        var filePathConfigJson = argv['backend'];
        if (filePathConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required backendConfig: "--backend"');
        }
        var action = argv['action'];
        var backendConfig = JSON.parse(fs.readFileSync(filePathConfigJson, { encoding: 'utf8' }));
        var dataService = pdoc_dataservice_module_1.PDocDataServiceModule.getDataService('pdocSolrReadOnly', backendConfig);
        var viewerManagerModule = new viewer_manager_module_1.ViewerManagerModule();
        var promise;
        var searchForm;
        var exportDir = argv['exportDir'];
        var exportName = argv['exportName'];
        var profiles = argv['profiles'];
        var langkeys = argv['langkeys'];
        var exportId = argv['exportId'];
        var type = 'UNKNOWN';
        switch (action) {
            case 'exportPageFile':
            case 'exportPDocFile':
            case 'exportPDocViewerFile':
                type = 'page';
                break;
        }
        switch (action) {
            case 'exportPDocFile':
            case 'exportPDocViewerFile':
                if (exportDir === undefined) {
                    console.error(action + ' missing parameter - usage: --exportDir EXPORTDIR', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportDir EXPORTDIR');
                    return promise;
                }
                if (exportName === undefined) {
                    console.error(action + ' missing parameter - usage: --exportName EXPORTNAME', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportName EXPORTNAME');
                    return promise;
                }
                searchForm = new pdoc_searchform_1.PDocSearchForm({
                    type: type,
                    profiles: profiles,
                    langkeys: langkeys,
                    sort: 'forExport',
                    perPage: 9999
                });
                promise = dataService.findCurList(searchForm).then(function (pdocs) {
                    if (action === 'exportPDocViewerFile') {
                        if (exportId === undefined) {
                            console.error(action + ' missing parameter - usage: --exportId EXPORTID', argv);
                            promise = Promise.reject(action + ' missing parameter - usage: --exportId EXPORTID');
                            return promise;
                        }
                        var fileName = exportDir + '/' + exportName + '.js';
                        fs.writeFileSync(fileName, viewerManagerModule.fullJsonToJsTargetContentConverter(JSON.stringify({ pdocs: pdocs }, undefined, ' '), exportId, 'importStaticDataPDocsJsonP'));
                    }
                    else {
                        fs.writeFileSync(exportDir + '/' + exportName + '.json', JSON.stringify({ pdocs: pdocs }, undefined, ' '));
                    }
                });
                break;
            case 'exportPageFile':
                var playlistService = new pdoc_serverplaylist_service_1.PDocServerPlaylistService();
                var responseMapper = new pdoc_adapter_response_mapper_1.PDocAdapterResponseMapper(backendConfig);
                var pdocExportService = new pdoc_export_service_1.PDocExportService(backendConfig, dataService, playlistService, responseMapper);
                var processingOptions = {
                    ignoreErrors: Number.parseInt(argv['ignoreErrors'], 10) || 0,
                    parallel: Number.parseInt(argv['parallel'], 10),
                };
                var pageNum = Number.parseInt(argv['pageNum'], 10);
                var fulltext = argv['fulltext'];
                if (exportDir === undefined) {
                    console.error(action + ' missing parameter - usage: --exportDir EXPORTDIR', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportDir EXPORTDIR');
                    return promise;
                }
                if (exportName === undefined) {
                    console.error(action + ' missing parameter - usage: --exportName EXPORTNAME', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportName EXPORTNAME');
                    return promise;
                }
                var directoryProfile = argv['directoryProfile'];
                if (directoryProfile === undefined) {
                    console.error(action + ' missing parameter - usage: --directoryProfile directoryProfile', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --directoryProfile directoryProfile');
                    return promise;
                }
                var fileNameProfile = argv['fileNameProfile'];
                if (fileNameProfile === undefined) {
                    console.error(action + ' missing parameter - usage: --fileNameProfile fileNameProfile', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --fileNameProfile fileNameProfile');
                    return promise;
                }
                processingOptions.parallel = Number.isInteger(processingOptions.parallel) ? processingOptions.parallel : 1;
                searchForm = new pdoc_searchform_1.PDocSearchForm({
                    type: type,
                    fulltext: fulltext,
                    profiles: profiles,
                    langkeys: langkeys,
                    sort: 'forExport',
                    pageNum: Number.isInteger(pageNum) ? pageNum : 1
                });
                console.log('START processing: ' + action, searchForm, exportDir, processingOptions);
                promise = pdocExportService.exportMediaFiles(searchForm, __assign({}, processingOptions, { exportBasePath: exportDir, exportBaseFileName: exportName, directoryProfile: directoryProfile, fileNameProfile: fileNameProfile, jsonBaseElement: 'pdocs' }));
                break;
            default:
                console.error('unknown action:', argv);
                promise = js_data_1.utils.reject('unknown action');
        }
        return promise;
    };
    return PageManagerCommand;
}(common_admin_command_1.CommonAdminCommand));
exports.PageManagerCommand = PageManagerCommand;
//# sourceMappingURL=pdoc-manager.command.js.map