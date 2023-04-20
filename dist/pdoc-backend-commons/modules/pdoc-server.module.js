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
var pdoc_searchform_1 = require("@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform");
var cdoc_server_module_1 = require("../../backend-commons/modules/cdoc-server.module");
var PDocServerModule = /** @class */ (function (_super) {
    __extends(PDocServerModule, _super);
    function PDocServerModule(dataService, cache) {
        var _this = _super.call(this, dataService, cache) || this;
        _this.dataService = dataService;
        _this.cache = cache;
        return _this;
    }
    PDocServerModule.configureRoutes = function (app, apiPrefix, dataService, cache, backendConfig) {
        var pdocServerModule = new PDocServerModule(dataService, cache);
        cdoc_server_module_1.CommonDocServerModule.configureServerRoutes(app, apiPrefix, pdocServerModule, cache, backendConfig);
        return pdocServerModule;
    };
    PDocServerModule.prototype.getApiId = function () {
        return 'pdoc';
    };
    PDocServerModule.prototype.getApiResolveParameterName = function () {
        return 'resolvePdocByPdocId';
    };
    PDocServerModule.prototype.isSearchFormValid = function (searchForm) {
        return pdoc_searchform_1.PDocSearchFormValidator.isValid(searchForm);
    };
    return PDocServerModule;
}(cdoc_server_module_1.CommonDocServerModule));
exports.PDocServerModule = PDocServerModule;
//# sourceMappingURL=pdoc-server.module.js.map