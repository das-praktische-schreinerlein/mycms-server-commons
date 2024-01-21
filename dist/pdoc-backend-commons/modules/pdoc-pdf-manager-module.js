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
var string_utils_1 = require("@dps/mycms-commons/dist/commons/utils/string.utils");
var cdoc_pdf_manager_module_1 = require("../../backend-commons/modules/cdoc-pdf-manager-module");
var PagePdfManagerModule = /** @class */ (function (_super) {
    __extends(PagePdfManagerModule, _super);
    function PagePdfManagerModule(dataService, pdfManager, sitemapConfig) {
        var _this = _super.call(this, dataService, pdfManager) || this;
        _this.sitemapConfig = sitemapConfig;
        return _this;
    }
    PagePdfManagerModule.prototype.exportCommonDocRecordPdfFile = function (mdoc, action, exportDir, exportName, processingOptions) {
        return this.generatePdf(mdoc, action, exportDir, this.sitemapConfig.showBaseUrl, undefined, processingOptions, false);
    };
    PagePdfManagerModule.prototype.generateWebShotUrl = function (action, baseUrl, mdoc, queryParams) {
        return baseUrl + '/' + mdoc.key + '?print&' + queryParams;
    };
    PagePdfManagerModule.prototype.generatePdfFileName = function (entity) {
        if (!entity) {
            return undefined;
        }
        var name = string_utils_1.StringUtils.generateTechnicalName(entity.name);
        var baseName = [entity.type, entity.sortkey, entity.key, entity.id].join('_') + '.pdf';
        if ([baseName, name].join('_').length > 140) {
            name = name.substring(0, 135 - baseName.length);
        }
        return [entity.type, entity.sortkey, entity.key,
            name,
            entity.id].join('_') + '.pdf';
    };
    PagePdfManagerModule.prototype.updatePdfEntity = function (entity, fileName) {
        return Promise.resolve(entity);
    };
    return PagePdfManagerModule;
}(cdoc_pdf_manager_module_1.CommonDocPdfManagerModule));
exports.PagePdfManagerModule = PagePdfManagerModule;
//# sourceMappingURL=pdoc-pdf-manager-module.js.map