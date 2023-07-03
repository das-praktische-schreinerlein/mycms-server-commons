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
var cdoc_playlist_service_1 = require("@dps/mycms-commons/dist/search-commons/services/cdoc-playlist.service");
var PDocServerPlaylistService = /** @class */ (function (_super) {
    __extends(PDocServerPlaylistService, _super);
    function PDocServerPlaylistService() {
        return _super.call(this) || this;
    }
    PDocServerPlaylistService.prototype.generateM3uEntityPath = function (pathPrefix, record) {
        return undefined;
    };
    PDocServerPlaylistService.prototype.generateM3uEntityInfo = function (record) {
        if (!record || !record.name) {
            return undefined;
        }
        return '#EXTINF:-1,' + record.name;
    };
    return PDocServerPlaylistService;
}(cdoc_playlist_service_1.CommonDocPlaylistService));
exports.PDocServerPlaylistService = PDocServerPlaylistService;
//# sourceMappingURL=pdoc-serverplaylist.service.js.map