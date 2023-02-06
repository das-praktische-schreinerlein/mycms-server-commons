import * as exif from 'fast-exif';
import * as Jimp from 'jimp';
import * as gm from 'gm';
import * as fs from 'fs';
import {FileUtils} from '@dps/mycms-commons/dist/commons/utils/file.utils';
import * as readdirp from 'readdirp';
import * as ffmpeg from 'fluent-ffmpeg';
import {FfmpegCommand} from 'fluent-ffmpeg';
import * as Promise_serial from 'promise-serial';
import {utils} from 'js-data';
import * as mm from 'music-metadata';
import {IAudioMetadata} from 'music-metadata';
import * as fastimagesize from 'fast-image-size';

export class MediaManagerModule {
    private gm;

    constructor(imageMagicPath: string, private tmpDir: string) {
        this.gm = gm.subClass({imageMagick: true, appPath: imageMagicPath});
    }

    public rotateVideo(srcPath: string, rotate: number): Promise<string> {
        const me = this;
        return new Promise<string>((processorResolve, processorReject) => {
            const patterns = srcPath.split(/[\/\\]/);
            const tmpFileNameBase = 'tmpfile-' + (new Date().getTime()) + '-';
            const fileName = patterns.splice(-1)[0];
            const destPath = me.tmpDir + '/' + tmpFileNameBase + fileName;
            const command = ffmpeg()
                .on('error', function (err) {
                    console.error('An error occurred:', srcPath, destPath, err);
                    processorReject(err);
                })
                .on('progress', function (progress) {
                    console.log('Processing ' + srcPath + ': ' + progress.percent + '% done @ '
                        + progress.currentFps + ' fps');
                })
                .on('end', function (err, stdout, stderr) {
                    const srcFileTimeMp4 = fs.statSync(srcPath).mtime;
                    FileUtils.copyFile(destPath, srcPath, false, false)
                        .then(() => {
                            console.log('Finished processing:', srcPath, destPath, err);
                            fs.utimesSync(destPath, srcFileTimeMp4, srcFileTimeMp4);
                            processorResolve(srcPath);
                        })
                        .catch(err2 => {
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
    }

    public convertVideoToMP4(srcFile: string, destFile: string, flgIgnoreIfExists: boolean): Promise<{}> {
        return this.doFFMegActionOnVideo(srcFile, destFile, flgIgnoreIfExists,
            function (processorResolve, processorReject, command: FfmpegCommand) {
                return Promise.resolve(
                    command.outputFormat('mp4')
                        .outputOption('-map_metadata 0')
                        .outputOption('-pix_fmt yuv420p')
                );
            });
    }

    public convertVideosFromMediaDirToMP4(baseDir: string, destDir: string, flgIgnoreIfExists: boolean): Promise<{}> {
        const mediaTypes = {
            'MOV': 'VIDEO',
            'mov': 'VIDEO',
            'AVI': 'VIDEO',
            'avi': 'VIDEO'
        };
        const me = this;

        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '.MP4', mediaTypes,
            function (srcPath, destPath, processorResolve, processorReject) {
                return me.convertVideoToMP4(srcPath, destPath, flgIgnoreIfExists).then(result => {
                    return processorResolve(result);
                }).catch(reason => {
                    return processorReject(reason);
                })
            });
    }

    public scaleVideoMP4(srcFile: string, destFile: string, width: number, flgIgnoreIfExists: boolean): Promise<{}> {
        return this.doFFMegActionOnVideo(srcFile, destFile, flgIgnoreIfExists,
            function (processorResolve, processorReject, command: FfmpegCommand) {
                return Promise.resolve(
                    command.outputFormat('mp4')
                        .size(width + 'x?')
                        .autopad(true, 'black')
                        .keepDisplayAspectRatio()
                        .outputOptions('-pix_fmt yuv420p')
                );
            });
    }

    public scaleVideosFromMediaDirToMP4(baseDir: string, destDir: string, width: number, flgIgnoreIfExists: boolean): Promise<{}> {
        const mediaTypes = {
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
        const me = this;

        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '', mediaTypes,
            function (srcPath, destPath, processorResolve, processorReject) {
                return me.scaleVideoMP4(srcPath, destPath, width, flgIgnoreIfExists).then(result => {
                    return processorResolve(result);
                }).catch(reason => {
                    return processorReject(reason);
                })
            });
    }

    public generateVideoScreenshot(srcFile: string, destFile: string, width: number, flgIgnoreIfExists: boolean): Promise<{}> {
        return new Promise((processorResolve, processorReject) => {
            destFile = destFile + '.jpg';
            if (flgIgnoreIfExists && fs.existsSync(destFile)) {
                console.log('SKIP - generateVideoScreenshot - already exists', destFile);
                return processorResolve(destFile);
            }

            const fileError = FileUtils.checkFilePath(destFile, true, false, false);
            if (fileError) {
                return processorReject(fileError);
            }

            const patterns = destFile.split(/[\/\\]/);
            const fileName = patterns.splice(-1)[0];
            const fileDir = patterns.join('/');
            ffmpeg(srcFile)
                .on('error', function (err) {
                    console.error('ERROR - An error occurred on generateVideoScreenshot:', srcFile, destFile, err);
                    return processorReject(err);
                })
                .on('end', function (err, stdout, stderr) {
                    console.log('FINISHED - generateVideoScreenshot:', srcFile, destFile, err);
                    const srcFileTime = fs.statSync(srcFile).mtime;
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
    }

    public generateVideoScreenshotFromMediaDir(baseDir: string, destDir: string, width: number, flgIgnoreIfExists: boolean): Promise<{}> {
        const mediaTypes = {
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
        const me = this;

        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '', mediaTypes,
            function (srcPath, destPath, processorResolve, processorReject) {
                return me.generateVideoScreenshot(srcPath, destPath, width, flgIgnoreIfExists).then(result => {
                    return processorResolve(result);
                }).catch(reason => {
                    return processorReject(reason);
                })
            });
    }

    public generateVideoPreview(srcFile: string, destFile: string, width: number, flgIgnoreIfExists: boolean): Promise<{}> {
        const me = this;
        return new Promise((processorResolve, processorReject) => {
            destFile = destFile + '.gif';
            if (flgIgnoreIfExists && fs.existsSync(destFile) && fs.existsSync(destFile + '.mp4')) {
                console.log('SKIP - generateVideoPreview - already exists', destFile);
                return processorResolve(destFile);
            }

            const fileError = FileUtils.checkFilePath(destFile, true, false, false);
            if (fileError) {
                return processorReject(fileError);
            }

            const patterns = destFile.split(/[\/\\]/);
            patterns.splice(-1)[0];
            let files = [];
            const tmpFileNameBase = 'tmpfile-' + (new Date().getTime()) + '-';
            ffmpeg(srcFile)
                .on('filenames', function(filenames) {
                    files = filenames;
                })
                .on('error', function (err) {
                    console.error('ERROR - generateVideoPreview - An error occurred:', srcFile, destFile, err);
                    processorReject(err);
                })
                .on('end', function (err, stdout, stderr) {
                    let gmCommand = me.gm();
                    for (const file of files) {
                        gmCommand = gmCommand.in(me.tmpDir + '/' + file).quality(80).delay(1000);
                    }
                    gmCommand.write(destFile, function(err2){
                        if (err2) {
                            console.error('ERROR - generateVideoPreview gmCommand - An error occurred:', srcFile, destFile, err2);
                            return processorReject(err2);
                        }

                        const srcFileTime = fs.statSync(srcFile).mtime;
                        fs.utimesSync(destFile, srcFileTime, srcFileTime);

                        destFile = destFile + '.mp4';
                        const command2 = ffmpeg()
                            .on('error', function (err3) {
                                console.error('ERROR - generateVideoPreview - command2 An error occurred:', srcFile, destFile, err3);
                                processorReject(err3);
                            })
                            .on('end', function (err3, stdout2, stderr2) {
                                console.log('FINISHED - generateVideoPreview processing:', srcFile, destFile, err3);
                                const srcFileTimeMp4 = fs.statSync(srcFile).mtime;
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
    }

    public generateVideoPreviewFromMediaDir(baseDir: string, destDir: string, width: number, flgIgnoreIfExists: boolean): Promise<{}> {
        const mediaTypes = {
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
        const me = this;

        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '', mediaTypes,
            function (srcPath, destPath, processorResolve, processorReject) {
                return me.generateVideoPreview(srcPath, destPath, width, flgIgnoreIfExists).then(result => {
                    return processorResolve(result);
                }).catch(reason => {
                    return processorReject(reason);
                })
            });
    }

    public readExifForImage(imagePath: string): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            const fileError = FileUtils.checkFilePath(imagePath, false, false, true);
            if (fileError) {
                return reject(fileError);
            }

            return fastimagesize(imagePath, function (imageSize) {
                return exif.read(imagePath).then(data => {
                    if (!data) {
                        data = {};
                    }

                    data['nativeImage'] = {
                        width: imageSize.width,
                        height: imageSize.height,
                        type: imageSize.type
                    }

                    return resolve(data);
                })
            });
        });
    }

    public readMetadataForImage(imagePath: string): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            const fileError = FileUtils.checkFilePath(imagePath, false, false, true);
            if (fileError) {
                return reject(fileError);
            }

            this.gm(imagePath)
                .identify(function (err, data) {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(data);
                });
        });
    };

    public readMusicTagsForMusicFile(musicPath: string): Promise<IAudioMetadata> {
        return new Promise<IAudioMetadata>((resolve, reject) => {
            mm.parseFile(musicPath)
                .then(metadata => {
                    return resolve(metadata);
                })
                .catch((err) => {
                    return reject(err);
                });
        });
    }

    public scaleImage(imagePath: string, resultPath: string, width: number): Promise<{}> {
        if (fs.existsSync(resultPath)) {
            return Promise.resolve(imagePath);
        }

        const fileError = FileUtils.checkFilePath(resultPath, true, false, false);
        if (fileError) {
            return Promise.reject(fileError);
        }

        return this.scaleImageGm(imagePath, resultPath, width);
    }

    public scaleImageJimp(imagePath: string, resultPath: string, width: number, flgIgnoreIfExists?: boolean): Promise<{}> {
        if (flgIgnoreIfExists && fs.existsSync(resultPath)) {
            console.log('SKIP - already exists', resultPath);
            return Promise.resolve(resultPath);
        }

        const fileError = FileUtils.checkFilePath(resultPath, true, false, false);
        if (fileError) {
            return Promise.reject(fileError);
        }

        return Jimp.read(imagePath).then(function (image) {
            image.resize(width, Jimp.AUTO)
                .quality(90)
                .write(resultPath, function(err){
                    if (err) {
                        console.error(imagePath + ' FAILED:', err);
                        return utils.reject(err);
                    }

                    console.log(imagePath + ' OK:' + err);
                    return utils.resolve(resultPath);
                });
        }).catch(function (err) {
            console.error(imagePath + ' FAILED:', err);
            return utils.reject(err);
        });
    }

    public scaleImageGm(imagePath: string, resultPath: string, width: number, flgIgnoreIfExists?: boolean): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            // options seen on https://stackoverflow.com/questions/7261855/recommendation-for-compressing-jpg-files-with-imagemagick
            if (flgIgnoreIfExists && fs.existsSync(resultPath)) {
                console.log('SKIP - already exists', resultPath);
                return resolve(resultPath);
            }

            const fileError = FileUtils.checkFilePath(resultPath, true, false, false);
            if (fileError) {
                return reject(fileError);
            }

            this.gm(imagePath)
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
    }

    private doFFMegActionOnVideo(srcPath: string, destPath: string, flgIgnoreIfExists: boolean,
                                 ffmegCommandExtender: (processorResolve: (result: any) => any,
                                                        processorReject: (error: any) => any,
                                                        ffmpeg: ffmpeg.FfmpegCommand) => Promise<ffmpeg.FfmpegCommand>): Promise<{}> {
        return new Promise((processorResolve, processorReject) => {
            if (flgIgnoreIfExists && fs.existsSync(destPath)) {
                console.log('SKIP - already exists', srcPath, destPath);
                return processorResolve(destPath);
            }

            const fileError = FileUtils.checkFilePath(destPath, true, false, false);
            if (fileError) {
                return processorReject(fileError);
            }

            let command: ffmpeg.FfmpegCommand = ffmpeg(srcPath)
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
                    const srcFileTime = fs.statSync(srcPath).mtime;
                    fs.utimesSync(destPath, srcFileTime, srcFileTime);
                    return processorResolve(destPath);
                })
                .output(destPath);
            ffmegCommandExtender(processorResolve, processorReject, command).then((fullCommand) => {
                if (fullCommand === undefined) {
                    return processorResolve(destPath);
                }

                fullCommand.run();
            }).catch(reason => {
                return processorReject(reason);
            });
        });
    }

    private doActionOnFilesFromMediaDir(baseDir: string, destDir: string, destSuffix: string, mediaTypes: {},
                                        commandExtender: (srcPath: string, destPath: string, processorResolve: any, processorReject: any) => void): Promise<{}> {
        const fileExtensions = [];
        for (const mediaType in mediaTypes) {
            fileExtensions.push('*.' + mediaType);
        }
        const settings = {
            root: baseDir,
            entryType: 'files',
            // Filter files with js and json extension
            fileFilter: fileExtensions,
            // Filter by directory
            directoryFilter: [ '!.git', '!*modules' ],
            // Work with files up to 1 subdirectory deep
            depth: 10
        };

        const media = {};

        return new Promise<{}>((resolve, reject) => {
            readdirp(settings, function fileCallBack(fileRes) {
                const srcPath = baseDir + fileRes['path'];
                const destPath = destDir + fileRes['path'] + destSuffix;
                const extension = srcPath.split('.').splice(-1)[0];
                const type = mediaTypes[extension];
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

                const funcs = [];
                for (const destPath in media) {
                    funcs.push(function () {
                        return new Promise<string>((processorResolve, processorReject) => {
                            const fileError = FileUtils.checkFilePath(destPath, true, false, false);
                            if (fileError) {
                                return processorReject(fileError);
                            }

                            return commandExtender(media[destPath], destPath, processorResolve, processorReject);
                        });
                    });
                }

                return Promise_serial(funcs, {parallelize: 1}).then(arrayOfResults => {
                    return resolve(media);
                }).catch(reason => {
                    return reject(reason);
                });
            });
        });
    }
}
