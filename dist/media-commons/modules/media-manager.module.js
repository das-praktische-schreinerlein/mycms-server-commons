"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var exif = require("fast-exif");
var Jimp = require("jimp");
var gm = require("gm");
var fs = require("fs");
var file_utils_1 = require("@dps/mycms-commons/dist/commons/utils/file.utils");
var readdirp = require("readdirp");
var ffmpeg = require("fluent-ffmpeg");
var Promise_serial = require("promise-serial");
var js_data_1 = require("js-data");
var mm = require("music-metadata");
var fastimagesize = require("fast-image-size");
var MediaManagerModule = /** @class */ (function () {
    function MediaManagerModule(imageMagicPath, tmpDir) {
        this.tmpDir = tmpDir;
        this.gm = gm.subClass({ imageMagick: true, appPath: imageMagicPath });
    }
    MediaManagerModule.prototype.rotateVideo = function (srcPath, rotate) {
        var me = this;
        return new Promise(function (processorResolve, processorReject) {
            var patterns = srcPath.split(/[\/\\]/);
            var tmpFileNameBase = 'tmpfile-' + (new Date().getTime()) + '-';
            var fileName = patterns.splice(-1)[0];
            var destPath = me.tmpDir + '/' + tmpFileNameBase + fileName;
            var command = ffmpeg()
                .on('error', function (err) {
                console.error('An error occurred:', srcPath, destPath, err);
                processorReject(err);
            })
                .on('progress', function (progress) {
                console.log('Processing ' + srcPath + ': ' + progress.percent + '% done @ '
                    + progress.currentFps + ' fps');
            })
                .on('end', function (err, stdout, stderr) {
                var srcFileTimeMp4 = fs.statSync(srcPath).mtime;
                file_utils_1.FileUtils.copyFile(destPath, srcPath, false, false)
                    .then(function () {
                    console.log('Finished processing:', srcPath, destPath, err);
                    fs.utimesSync(destPath, srcFileTimeMp4, srcFileTimeMp4);
                    processorResolve(srcPath);
                })
                    .catch(function (err2) {
                    console.error('An error occurred:', srcPath, destPath, err2);
                    processorReject(err2);
                });
            });
            command
                .input(srcPath)
                .audioCodec('copy')
                .videoCodec('copy')
                .outputOption('-map_metadata 0')
                .outputOption('-metadata:s:v:0 rotate=' + rotate)
                .output(destPath)
                .run();
        });
    };
    MediaManagerModule.prototype.convertVideoToMP4 = function (srcFile, destFile, flgIgnoreIfExists) {
        return this.doFFMegActionOnVideo(srcFile, destFile, flgIgnoreIfExists, function (processorResolve, processorReject, command) {
            return Promise.resolve(command.outputFormat('mp4')
                .outputOption('-map_metadata 0')
                .outputOption('-pix_fmt yuv420p'));
        });
    };
    MediaManagerModule.prototype.convertVideosFromMediaDirToMP4 = function (baseDir, destDir, flgIgnoreIfExists) {
        var mediaTypes = {
            'MOV': 'VIDEO',
            'mov': 'VIDEO',
            'AVI': 'VIDEO',
            'avi': 'VIDEO'
        };
        var me = this;
        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '.MP4', mediaTypes, function (srcPath, destPath, processorResolve, processorReject) {
            return me.convertVideoToMP4(srcPath, destPath, flgIgnoreIfExists).then(function (result) {
                return processorResolve(result);
            }).catch(function (reason) {
                return processorReject(reason);
            });
        });
    };
    MediaManagerModule.prototype.scaleVideoMP4 = function (srcFile, destFile, width, flgIgnoreIfExists) {
        return this.doFFMegActionOnVideo(srcFile, destFile, flgIgnoreIfExists, function (processorResolve, processorReject, command) {
            return Promise.resolve(command.outputFormat('mp4')
                .size(width + 'x?')
                .autopad(true, 'black')
                .keepDisplayAspectRatio()
                .outputOptions('-pix_fmt yuv420p'));
        });
    };
    MediaManagerModule.prototype.scaleVideosFromMediaDirToMP4 = function (baseDir, destDir, width, flgIgnoreIfExists) {
        var mediaTypes = {
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
        var me = this;
        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '', mediaTypes, function (srcPath, destPath, processorResolve, processorReject) {
            return me.scaleVideoMP4(srcPath, destPath, width, flgIgnoreIfExists).then(function (result) {
                return processorResolve(result);
            }).catch(function (reason) {
                return processorReject(reason);
            });
        });
    };
    MediaManagerModule.prototype.generateVideoScreenshot = function (srcFile, destFile, width, flgIgnoreIfExists) {
        return new Promise(function (processorResolve, processorReject) {
            destFile = destFile + '.jpg';
            if (flgIgnoreIfExists && fs.existsSync(destFile)) {
                console.log('SKIP - generateVideoScreenshot - already exists', destFile);
                return processorResolve(destFile);
            }
            var fileError = file_utils_1.FileUtils.checkFilePath(destFile, true, false, false);
            if (fileError) {
                return processorReject(fileError);
            }
            var patterns = destFile.split(/[\/\\]/);
            var fileName = patterns.splice(-1)[0];
            var fileDir = patterns.join('/');
            ffmpeg(srcFile)
                .on('error', function (err) {
                console.error('ERROR - An error occurred on generateVideoScreenshot:', srcFile, destFile, err);
                return processorReject(err);
            })
                .on('end', function (err, stdout, stderr) {
                console.log('FINISHED - generateVideoScreenshot:', srcFile, destFile, err);
                var srcFileTime = fs.statSync(srcFile).mtime;
                fs.utimesSync(destFile, srcFileTime, srcFileTime);
                return processorResolve(destFile);
            })
                .screenshots({
                count: 1,
                filename: fileName,
                folder: fileDir,
                size: width + 'x?'
            });
        });
    };
    MediaManagerModule.prototype.generateVideoScreenshotFromMediaDir = function (baseDir, destDir, width, flgIgnoreIfExists) {
        var mediaTypes = {
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
        var me = this;
        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '', mediaTypes, function (srcPath, destPath, processorResolve, processorReject) {
            return me.generateVideoScreenshot(srcPath, destPath, width, flgIgnoreIfExists).then(function (result) {
                return processorResolve(result);
            }).catch(function (reason) {
                return processorReject(reason);
            });
        });
    };
    MediaManagerModule.prototype.generateVideoPreview = function (srcFile, destFile, width, flgIgnoreIfExists) {
        var me = this;
        return new Promise(function (processorResolve, processorReject) {
            destFile = destFile + '.gif';
            if (flgIgnoreIfExists && fs.existsSync(destFile) && fs.existsSync(destFile + '.mp4')) {
                console.log('SKIP - generateVideoPreview - already exists', destFile);
                return processorResolve(destFile);
            }
            var fileError = file_utils_1.FileUtils.checkFilePath(destFile, true, false, false);
            if (fileError) {
                return processorReject(fileError);
            }
            var patterns = destFile.split(/[\/\\]/);
            patterns.splice(-1)[0];
            var files = [];
            var tmpFileNameBase = 'tmpfile-' + (new Date().getTime()) + '-';
            ffmpeg(srcFile)
                .on('filenames', function (filenames) {
                files = filenames;
            })
                .on('error', function (err) {
                console.error('ERROR - generateVideoPreview - An error occurred:', srcFile, destFile, err);
                processorReject(err);
            })
                .on('end', function (err, stdout, stderr) {
                var gmCommand = me.gm();
                for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                    var file = files_1[_i];
                    gmCommand = gmCommand.in(me.tmpDir + '/' + file).quality(80).delay(1000);
                }
                gmCommand.write(destFile, function (err2) {
                    if (err2) {
                        console.error('ERROR - generateVideoPreview gmCommand - An error occurred:', srcFile, destFile, err2);
                        return processorReject(err2);
                    }
                    var srcFileTime = fs.statSync(srcFile).mtime;
                    fs.utimesSync(destFile, srcFileTime, srcFileTime);
                    destFile = destFile + '.mp4';
                    var command2 = ffmpeg()
                        .on('error', function (err3) {
                        console.error('ERROR - generateVideoPreview - command2 An error occurred:', srcFile, destFile, err3);
                        processorReject(err3);
                    })
                        .on('end', function (err3, stdout2, stderr2) {
                        console.log('FINISHED - generateVideoPreview processing:', srcFile, destFile, err3);
                        var srcFileTimeMp4 = fs.statSync(srcFile).mtime;
                        fs.utimesSync(destFile, srcFileTimeMp4, srcFileTimeMp4);
                        processorResolve(destFile);
                    });
                    command2
                        .input(me.tmpDir + '/' + tmpFileNameBase + '%1d.png')
                        .inputFPS(3)
                        .output(destFile)
                        .size(width + 'x?')
                        .outputOptions('-pix_fmt yuv420p')
                        .run();
                });
            })
                .screenshots({
                count: 10,
                filename: tmpFileNameBase + '%i.png',
                folder: me.tmpDir,
                size: width + 'x?'
            });
        });
    };
    MediaManagerModule.prototype.generateVideoPreviewFromMediaDir = function (baseDir, destDir, width, flgIgnoreIfExists) {
        var mediaTypes = {
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
        var me = this;
        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '', mediaTypes, function (srcPath, destPath, processorResolve, processorReject) {
            return me.generateVideoPreview(srcPath, destPath, width, flgIgnoreIfExists).then(function (result) {
                return processorResolve(result);
            }).catch(function (reason) {
                return processorReject(reason);
            });
        });
    };
    MediaManagerModule.prototype.readExifForImage = function (imagePath) {
        return new Promise(function (resolve, reject) {
            var fileError = file_utils_1.FileUtils.checkFilePath(imagePath, false, false, true);
            if (fileError) {
                return reject(fileError);
            }
            return fastimagesize(imagePath, function (imageSize) {
                return exif.read(imagePath).then(function (data) {
                    if (!data) {
                        data = {};
                    }
                    data['nativeImage'] = {
                        width: imageSize.width,
                        height: imageSize.height,
                        type: imageSize.type
                    };
                    return resolve(data);
                });
            });
        });
    };
    MediaManagerModule.prototype.readMetadataForImage = function (imagePath) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var fileError = file_utils_1.FileUtils.checkFilePath(imagePath, false, false, true);
            if (fileError) {
                return reject(fileError);
            }
            _this.gm(imagePath)
                .identify(function (err, data) {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    };
    ;
    MediaManagerModule.prototype.readMusicTagsForMusicFile = function (musicPath) {
        return new Promise(function (resolve, reject) {
            mm.parseFile(musicPath)
                .then(function (metadata) {
                return resolve(metadata);
            })
                .catch(function (err) {
                return reject(err);
            });
        });
    };
    MediaManagerModule.prototype.scaleImage = function (imagePath, resultPath, width) {
        if (fs.existsSync(resultPath)) {
            return Promise.resolve(imagePath);
        }
        var fileError = file_utils_1.FileUtils.checkFilePath(resultPath, true, false, false);
        if (fileError) {
            return Promise.reject(fileError);
        }
        return this.scaleImageGm(imagePath, resultPath, width);
    };
    MediaManagerModule.prototype.scaleImageJimp = function (imagePath, resultPath, width, flgIgnoreIfExists) {
        if (flgIgnoreIfExists && fs.existsSync(resultPath)) {
            console.log('SKIP - already exists', resultPath);
            return Promise.resolve(resultPath);
        }
        var fileError = file_utils_1.FileUtils.checkFilePath(resultPath, true, false, false);
        if (fileError) {
            return Promise.reject(fileError);
        }
        return Jimp.read(imagePath).then(function (image) {
            image.resize(width, Jimp.AUTO)
                .quality(90)
                .write(resultPath, function (err) {
                if (err) {
                    console.error(imagePath + ' FAILED:', err);
                    return js_data_1.utils.reject(err);
                }
                console.log(imagePath + ' OK:' + err);
                return js_data_1.utils.resolve(resultPath);
            });
        }).catch(function (err) {
            console.error(imagePath + ' FAILED:', err);
            return js_data_1.utils.reject(err);
        });
    };
    MediaManagerModule.prototype.scaleImageGm = function (imagePath, resultPath, width, flgIgnoreIfExists) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // options seen on https://stackoverflow.com/questions/7261855/recommendation-for-compressing-jpg-files-with-imagemagick
            if (flgIgnoreIfExists && fs.existsSync(resultPath)) {
                console.log('SKIP - already exists', resultPath);
                return resolve(resultPath);
            }
            var fileError = file_utils_1.FileUtils.checkFilePath(resultPath, true, false, false);
            if (fileError) {
                return reject(fileError);
            }
            _this.gm(imagePath)
                .autoOrient()
                .gaussian(0.05)
                .interlace('Plane')
                .quality(85)
                .resize(width)
                .noProfile()
                .write(resultPath, function (err) {
                if (err) {
                    console.error(imagePath + ' FAILED:', err);
                    return reject(err);
                }
                console.log(imagePath + ' OK');
                return resolve(resultPath);
            });
        });
    };
    MediaManagerModule.prototype.doFFMegActionOnVideo = function (srcPath, destPath, flgIgnoreIfExists, ffmegCommandExtender) {
        return new Promise(function (processorResolve, processorReject) {
            if (flgIgnoreIfExists && fs.existsSync(destPath)) {
                console.log('SKIP - already exists', srcPath, destPath);
                return processorResolve(destPath);
            }
            var fileError = file_utils_1.FileUtils.checkFilePath(destPath, true, false, false);
            if (fileError) {
                return processorReject(fileError);
            }
            var command = ffmpeg(srcPath)
                .on('error', function (err) {
                console.error('An error occurred:', srcPath, destPath, err);
                return processorReject(err);
            })
                .on('progress', function (progress) {
                //                        console.log('Processing ' + srcPath + ': ' + progress.percent + '% done @ '
                //                            + progress.currentFps + ' fps');
            })
                .on('end', function (err, stdout, stderr) {
                console.log('Finished processing:', srcPath, destPath, err);
                var srcFileTime = fs.statSync(srcPath).mtime;
                fs.utimesSync(destPath, srcFileTime, srcFileTime);
                return processorResolve(destPath);
            })
                .output(destPath);
            ffmegCommandExtender(processorResolve, processorReject, command).then(function (fullCommand) {
                if (fullCommand === undefined) {
                    return processorResolve(destPath);
                }
                fullCommand.run();
            }).catch(function (reason) {
                return processorReject(reason);
            });
        });
    };
    MediaManagerModule.prototype.doActionOnFilesFromMediaDir = function (baseDir, destDir, destSuffix, mediaTypes, commandExtender) {
        var fileExtensions = [];
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
        var media = {};
        return new Promise(function (resolve, reject) {
            readdirp(settings, function fileCallBack(fileRes) {
                var srcPath = baseDir + fileRes['path'];
                var destPath = destDir + fileRes['path'] + destSuffix;
                var extension = srcPath.split('.').splice(-1)[0];
                var type = mediaTypes[extension];
                if (type === undefined) {
                    console.warn('SKIP file - unknown extension', srcPath);
                    return;
                }
                if (media[destPath]) {
                    return;
                }
                media[destPath] = srcPath;
            }, function allCallBack(errors, res) {
                if (errors) {
                    errors.forEach(function (err) {
                        return reject(err);
                    });
                }
                var funcs = [];
                var _loop_1 = function (destPath) {
                    funcs.push(function () {
                        return new Promise(function (processorResolve, processorReject) {
                            var fileError = file_utils_1.FileUtils.checkFilePath(destPath, true, false, false);
                            if (fileError) {
                                return processorReject(fileError);
                            }
                            return commandExtender(media[destPath], destPath, processorResolve, processorReject);
                        });
                    });
                };
                for (var destPath in media) {
                    _loop_1(destPath);
                }
                return Promise_serial(funcs, { parallelize: 1 }).then(function (arrayOfResults) {
                    return resolve(media);
                }).catch(function (reason) {
                    return reject(reason);
                });
            });
        });
    };
    return MediaManagerModule;
}());
exports.MediaManagerModule = MediaManagerModule;
//# sourceMappingURL=media-manager.module.js.map