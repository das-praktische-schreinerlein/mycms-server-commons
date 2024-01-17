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
var pdoc_file_utils_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-file.utils");
var pdoc_dataservice_module_1 = require("../modules/pdoc-dataservice.module");
var pdoc_pdf_manager_module_1 = require("../modules/pdoc-pdf-manager-module");
var pdoc_export_manager_utils_1 = require("../modules/pdoc-export-manager.utils");
var PDocPdfManagerCommand = /** @class */ (function (_super) {
    __extends(PDocPdfManagerCommand, _super);
    function PDocPdfManagerCommand() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PDocPdfManagerCommand.prototype.createValidationRules = function () {
        return __assign({ action: new generic_validator_util_1.KeywordValidationRule(true), backend: new generic_validator_util_1.SimpleConfigFilePathValidationRule(true), sitemap: new generic_validator_util_1.SimpleConfigFilePathValidationRule(true), baseUrl: new generic_validator_util_1.HtmlValidationRule(false), queryParams: new generic_validator_util_1.HtmlValidationRule(false) }, pdoc_export_manager_utils_1.PDocExportManagerUtils.createExportValidationRules(), pdoc_export_manager_utils_1.PDocExportManagerUtils.createPDocSearchFormValidationRules());
    };
    PDocPdfManagerCommand.prototype.definePossibleActions = function () {
        return [
            'exportPagePdfs',
            'generateDefaultPagePdfs',
            'generateExternalPagePdfs'
        ];
    };
    PDocPdfManagerCommand.prototype.processCommandArgs = function (argv) {
        // importDir and outputDir are used in CommonMediaManagerCommand too
        argv['exportDir'] = pdoc_file_utils_1.PDocFileUtils.normalizeCygwinPath(argv['exportDir']);
        var filePathConfigJson = argv['backend'];
        if (filePathConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required backendConfig: "--backend"');
        }
        var filePathSitemapConfigJson = argv['sitemap'];
        if (filePathSitemapConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required sitemapConfig: "--sitemap"');
        }
        var action = argv['action'];
        var backendConfig = JSON.parse(fs.readFileSync(filePathConfigJson, { encoding: 'utf8' }));
        var sitemapConfig = JSON.parse(fs.readFileSync(filePathSitemapConfigJson, { encoding: 'utf8' }));
        // @ts-ignore
        var writable = backendConfig.pdocWritable === true || backendConfig.pdocWritable === 'true';
        var dataService = pdoc_dataservice_module_1.PDocDataServiceModule.getDataService('pdocSolrReadOnly', backendConfig);
        if (writable) {
            dataService.setWritable(true);
        }
        var pdfManagerModule = new pdoc_pdf_manager_module_1.PagePdfManagerModule(dataService, backendConfig, sitemapConfig);
        var promise;
        var processingOptions = {
            ignoreErrors: Number.parseInt(argv['ignoreErrors'], 10) || 0,
            parallel: Number.parseInt(argv['parallel'], 10),
        };
        var force = argv['force'] === true || argv['force'] === 'true';
        var generatePdfsType = this.getGenerateTypeFromAction(action);
        var generateName = generatePdfsType;
        var generateQueryParams = argv['queryParams'] !== undefined
            ? argv['queryParams']
            : '';
        var baseUrl = argv['baseUrl'];
        var exportPdfsType = this.getExportTypeFromAction(action);
        var exportDir = argv['exportDir'];
        var exportName = argv['exportName'];
        switch (action) {
            case 'generateDefaultPagePdfs':
                console.log('DO generate searchform for : ' + action, processingOptions);
                promise = pdoc_export_manager_utils_1.PDocExportManagerUtils.createPDocSearchForm(generatePdfsType, argv).then(function (searchForm) {
                    console.log('START processing: ' + action, backendConfig.apiRoutePdfsStaticDir, searchForm, processingOptions);
                    return pdfManagerModule.generatePdfs(action, backendConfig.apiRoutePdfsStaticDir, generateName, sitemapConfig.showBaseUrl, generateQueryParams, processingOptions, searchForm, force);
                });
                break;
            case 'generateExternalPagePdfs':
                console.log('DO generate searchform for : ' + action, processingOptions);
                promise = pdoc_export_manager_utils_1.PDocExportManagerUtils.createPDocSearchForm(generatePdfsType, argv).then(function (searchForm) {
                    console.log('START processing: ' + action, exportDir, searchForm, processingOptions);
                    return pdfManagerModule.generatePdfs(action, exportDir, exportName, baseUrl, generateQueryParams, processingOptions, searchForm, force);
                });
                break;
            case 'exportPagePdfs':
                console.log('DO generate searchform for : ' + action, processingOptions);
                promise = pdoc_export_manager_utils_1.PDocExportManagerUtils.createPDocSearchForm(exportPdfsType, argv).then(function (searchForm) {
                    console.log('START processing: ' + action, exportDir, searchForm, processingOptions);
                    return pdfManagerModule.exportPdfs(action, exportDir, exportName, processingOptions, searchForm, force);
                });
                break;
        }
        return promise;
    };
    PDocPdfManagerCommand.prototype.getGenerateTypeFromAction = function (action) {
        return 'PAGE';
    };
    PDocPdfManagerCommand.prototype.getExportTypeFromAction = function (action) {
        return 'PAGE';
    };
    return PDocPdfManagerCommand;
}(common_admin_command_1.CommonAdminCommand));
exports.PDocPdfManagerCommand = PDocPdfManagerCommand;
//# sourceMappingURL=pdoc-pdf-manager.command.js.map