"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var js_data_1 = require("js-data");
var bean_utils_1 = require("@dps/mycms-commons/dist/commons/utils/bean.utils");
var readdirp = require("readdirp");
var ffmpeg = require("fluent-ffmpeg");
var Promise_serial = require("promise-serial");
var CommonDocMediaManagerModule = /** @class */ (function () {
    function CommonDocMediaManagerModule(backendConfig, dataService, mediaManager) {
        this.dataService = dataService;
        this.backendConfig = backendConfig;
        this.mediaManager = mediaManager;
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
        return this.batchProcessSearchResult(searchForm, callback, {
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
        return this.batchProcessSearchResult(searchForm, callback, {
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
        return this.mediaManager.readExifForImage(this.backendConfig['apiRoutePicturesStaticDir'] + '/'
            + (this.backendConfig['apiRouteStoredPicturesResolutionPrefix'] || '') + 'full/' + tdocImage.fileName);
    };
    CommonDocMediaManagerModule.prototype.readMetadataForCommonDocVideoRecord = function (tdocVideo) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            ffmpeg.ffprobe(_this.backendConfig['apiRouteVideosStaticDir'] + '/'
                + (_this.backendConfig['apiRouteStoredVideosResolutionPrefix'] || '') + 'full/' + tdocVideo.fileName, function (err, metadata) {
                if (err) {
                    reject('error while reading video-metadata: ' + err);
                }
                resolve(metadata);
            });
        });
    };
    CommonDocMediaManagerModule.prototype.scaleCommonDocImageRecord = function (tdocImage, width) {
        return this.mediaManager.scaleImage(this.backendConfig['apiRoutePicturesStaticDir'] + '/'
            + (this.backendConfig['apiRouteStoredPicturesResolutionPrefix'] || '') + 'full/' + tdocImage.fileName, this.backendConfig['apiRoutePicturesStaticDir'] + '/'
            + (this.backendConfig['apiRouteStoredPicturesResolutionPrefix'] || '') + 'x' + width + '/' + tdocImage.fileName, width);
    };
    CommonDocMediaManagerModule.prototype.batchProcessSearchResult = function (searchForm, cb, opts, processingOptions) {
        searchForm.perPage = processingOptions.parallel;
        searchForm.pageNum = Number.isInteger(searchForm.pageNum) ? searchForm.pageNum : 1;
        var me = this;
        var startTime = (new Date()).getTime();
        var errorCount = 0;
        var readNextPage = function () {
            var startTime2 = (new Date()).getTime();
            return me.dataService.search(searchForm, opts).then(function searchDone(searchResult) {
                var promises = [];
                for (var _i = 0, _a = searchResult.currentRecords; _i < _a.length; _i++) {
                    var tdoc = _a[_i];
                    promises = promises.concat(cb(tdoc));
                }
                var processResults = function () {
                    var durWhole = ((new Date()).getTime() - startTime + 1) / 1000;
                    var dur = ((new Date()).getTime() - startTime2 + 1) / 1000;
                    var alreadyDone = searchForm.pageNum * searchForm.perPage;
                    var performance = searchResult.currentRecords.length / dur;
                    var performanceWhole = alreadyDone / durWhole;
                    console.log('DONE processed page ' +
                        searchForm.pageNum +
                        ' [' + ((searchForm.pageNum - 1) * searchForm.perPage + 1) +
                        '-' + alreadyDone + ']' +
                        ' / ' + Math.round(searchResult.recordCount / searchForm.perPage + 1) +
                        ' [' + searchResult.recordCount + ']' +
                        ' in ' + Math.round(dur + 1) + ' (' + Math.round(durWhole + 1) + ') s' +
                        ' with ' + Math.round(performance + 1) + ' (' + Math.round(performanceWhole + 1) + ') per s' +
                        ' approximately ' + Math.round(((searchResult.recordCount - alreadyDone) / performance + 1) / 60) + 'min left');
                    searchForm.pageNum++;
                    if (searchForm.pageNum < (searchResult.recordCount / searchForm.perPage + 1)) {
                        return readNextPage();
                    }
                    else {
                        return js_data_1.utils.resolve('WELL DONE');
                    }
                };
                return Promise.all(promises).then(function () {
                    return processResults();
                }).catch(function (reason) {
                    errorCount = errorCount + 1;
                    if (processingOptions.ignoreErrors > errorCount) {
                        console.warn('SKIP ERROR: ' + errorCount + ' of possible ' + processingOptions.ignoreErrors, reason);
                        return processResults();
                    }
                    console.error('UNSKIPPABLE ERROR: ' + errorCount + ' of possible ' + processingOptions.ignoreErrors, reason);
                    return js_data_1.utils.reject(reason);
                });
            }).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return js_data_1.utils.reject(error);
            });
        };
        return readNextPage();
    };
    return CommonDocMediaManagerModule;
}());
exports.CommonDocMediaManagerModule = CommonDocMediaManagerModule;
//# sourceMappingURL=cdoc-media-manager.module.js.map