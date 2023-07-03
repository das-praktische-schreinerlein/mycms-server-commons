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
var cdoc_transport_module_1 = require("../../backend-commons/modules/cdoc-transport.module");
var common_admin_command_1 = require("../../backend-commons/commands/common-admin.command");
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var date_utils_1 = require("@dps/mycms-commons/dist/commons/utils/date.utils");
var file_utils_1 = require("@dps/mycms-commons/dist/commons/utils/file.utils");
var pdoc_file_utils_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-file.utils");
var pdoc_dataservice_module_1 = require("../modules/pdoc-dataservice.module");
var pdoc_adapter_response_mapper_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper");
var PDocLoaderCommand = /** @class */ (function (_super) {
    __extends(PDocLoaderCommand, _super);
    function PDocLoaderCommand() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PDocLoaderCommand.prototype.createValidationRules = function () {
        return {
            backend: new generic_validator_util_1.SimpleConfigFilePathValidationRule(true),
            file: new generic_validator_util_1.SimpleFilePathValidationRule(true),
            renameFileAfterSuccess: new generic_validator_util_1.WhiteListValidationRule(false, [true, false, 'true', 'false'], false)
        };
    };
    PDocLoaderCommand.prototype.definePossibleActions = function () {
        return ['loadDocs'];
    };
    PDocLoaderCommand.prototype.processCommandArgs = function (argv) {
        var typeOrder = ['page'];
        var filePathConfigJson = argv['backend'];
        if (filePathConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required backendConfig: "--backend"');
        }
        var serverConfig = {
            backendConfig: JSON.parse(fs.readFileSync(filePathConfigJson, { encoding: 'utf8' })),
            readOnly: false
        };
        var dataFileName = pdoc_file_utils_1.PDocFileUtils.normalizeCygwinPath(argv['file']);
        if (dataFileName === undefined) {
            return Promise.reject('option --file expected');
        }
        var renameFileOption = !!argv['renameFileAfterSuccess'];
        var dataService = pdoc_dataservice_module_1.PDocDataServiceModule.getDataService('pdocDB', serverConfig.backendConfig);
        dataService.setWritable(true);
        var responseMapper = new pdoc_adapter_response_mapper_1.PDocAdapterResponseMapper(serverConfig.backendConfig);
        var transporter = new cdoc_transport_module_1.CommonDocTransportModule();
        var recordSrcs = pdoc_file_utils_1.PDocFileUtils.parseRecordSourceFromJson(fs.readFileSync(dataFileName, { encoding: 'utf8' }));
        return transporter.loadDocs(recordSrcs, typeOrder, responseMapper, dataService).then(function () {
            var promise;
            if (renameFileOption) {
                var newFile = dataFileName + '.' + date_utils_1.DateUtils.formatToFileNameDate(new Date(), '', '-', '') + '-import.DONE';
                promise = file_utils_1.FileUtils.moveFile(dataFileName, newFile, false, true, false);
            }
            else {
                promise = Promise.resolve();
            }
            return promise.then(function () {
                return Promise.resolve('file imported');
            }).catch(function (reason) {
                return Promise.resolve('file imported but cant be renamed: ' + reason);
            });
        });
    };
    return PDocLoaderCommand;
}(common_admin_command_1.CommonAdminCommand));
exports.PDocLoaderCommand = PDocLoaderCommand;
//# sourceMappingURL=pdoc-loader.command.js.map