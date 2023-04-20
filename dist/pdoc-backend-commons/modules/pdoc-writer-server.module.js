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
var cdoc_writer_server_module_1 = require("../../backend-commons/modules/cdoc-writer-server.module");
var pdoc_adapter_response_mapper_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper");
var PDocWriterServerModule = /** @class */ (function (_super) {
    __extends(PDocWriterServerModule, _super);
    function PDocWriterServerModule(pdocServerModule) {
        return _super.call(this, pdocServerModule, new pdoc_adapter_response_mapper_1.PDocAdapterResponseMapper({})) || this;
    }
    PDocWriterServerModule.configureRoutes = function (app, apiPrefix, pdocServerModule) {
        var pdocWriterServerModule = new PDocWriterServerModule(pdocServerModule);
        cdoc_writer_server_module_1.CommonDocWriterServerModule.configureServerRoutes(app, apiPrefix, pdocWriterServerModule);
        return pdocWriterServerModule;
    };
    return PDocWriterServerModule;
}(cdoc_writer_server_module_1.CommonDocWriterServerModule));
exports.PDocWriterServerModule = PDocWriterServerModule;
//# sourceMappingURL=pdoc-writer-server.module.js.map