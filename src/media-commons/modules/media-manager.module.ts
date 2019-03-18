import * as exif from 'fast-exif';
import * as Jimp from 'jimp';
import * as gm from 'gm';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as readdirp from 'readdirp';
import * as ffmpeg from 'fluent-ffmpeg';
import {FfmpegCommand} from 'fluent-ffmpeg';
import * as Promise_serial from 'promise-serial';
import {utils} from 'js-data';
import * as mm from 'music-metadata';
import {IAudioMetadata} from 'music-metadata';

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
                    fsExtra.copy(destPath, srcPath)
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
    public convertVideosFromMediaDirToMP4(baseDir: string, destDir: string, flgIgnoreIfExists: boolean): Promise<{}> {
        const mediaTypes = {
            'MOV': 'VIDEO',
            'mov': 'VIDEO',
            'AVI': 'VIDEO',
            'avi': 'VIDEO'
        };
        return this.doFfmegActionOnVideosFromMediaDir(baseDir, destDir, '.MP4', mediaTypes, flgIgnoreIfExists,
            function (command: FfmpegCommand) {
                return command.outputFormat('mp4')
                    .outputOption('-map_metadata 0')
                    .outputOption('-pix_fmt yuv420p');
            });
    }

    public scaleVideosFromMediaDirToMP4(baseDir: string, destDir: string, width: number, flgIgnoreIfExists: boolean): Promise<{}> {
        const mediaTypes = {
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
        return this.doFfmegActionOnVideosFromMediaDir(baseDir, destDir, '', mediaTypes, flgIgnoreIfExists,
            function (command: FfmpegCommand) {
                return command.outputFormat('mp4')
                    .size(width + 'x?')
                    .autopad(true, 'black')
                    .keepDisplayAspectRatio()
                    .outputOptions('-pix_fmt yuv420p');
            });
    }

    public generateVideoScreenshotFromMediaDir(baseDir: string, destDir: string, width: number, flgIgnoreIfExists: boolean): Promise<{}> {
        const mediaTypes = {
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };

        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '.jpg', mediaTypes,
            function (srcPath, destPath, processorResolve, processorReject) {
            if (flgIgnoreIfExists && fs.existsSync(destPath)) {
                console.log('SKIP - already exists', destPath);
                return processorResolve(destPath);
            }

            const patterns = destPath.split(/[\/\\]/);
            const fileName = patterns.splice(-1)[0];
            const fileDir = patterns.join('/');
            return ffmpeg(srcPath)
                    .on('error', function (err) {
                        console.error('An error occurred:', srcPath, destPath, err);
                        processorReject(err);
                    })
                    .on('progress', function (progress) {
//                        console.log('Processing ' + srcPath + ': ' + progress.percent + '% done @ '
//                            + progress.currentFps + ' fps');
                    })
                    .on('end', function (err, stdout, stderr) {
                        console.log('Finished processing:', srcPath, destPath, err);
                        const srcFileTime = fs.statSync(srcPath).mtime;
                        fs.utimesSync(destPath, srcFileTime, srcFileTime);
                        processorResolve(destPath);
                    })
                    .screenshots({
                        count: 1,
                        filename: fileName,
                        folder: fileDir,
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

        return this.doActionOnFilesFromMediaDir(baseDir, destDir, '.gif', mediaTypes,
            function (srcPath, destPath, processorResolve, processorReject) {
                if (flgIgnoreIfExists && fs.existsSync(destPath) && fs.existsSync(destPath + '.mp4')) {
                    console.log('SKIP - already exists', destPath);
                    return processorResolve(destPath);
                }

                const patterns = destPath.split(/[\/\\]/);
                patterns.splice(-1)[0];
                const fileDir = patterns.join('/');
                let files = [];
                const tmpFileNameBase = 'tmpfile-' + (new Date().getTime()) + '-';
                ffmpeg(srcPath)
                    .on('filenames', function(filenames) {
                        files = filenames;
                    })
                    .on('error', function (err) {
                        console.error('An error occurred:', srcPath, destPath, err);
                        processorReject(err);
                    })
                    .on('progress', function (progress) {
//                        console.log('Processing ' + srcPath + ': ' + progress.percent + '% done @ '
//                            + progress.currentFps + ' fps');
                    })
                    .on('end', function (err, stdout, stderr) {
                        let gmCommand = me.gm();
                        for (const file of files) {
                            gmCommand = gmCommand.in(me.tmpDir + '/' + file).quality(80).delay(1000);
                        }
                        gmCommand.write(destPath, function(err2){
                            if (err2) {
                                console.error('An error occurred:', srcPath, destPath, err2);
                                return processorReject(err);
                            }

                            const srcFileTime = fs.statSync(srcPath).mtime;
                            fs.utimesSync(destPath, srcFileTime, srcFileTime);

                            destPath = destPath + '.mp4';
                            const command = ffmpeg()
                                .on('error', function (err3) {
                                    console.error('An error occurred:', srcPath, destPath, err3);
                                    processorReject(err);
                                })
                                .on('progress', function (progress2) {
//                                    console.log('Processing ' + srcPath + ': ' + progress2.percent + '% done @ '
//                                        + progress2.currentFps + ' fps');
                                })
                                .on('end', function (err3, stdout2, stderr2) {
                                    console.log('Finished processing:', srcPath, destPath, err3);
                                    const srcFileTimeMp4 = fs.statSync(srcPath).mtime;
                                    fs.utimesSync(destPath, srcFileTimeMp4, srcFileTimeMp4);
                                    processorResolve(destPath);
                                });
                            command
                                .input(me.tmpDir + '/' + tmpFileNameBase + '%1d.png')
                                .inputFPS(3)
                                .output(destPath)
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

    public readExifForImage(imagePath: string): Promise<{}> {
        return exif.read(imagePath);
    }

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
            return utils.resolve(imagePath);
        }

        const resultDir = resultPath.replace(/[\\\/]+(?=[^\/\\]*$).*$/, '');
        mkdirp.sync(resultDir);

        return this.scaleImageGm(imagePath, resultPath, width);
    }

    public scaleImageJimp(imagePath: string, resultPath: string, width: number, flgIgnoreIfExists?: boolean): Promise<{}> {
        if (flgIgnoreIfExists && fs.existsSync(resultPath)) {
            console.log('SKIP - already exists', resultPath);
            return utils.resolve(resultPath);
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

    private doFfmegActionOnVideosFromMediaDir(baseDir: string, destDir: string, destSuffix: string, mediaTypes: {},
                                              flgIgnoreIfExists: boolean, ffmegCommandExtender: any): Promise<{}> {
        return this.doActionOnFilesFromMediaDir(baseDir, destDir, destSuffix, mediaTypes,
            function (srcPath, destPath, processorResolve, processorReject) {
                if (flgIgnoreIfExists && fs.existsSync(destPath)) {
                    console.log('SKIP - already exists', srcPath, destPath);
                    return processorResolve(destPath);
                }

                let command = ffmpeg(srcPath)
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
                command = ffmegCommandExtender(command);
                command.run();
        });
    }

    private doActionOnFilesFromMediaDir(baseDir: string, destDir: string, destSuffix: string, mediaTypes: {},
                                         commandExtender: any): Promise<{}> {
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
                    funcs.push(function () { return new Promise<string>((processorResolve, processorReject) => {
                            const patterns = destPath.split(/[\/\\]/);
                            patterns.splice(-1)[0];
                            const fileDir = patterns.join('/');
                            mkdirp.sync(fileDir);
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
