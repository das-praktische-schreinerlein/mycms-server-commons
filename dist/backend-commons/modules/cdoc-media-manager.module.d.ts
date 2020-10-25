import { MediaManagerModule } from '../../media-commons/modules/media-manager.module';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonDocSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import { BaseImageRecordType } from '@dps/mycms-commons/dist/search-commons/model/records/baseimage-record';
import { BaseVideoRecordType } from '@dps/mycms-commons/dist/search-commons/model/records/basevideo-record';
import { CommonImageBackendConfigType, CommonKeywordMapperConfigType, CommonVideoBackendConfigType } from './backend.commons';
import { CacheConfig } from '../../server-commons/datacache.module';
import { ProcessingOptions } from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import { CommonDocDataService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import { CommonDocDocExportService, ExportProcessingOptions } from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import { CommonDocPlaylistService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-playlist.service';
export interface FileInfoType {
    created: Date;
    lastModified: Date;
    exifDate: Date;
    name: string;
    dir: string;
    size: number;
    type: string;
}
export declare type FileSystemDBSyncMatchingType = 'EXIFDATE' | 'FILEDATE' | 'FILENAME' | 'FILEDIRANDNAME' | 'FILESIZE' | 'FILENAMEANDDATE' | 'SIMILARITY';
export interface DBFileInfoType extends FileInfoType {
    id: string;
    matching: FileSystemDBSyncMatchingType;
    matchingDetails: string;
    matchingScore: number;
}
export interface FileSystemDBSyncType {
    file: FileInfoType;
    records: DBFileInfoType[];
}
export declare abstract class CommonDocMediaManagerModule<R extends CommonDocRecord, F extends CommonDocSearchForm, S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>, P extends CommonDocPlaylistService<R>, M extends CommonDocDocExportService<R, F, S, D, P>> {
    protected readonly backendConfig: CommonImageBackendConfigType<CommonKeywordMapperConfigType, CacheConfig> & CommonVideoBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>;
    protected readonly dataService: D;
    protected readonly mediaManager: MediaManagerModule;
    protected readonly commonDocExportManager: M;
    static mapDBResultOnFileInfoType(dbResult: any, records: DBFileInfoType[]): void;
    protected constructor(backendConfig: CommonImageBackendConfigType<CommonKeywordMapperConfigType, CacheConfig> & CommonVideoBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>, dataService: D, mediaManager: MediaManagerModule, commonDocExportManager: M);
    abstract readMetadataForCommonDocRecord(tdoc: R): Promise<{}>;
    abstract updateDateOfCommonDocRecord(tdoc: R, date: Date): Promise<{}>;
    abstract scaleCommonDocRecordMediaWidth(tdoc: R, width: number): Promise<{}>;
    abstract findCommonDocRecordsForFileInfo(baseDir: string, fileInfo: FileInfoType, additionalMappings: {
        [key: string]: FileSystemDBSyncType;
    }): Promise<DBFileInfoType[]>;
    exportMediaFiles(searchForm: F, processingOptions: ProcessingOptions & ExportProcessingOptions): Promise<{}>;
    getFileExtensionToTypeMappings(): {};
    readAndUpdateMediaDates(searchForm: F, processingOptions: ProcessingOptions): Promise<{}>;
    scaleImagesToDefaultWidth(searchForm: F, processingOptions: ProcessingOptions): Promise<{}>;
    readAndUpdateDateFromCommonDocRecord(tdoc: R): Promise<{}>;
    findCorrespondingCommonDocRecordsForMedia(baseDir: string, additionalMappings: {
        [key: string]: FileSystemDBSyncType;
    }): Promise<FileSystemDBSyncType[]>;
    readExifForCommonDocImageRecord(tdocImage: BaseImageRecordType): Promise<{}>;
    readMetadataForCommonDocVideoRecord(tdocVideo: BaseVideoRecordType): Promise<{}>;
    scaleCommonDocImageRecord(tdocImage: BaseImageRecordType, width: number): Promise<{}>;
}
