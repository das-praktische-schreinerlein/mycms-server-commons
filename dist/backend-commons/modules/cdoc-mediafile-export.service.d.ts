import { BaseImageRecord } from '@dps/mycms-commons/dist/search-commons/model/records/baseimage-record';
import { CommonDocPlaylistService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-playlist.service';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { ExportProcessingOptions, ExportProcessingResult } from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import { BaseVideoRecord } from '@dps/mycms-commons/dist/search-commons/model/records/basevideo-record';
import { BaseMediaRecord } from '@dps/mycms-commons/dist/search-commons/model/records/basemedia-record';
import { BaseAudioRecord } from '@dps/mycms-commons/dist/search-commons/model/records/baseaudio-record';
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
export declare type mediaType = 'audio' | 'image' | 'video';
export declare abstract class CommonDocMediaFileExportManager<R extends CommonDocRecord> {
    static readonly PROFILE_FLAT = "flat";
    protected readonly baseDir: string;
    protected readonly playlistService: CommonDocPlaylistService<R>;
    protected constructor(baseDir: string, playlistService: CommonDocPlaylistService<R>);
    exportMediaRecordFiles(mdoc: R, exportProcessingOptions: MediaExportProcessingOptions): Promise<ExportProcessingResult<R>>;
    exportMediaRecordFile(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType, resolution: MediaExportResolution, exportProcessingOptions: MediaExportProcessingOptions): Promise<ExportProcessingResult<R>>;
    generateResolutionPath(resolution: MediaExportResolution, baseDir: string, filePath: string): string;
    generatePlaylistEntry(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType, exportPath: string): string;
    generateMediaDirForProfile(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType, exportProcessingOptions: MediaExportProcessingOptions): string;
    generateMediaFileNameForProfile(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType, exportProcessingOptions: MediaExportProcessingOptions): string;
    protected abstract getDetailAudioRecords(mdoc: R): BaseAudioRecord[];
    protected abstract getDetailImageRecords(mdoc: R): BaseImageRecord[];
    protected abstract getDetailVideoRecords(mdoc: R): BaseVideoRecord[];
}
