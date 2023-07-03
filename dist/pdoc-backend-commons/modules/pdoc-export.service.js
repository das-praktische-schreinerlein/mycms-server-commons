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
var cdoc_export_service_1 = require("@dps/mycms-commons/dist/search-commons/services/cdoc-export.service");
var PDocExportService = /** @class */ (function (_super) {
    __extends(PDocExportService, _super);
    function PDocExportService(backendConfig, dataService, playlistService, responseMapper) {
        return _super.call(this, backendConfig, dataService, playlistService, responseMapper) || this;
    }
    PDocExportService.prototype.exportMediaRecordFiles = function (pdoc, processingOptions, exportResults) {
        if (pdoc === undefined) {
            return Promise.reject('pdoc required');
        }
        return new Promise(function (resolve) {
            var exportResult = {
                record: pdoc,
                exportFileEntry: undefined,
                mediaFileMappings: undefined,
                externalRecordFieldMappings: undefined
            };
            exportResults.push(exportResult);
            return resolve(exportResult);
        });
    };
    PDocExportService.prototype.generatePlaylistEntry = function (pdoc, file) {
        return undefined;
    };
    PDocExportService.prototype.generatePlaylistForExportResults = function (processingOptions, exportResults) {
        return Promise.resolve('');
    };
    PDocExportService.prototype.checkIdToRead = function (doc, idsRead) {
        for (var _i = 0, _a = ['PAGE']; _i < _a.length; _i++) {
            var type = _a[_i];
            if (idsRead[type] === undefined) {
                idsRead[type] = {};
            }
        }
        var idsToRead = [];
        if (['PAGE'].includes(doc.type)) {
        }
        return idsToRead;
    };
    PDocExportService.prototype.convertAdapterDocValues = function (mdoc, idMediaFileMappings, idRecordFieldMappings) {
        if (mdoc['id'] === undefined) {
            return mdoc;
        }
        if (idMediaFileMappings[mdoc['id']] !== undefined) {
            mdoc['a_fav_url_txt'] = idMediaFileMappings[mdoc['id']].audioFile;
            mdoc['i_fav_url_txt'] = idMediaFileMappings[mdoc['id']].imageFile;
            mdoc['v_fav_url_txt'] = idMediaFileMappings[mdoc['id']].videoFile;
        }
        if (idRecordFieldMappings[mdoc['id']] !== undefined) {
            mdoc = __assign({}, mdoc, idRecordFieldMappings[mdoc['id']]);
        }
        return mdoc;
    };
    return PDocExportService;
}(cdoc_export_service_1.CommonDocDocExportService));
exports.PDocExportService = PDocExportService;
//# sourceMappingURL=pdoc-export.service.js.map