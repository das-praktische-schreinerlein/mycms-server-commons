"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var pathLib = require("path");
var file_utils_1 = require("@dps/mycms-commons/dist/commons/utils/file.utils");
var CommonDocMediaFileExportManager = /** @class */ (function () {
    function CommonDocMediaFileExportManager(baseDir, playlistService) {
        this.baseDir = baseDir;
        this.playlistService = playlistService;
    }
    CommonDocMediaFileExportManager.prototype.exportMediaRecordFiles = function (mdoc, exportProcessingOptions) {
        var me = this;
        var mdocAudios = this.getDetailAudioRecords(mdoc);
        var mdocImages = this.getDetailImageRecords(mdoc);
        var mdocVideos = this.getDetailVideoRecords(mdoc);
        var promises = [];
        if (mdocAudios !== undefined && mdocAudios.length === 1 &&
            exportProcessingOptions.audioResolutions !== undefined) {
            exportProcessingOptions.audioResolutions.forEach(function (resolution) {
                promises.push(me.exportMediaRecordFile(mdoc, mdocAudios[0], 'audio', resolution, exportProcessingOptions));
            });
        }
        if (mdocVideos !== undefined && mdocVideos.length === 1 &&
            exportProcessingOptions.videoResolutions !== undefined) {
            exportProcessingOptions.videoResolutions.forEach(function (resolution) {
                promises.push(me.exportMediaRecordFile(mdoc, mdocVideos[0], 'video', resolution, exportProcessingOptions));
            });
        }
        if (mdocImages !== undefined && mdocImages.length === 1 &&
            exportProcessingOptions.imageResolutions !== undefined) {
            exportProcessingOptions.imageResolutions.forEach(function (resolution) {
                promises.push(me.exportMediaRecordFile(mdoc, mdocImages[0], 'image', resolution, exportProcessingOptions));
            });
        }
        if (promises.length === 0) {
            return Promise.reject('no mediafile');
        }
        return Promise.all(promises).then(function (results) {
            var allMappings = {};
            results.forEach(function (result) {
                allMappings = __assign({}, allMappings, result.mediaFileMappings);
            });
            var result = {
                record: mdoc,
                exportFileEntry: results[0].exportFileEntry,
                mediaFileMappings: allMappings,
                externalRecordFieldMappings: undefined
            };
            return Promise.resolve(result);
        });
    };
    CommonDocMediaFileExportManager.prototype.exportMediaRecordFile = function (mdoc, mediaRecord, type, resolution, exportProcessingOptions) {
        var err = file_utils_1.FileUtils.checkDirPath(exportProcessingOptions.exportBasePath, true, false, true);
        if (err) {
            return Promise.reject('exportBasePath is invalid: ' + err);
        }
        var exportDir = this.generateMediaDirForProfile(mdoc, mediaRecord, type, exportProcessingOptions);
        var exportFile = this.generateMediaFileNameForProfile(mdoc, mediaRecord, type, exportProcessingOptions);
        var srcPath = this.generateResolutionPath(resolution, this.baseDir, mediaRecord.fileName);
        var destPath = this.generateResolutionPath(resolution, exportProcessingOptions.exportBasePath, exportDir + '/' + exportFile);
        var mappings = {};
        switch (type) {
            case 'audio':
                mappings.audioFile = exportDir + '/' + exportFile;
                break;
            case 'image':
                mappings.imageFile = exportDir + '/' + exportFile;
                break;
            case 'video':
                mappings.videoFile = exportDir + '/' + exportFile;
                break;
        }
        return file_utils_1.FileUtils.copyFile(srcPath, destPath, true).then(function () {
            var result = {
                exportFileEntry: exportDir + '/' + exportFile,
                record: mdoc,
                mediaFileMappings: mappings,
                externalRecordFieldMappings: undefined
            };
            return Promise.resolve(result);
        });
    };
    CommonDocMediaFileExportManager.prototype.generateResolutionPath = function (resolution, baseDir, filePath) {
        if (resolution === undefined) {
            return baseDir + '/' + filePath;
        }
        return baseDir + '/' +
            (resolution.pathPrefix ? resolution.pathPrefix + '/' : '') +
            filePath +
            (resolution.fileNameSuffix ? resolution.fileNameSuffix : '');
    };
    CommonDocMediaFileExportManager.prototype.generatePlaylistEntry = function (mdoc, mediaRecord, type, exportPath) {
        return this.playlistService.generateM3uEntityInfo(mdoc) + '\n' + exportPath;
    };
    CommonDocMediaFileExportManager.prototype.generateMediaDirForProfile = function (mdoc, mediaRecord, type, exportProcessingOptions) {
        if (mediaRecord === undefined) {
            return undefined;
        }
        if (exportProcessingOptions.fileNameProfile === CommonDocMediaFileExportManager.PROFILE_FLAT) {
            return '';
        }
        return pathLib.dirname(mediaRecord.fileName);
    };
    CommonDocMediaFileExportManager.prototype.generateMediaFileNameForProfile = function (mdoc, mediaRecord, type, exportProcessingOptions) {
        if (mediaRecord === undefined) {
            return undefined;
        }
        if (exportProcessingOptions.fileNameProfile === CommonDocMediaFileExportManager.PROFILE_FLAT) {
            return mediaRecord.fileName.replace(/[\/\\]/g, '_');
        }
        return pathLib.basename(mediaRecord.fileName);
    };
    CommonDocMediaFileExportManager.PROFILE_FLAT = 'flat';
    return CommonDocMediaFileExportManager;
}());
exports.CommonDocMediaFileExportManager = CommonDocMediaFileExportManager;
//# sourceMappingURL=cdoc-mediafile-export.service.js.map