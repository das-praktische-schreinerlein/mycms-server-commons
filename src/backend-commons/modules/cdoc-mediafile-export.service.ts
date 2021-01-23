import * as pathLib from 'path';
import {BaseImageRecord} from '@dps/mycms-commons/dist/search-commons/model/records/baseimage-record';
import {CommonDocPlaylistService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-playlist.service';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {
    ExportProcessingMediaFileResultMappingType,
    ExportProcessingOptions,
    ExportProcessingResult
} from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import {FileUtils} from '@dps/mycms-commons/dist/commons/utils/file.utils';
import {BaseVideoRecord} from '@dps/mycms-commons/dist/search-commons/model/records/basevideo-record';
import {BaseMediaRecord} from '@dps/mycms-commons/dist/search-commons/model/records/basemedia-record';
import {BaseAudioRecord} from '@dps/mycms-commons/dist/search-commons/model/records/baseaudio-record';

export interface MediaExportResolution {
    pathPrefix: string;
    fileNameSuffix?: string;
}

export interface MediaExportProcessingOptions extends ExportProcessingOptions {
    resolutionProfile: string;
    audioResolutions?: MediaExportResolution[];
    imageResolutions?: MediaExportResolution[];
    videoResolutions?: MediaExportResolution[];
}

export type mediaType = 'audio' | 'image' | 'video';

export abstract class CommonDocMediaFileExportManager<R extends CommonDocRecord> {
    public static readonly PROFILE_FLAT = 'flat';

    protected readonly baseDir: string;
    protected readonly playlistService: CommonDocPlaylistService<R>;

    protected constructor(baseDir: string, playlistService: CommonDocPlaylistService<R>) {
        this.baseDir = baseDir;
        this.playlistService = playlistService;
    }

    public exportMediaRecordFiles(mdoc: R, exportProcessingOptions: MediaExportProcessingOptions): Promise<ExportProcessingResult<R>> {
        const me = this;
        const mdocAudios = this.getDetailAudioRecords(mdoc);
        const mdocImages = this.getDetailImageRecords(mdoc);
        const mdocVideos = this.getDetailVideoRecords(mdoc);
        const promises = [];

        if (mdocAudios !== undefined && mdocAudios.length === 1 &&
            exportProcessingOptions.audioResolutions !== undefined) {
            exportProcessingOptions.audioResolutions.forEach(resolution => {
                promises.push(me.exportMediaRecordFile(mdoc, mdocAudios[0], 'audio', resolution, exportProcessingOptions));
            });
        }
        if (mdocVideos !== undefined && mdocVideos.length === 1 &&
            exportProcessingOptions.videoResolutions !== undefined) {
            exportProcessingOptions.videoResolutions.forEach(resolution => {
                promises.push(me.exportMediaRecordFile(mdoc, mdocVideos[0], 'video', resolution, exportProcessingOptions));
            });
        }
        if (mdocImages !== undefined && mdocImages.length === 1 &&
            exportProcessingOptions.imageResolutions !== undefined) {
            exportProcessingOptions.imageResolutions.forEach(resolution => {
                promises.push(me.exportMediaRecordFile(mdoc, mdocImages[0], 'image', resolution, exportProcessingOptions));
            });
        }
        if (promises.length === 0) {
            return Promise.reject('no mediafile')
        }

        return Promise.all(promises).then(results => {
            let allMappings: ExportProcessingMediaFileResultMappingType  = {};
            results.forEach(result => {
                allMappings = {...allMappings, ...result.mediaFileMappings};
            });
            const result: ExportProcessingResult<R> = {
                record: mdoc,
                exportFileEntry: results[0].exportFileEntry,
                mediaFileMappings: allMappings,
                externalRecordFieldMappings: undefined
            }
            return Promise.resolve(result);
        })
    }

    public exportMediaRecordFile(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType,
                                 resolution: MediaExportResolution, exportProcessingOptions: MediaExportProcessingOptions)
        : Promise<ExportProcessingResult<R>> {
        let err = FileUtils.checkDirPath(exportProcessingOptions.exportBasePath, true,  false, true);
        if (err) {
            return Promise.reject('exportBasePath is invalid: ' + err);
        }

        const exportDir = this.generateMediaDirForProfile(mdoc, mediaRecord, type, exportProcessingOptions);
        const exportFile = this.generateMediaFileNameForProfile(mdoc, mediaRecord, type, exportProcessingOptions);

        const srcPath = this.generateResolutionPath(resolution, this.baseDir, mediaRecord.fileName);
        const destPath = this.generateResolutionPath(resolution, exportProcessingOptions.exportBasePath , exportDir + '/' + exportFile);

        const mappings: ExportProcessingMediaFileResultMappingType = {};
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

        return FileUtils.copyFile(srcPath, destPath, true, false).then(() => {
            const result: ExportProcessingResult<R> = {
                exportFileEntry: exportDir + '/' + exportFile,
                record: mdoc,
                mediaFileMappings: mappings,
                externalRecordFieldMappings: undefined
            };

            return Promise.resolve(result);
        });
    }

    public generateResolutionPath(resolution: MediaExportResolution, baseDir: string, filePath: string): string {
        if (resolution === undefined) {
            return baseDir + '/' + filePath;
        }

        return baseDir + '/' +
            (resolution.pathPrefix ? resolution.pathPrefix + '/' : '') +
            filePath +
            (resolution.fileNameSuffix ? resolution.fileNameSuffix : '')
    }

    public generatePlaylistEntry(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType, exportPath: string): string {
        return this.playlistService.generateM3uEntityInfo(mdoc) + '\n' + exportPath;
    }

    public generateMediaDirForProfile(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType,
                                      exportProcessingOptions: MediaExportProcessingOptions): string {
        if (mediaRecord === undefined) {
            return undefined;
        }

        if (exportProcessingOptions.fileNameProfile === CommonDocMediaFileExportManager.PROFILE_FLAT) {
            return '';
        }

        return pathLib.dirname(mediaRecord.fileName);
    }

    public generateMediaFileNameForProfile(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType,
                                           exportProcessingOptions: MediaExportProcessingOptions): string {
        if (mediaRecord === undefined) {
            return undefined;
        }

        if (exportProcessingOptions.fileNameProfile === CommonDocMediaFileExportManager.PROFILE_FLAT) {
            return mediaRecord.fileName.replace(/[\/\\]/g, '_');
        }

        return pathLib.basename(mediaRecord.fileName);
    }

    protected abstract getDetailAudioRecords(mdoc: R): BaseAudioRecord[];

    protected abstract getDetailImageRecords(mdoc: R): BaseImageRecord[];

    protected abstract getDetailVideoRecords(mdoc: R): BaseVideoRecord[];
}
