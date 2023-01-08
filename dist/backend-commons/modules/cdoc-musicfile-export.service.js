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
var pathLib = require("path");
var name_utils_1 = require("@dps/mycms-commons/dist/commons/utils/name.utils");
var cdoc_mediafile_export_service_1 = require("./cdoc-mediafile-export.service");
var CommonDocMusicFileExportManager = /** @class */ (function (_super) {
    __extends(CommonDocMusicFileExportManager, _super);
    function CommonDocMusicFileExportManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CommonDocMusicFileExportManager.prototype.generatePlaylistEntry = function (mdoc, mediaRecord, type, exportPath) {
        return this.playlistService.generateM3uEntityInfo(mdoc) + '\n' + exportPath;
    };
    CommonDocMusicFileExportManager.prototype.generateMediaDirForProfile = function (mdoc, mediaRecord, mediaType, exportProcessingOptions) {
        if (mediaRecord === undefined) {
            return undefined;
        }
        if (exportProcessingOptions.directoryProfile === CommonDocMusicFileExportManager.PROFILE_FLAT) {
            return [name_utils_1.NameUtils.normalizeFileNames(mdoc.albumGenre ? mdoc.albumGenre : mdoc.genre)].join('/');
        }
        return [name_utils_1.NameUtils.normalizeFileNames(mdoc.albumGenre ? mdoc.albumGenre : mdoc.genre),
            name_utils_1.NameUtils.normalizeFileNames(mdoc.albumArtist ? mdoc.albumArtist : mdoc.artist),
            name_utils_1.NameUtils.normalizeFileNames(mdoc.album)].join('/');
    };
    CommonDocMusicFileExportManager.prototype.generateMediaFileNameForProfile = function (mdoc, mediaRecord, type, exportProcessingOptions) {
        if (mediaRecord === undefined) {
            return undefined;
        }
        if (type === 'image') {
            return ('cover-' +
                name_utils_1.NameUtils.normalizeFileNames(mdoc.artist) +
                '-' +
                name_utils_1.NameUtils.normalizeFileNames(mdoc.album) +
                pathLib.extname(mediaRecord.fileName)).replace(/ /g, '_');
        }
        var fileParts = [];
        if (exportProcessingOptions.fileNameProfile === CommonDocMusicFileExportManager.PROFILE_FLAT) {
            if (mdoc.albumArtist && mdoc.albumArtist !== mdoc.artist) {
                fileParts.push(name_utils_1.NameUtils.normalizeFileNames(mdoc.album));
            }
            fileParts.push(name_utils_1.NameUtils.normalizeFileNames(mdoc.artist));
            fileParts.push(name_utils_1.NameUtils.normalizeFileNames(mdoc.trackNo + '').padStart(2, '0'));
            fileParts.push(name_utils_1.NameUtils.normalizeFileNames(mdoc.name));
        }
        else {
            fileParts.push(name_utils_1.NameUtils.normalizeFileNames(mdoc.trackNo + '').padStart(2, '0'));
            if (mdoc.albumArtist && mdoc.albumArtist !== mdoc.artist) {
                fileParts.push(name_utils_1.NameUtils.normalizeFileNames(mdoc.artist));
            }
            fileParts.push(name_utils_1.NameUtils.normalizeFileNames(mdoc.name));
        }
        return fileParts.join(' - ') + pathLib.extname(mediaRecord.fileName);
    };
    return CommonDocMusicFileExportManager;
}(cdoc_mediafile_export_service_1.CommonDocMediaFileExportManager));
exports.CommonDocMusicFileExportManager = CommonDocMusicFileExportManager;
//# sourceMappingURL=cdoc-musicfile-export.service.js.map