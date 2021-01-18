"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var js_data_1 = require("js-data");
var bean_utils_1 = require("@dps/mycms-commons/dist/commons/utils/bean.utils");
var readdirp = require("readdirp");
var ffmpeg = require("fluent-ffmpeg");
var Promise_serial = require("promise-serial");
var fs = require("fs");
exports.RESOLUTION_SCREENSHOT = 'screenshot';
exports.RESOLUTION_THUMBNAIL = 'preview';
var CommonDocMediaManagerModule = /** @class */ (function () {
    function CommonDocMediaManagerModule(backendConfig, dataService, mediaManager, commonDocExportManager) {
        this.backendConfig = backendConfig;
        this.dataService = dataService;
        this.mediaManager = mediaManager;
        this.commonDocExportManager = commonDocExportManager;
    }
    CommonDocMediaManagerModule.mapDBResultOnFileInfoType = function (dbResult, records) {
        for (var i = 0; i <= dbResult.length; i++) {
            if (dbResult[i] !== undefined) {
                var entry = {
                    dir: undefined,
                    exifDate: undefined,
                    id: undefined,
                    created: undefined,
                    lastModified: undefined,
                    matching: undefined,
                    matchingDetails: undefined,
                    matchingScore: undefined,
                    name: undefined,
                    size: undefined,
                    type: undefined
                };
                for (var key in dbResult[i]) {
                    if (dbResult[i].hasOwnProperty(key)) {
                        entry[key] = dbResult[i][key];
                    }
                }
                records.push(entry);
            }
        }
    };
    CommonDocMediaManagerModule.prototype.exportMediaFiles = function (searchForm, processingOptions) {
        if (!fs.existsSync(processingOptions.exportBasePath)) {
            return Promise.reject('exportBasePath not exists');
        }
        if (!fs.lstatSync(processingOptions.exportBasePath).isDirectory()) {
            return Promise.reject('exportBasePath is no directory');
        }
        return this.commonDocExportManager.exportMediaFiles(searchForm, processingOptions);
    };
    CommonDocMediaManagerModule.prototype.getFileExtensionToTypeMappings = function () {
        return {
            'jpg': 'IMAGE',
            'jpeg': 'IMAGE',
            'JPG': 'IMAGE',
            'JPEG': 'IMAGE',
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
    };
    CommonDocMediaManagerModule.prototype.readAndUpdateMediaDates = function (searchForm, processingOptions) {
        var me = this;
        var callback = function (tdoc) {
            return [me.readAndUpdateDateFromCommonDocRecord(tdoc)];
        };
        return this.dataService.batchProcessSearchResult(searchForm, callback, {
            loadDetailsMode: undefined,
            loadTrack: false,
            showFacets: false,
            showForm: false
        }, processingOptions);
    };
    CommonDocMediaManagerModule.prototype.scaleImagesToDefaultWidth = function (searchForm, processingOptions) {
        var me = this;
        var callback = function (tdoc) {
            return [me.scaleCommonDocRecordMediaWidth(tdoc, 100),
                me.scaleCommonDocRecordMediaWidth(tdoc, 300),
                me.scaleCommonDocRecordMediaWidth(tdoc, 600)];
        };
        return this.dataService.batchProcessSearchResult(searchForm, callback, {
            loadDetailsMode: undefined,
            loadTrack: false,
            showFacets: false,
            showForm: false
        }, processingOptions);
    };
    CommonDocMediaManagerModule.prototype.scaleVideosToDefaultWidth = function (searchForm, processingOptions) {
        var me = this;
        var callback = function (tdoc) {
            return [me.scaleCommonDocRecordMediaWidth(tdoc, 200, exports.RESOLUTION_SCREENSHOT),
                me.scaleCommonDocRecordMediaWidth(tdoc, 200, exports.RESOLUTION_THUMBNAIL),
                me.scaleCommonDocRecordMediaWidth(tdoc, 600)];
        };
        return this.dataService.batchProcessSearchResult(searchForm, callback, {
            loadDetailsMode: undefined,
            loadTrack: false,
            showFacets: false,
            showForm: false
        }, processingOptions);
    };
    CommonDocMediaManagerModule.prototype.readAndUpdateDateFromCommonDocRecord = function (tdoc) {
        var me = this;
        return this.readMetadataForCommonDocRecord(tdoc).then(function (value) {
            // Exif-dates are not in UTC they are in localtimezone
            if (value === undefined || value === null) {
                console.warn('no exif found for ' + tdoc.id + ' details:' + tdoc);
                return js_data_1.utils.resolve({});
            }
            var creationDate = bean_utils_1.BeanUtils.getValue(value, 'exif.DateTimeOriginal');
            if (creationDate === undefined || creationDate === null) {
                creationDate = new Date(bean_utils_1.BeanUtils.getValue(value, 'format.tags.creation_time'));
            }
            if (creationDate === undefined || creationDate === null) {
                console.warn('no exif.DateTimeOriginal or format.tags.creation_time found for ' + tdoc.id +
                    ' details:' + tdoc + ' exif:' + creationDate);
                return js_data_1.utils.resolve({});
            }
            var myDate = new Date();
            myDate.setHours(creationDate.getUTCHours(), creationDate.getUTCMinutes(), creationDate.getUTCSeconds(), creationDate.getUTCMilliseconds());
            myDate.setFullYear(creationDate.getUTCFullYear(), creationDate.getUTCMonth(), creationDate.getUTCDate());
            return me.updateDateOfCommonDocRecord(tdoc, myDate);
        });
    };
    CommonDocMediaManagerModule.prototype.findCorrespondingCommonDocRecordsForMedia = function (baseDir, additionalMappings) {
        var me = this;
        var mediaTypes = this.getFileExtensionToTypeMappings();
        var fileExtensions = [];
        // tslint:disable-next-line:forin
        for (var mediaType in mediaTypes) {
            fileExtensions.push('*.' + mediaType);
        }
        var settings = {
            root: baseDir,
            entryType: 'files',
            // Filter files with js and json extension
            fileFilter: fileExtensions,
            // Filter by directory
            directoryFilter: ['!.git', '!*modules'],
            // Work with files up to 1 subdirectory deep
            depth: 10
        };
        var entries = [];
        return new Promise(function (resolve, reject) {
            readdirp(settings, function fileCallBack(fileRes) {
                var path = fileRes['path'].replace(/\\/g, '/');
                var file = fileRes['name'].replace(/\\/g, '/');
                var dir = fileRes['parentDir'].replace(/\\/g, '/');
                var cdate = fileRes['stat']['ctime'];
                var mdate = fileRes['stat']['mtime'];
                var size = fileRes['stat']['size'];
                var extension = file.split('.').splice(-1);
                var type = mediaTypes[extension];
                if (type === undefined) {
                    console.warn('SKIP file - unknown extension', path);
                    return;
                }
                var fileInfo = {
                    dir: dir,
                    created: cdate,
                    lastModified: mdate,
                    exifDate: undefined,
                    name: file,
                    size: size,
                    type: type
                };
                var records = [];
                entries.push({ file: fileInfo, records: records });
            }, function allCallBack(errors) {
                if (errors) {
                    errors.forEach(function (err) {
                        return reject(err);
                    });
                }
                resolve(entries);
            });
        }).then(function (fileSystemCommonDocSyncEntries) {
            var promises = fileSystemCommonDocSyncEntries.map(function (fileSystemCommonDocSyncEntry) {
                return function () {
                    return me.findCommonDocRecordsForFileInfo(baseDir, fileSystemCommonDocSyncEntry.file, additionalMappings)
                        .then(function (records) {
                        if (records !== undefined) {
                            fileSystemCommonDocSyncEntry.records = records;
                        }
                        return js_data_1.utils.resolve(true);
                    }).catch(function onError(error) {
                        return js_data_1.utils.reject(error);
                    });
                };
            });
            var results = Promise_serial(promises, { parallelize: 1 });
            return results.then(function () {
                return js_data_1.utils.resolve(fileSystemCommonDocSyncEntries);
            }).catch(function (errors) {
                return js_data_1.utils.reject(errors);
            });
        });
    };
    CommonDocMediaManagerModule.prototype.readExifForCommonDocImageRecord = function (tdocImage) {
        return this.mediaManager.readExifForImage(this.backendConfig.apiRoutePicturesStaticDir + '/'
            + (this.backendConfig.apiRouteStoredPicturesResolutionPrefix || '') + 'full/' + tdocImage.fileName);
    };
    CommonDocMediaManagerModule.prototype.readMetadataForCommonDocVideoRecord = function (tdocVideo) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            ffmpeg.ffprobe(_this.backendConfig.apiRouteVideosStaticDir + '/'
                + (_this.backendConfig.apiRouteStoredVideosResolutionPrefix || '') + 'full/' + tdocVideo.fileName, function (err, metadata) {
                if (err) {
                    reject('error while reading video-metadata: ' + err);
                }
                resolve(metadata);
            });
        });
    };
    CommonDocMediaManagerModule.prototype.scaleCommonDocImageRecord = function (tdocImage, width) {
        return this.mediaManager.scaleImage(this.backendConfig.apiRoutePicturesStaticDir + '/'
            + (this.backendConfig.apiRouteStoredPicturesResolutionPrefix || '') + 'full/' + tdocImage.fileName, this.backendConfig.apiRoutePicturesStaticDir + '/'
            + (this.backendConfig.apiRouteStoredPicturesResolutionPrefix || '') + 'x' + width + '/' + tdocImage.fileName, width);
    };
    CommonDocMediaManagerModule.prototype.scaleCommonDocVideoRecord = function (tdocVideo, width, addResolutionType) {
        switch (addResolutionType) {
            case exports.RESOLUTION_SCREENSHOT:
                return this.mediaManager.generateVideoScreenshot(this.backendConfig.apiRouteVideosStaticDir + '/'
                    + (this.backendConfig.apiRouteStoredVideosResolutionPrefix || '') + 'full/' + tdocVideo.fileName, this.backendConfig.apiRouteVideosStaticDir + '/'
                    + (this.backendConfig.apiRouteStoredVideosResolutionPrefix || '') + 'screenshot' + '/' + tdocVideo.fileName, width, true);
            case exports.RESOLUTION_THUMBNAIL:
                return this.mediaManager.generateVideoPreview(this.backendConfig.apiRouteVideosStaticDir + '/'
                    + (this.backendConfig.apiRouteStoredVideosResolutionPrefix || '') + 'full/' + tdocVideo.fileName, this.backendConfig.apiRouteVideosStaticDir + '/'
                    + (this.backendConfig.apiRouteStoredVideosResolutionPrefix || '') + 'thumbnail' + '/' + tdocVideo.fileName, width, true);
            default:
                return this.mediaManager.scaleVideoMP4(this.backendConfig.apiRouteVideosStaticDir + '/'
                    + (this.backendConfig.apiRouteStoredVideosResolutionPrefix || '') + 'full/' + tdocVideo.fileName, this.backendConfig.apiRouteVideosStaticDir + '/'
                    + (this.backendConfig.apiRouteStoredVideosResolutionPrefix || '') + 'x' + width + '/' + tdocVideo.fileName, width, true);
        }
    };
    return CommonDocMediaManagerModule;
}());
exports.CommonDocMediaManagerModule = CommonDocMediaManagerModule;
//# sourceMappingURL=cdoc-media-manager.module.js.map