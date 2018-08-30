import { IAudioMetadata } from 'music-metadata';
export declare class MediaManagerModule {
    private tmpDir;
    private gm;
    constructor(imageMagicPath: string, tmpDir: string);
    rotateVideo(srcPath: string, rotate: number): Promise<string>;
    convertVideosFromMediaDirToMP4(baseDir: string, destDir: string, flgIgnoreIfExists: boolean): Promise<{}>;
    scaleVideosFromMediaDirToMP4(baseDir: string, destDir: string, width: number, flgIgnoreIfExists: boolean): Promise<{}>;
    generateVideoScreenshotFromMediaDir(baseDir: string, destDir: string, width: number, flgIgnoreIfExists: boolean): Promise<{}>;
    generateVideoPreviewFromMediaDir(baseDir: string, destDir: string, width: number, flgIgnoreIfExists: boolean): Promise<{}>;
    readExifForImage(imagePath: string): Promise<{}>;
    readMusicTagsForMusicFile(musicPath: string): Promise<IAudioMetadata>;
    scaleImage(imagePath: string, resultPath: string, width: number): Promise<{}>;
    scaleImageJimp(imagePath: string, resultPath: string, width: number, flgIgnoreIfExists?: boolean): Promise<{}>;
    scaleImageGm(imagePath: string, resultPath: string, width: number, flgIgnoreIfExists?: boolean): Promise<{}>;
    private doFfmegActionOnVideosFromMediaDir(baseDir, destDir, destSuffix, mediaTypes, flgIgnoreIfExists, ffmegCommandExtender);
    private doActionOnFilesFromMediaDir(baseDir, destDir, destSuffix, mediaTypes, commandExtender);
}
