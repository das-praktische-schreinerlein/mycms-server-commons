import { MediaManagerModule } from '../../media-commons/modules/media-manager.module';
import { GenericSearchOptions } from '@dps/mycms-commons/dist/search-commons/services/generic-search.service';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonDocSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import { CommonDocDataService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import { BaseImageRecordType } from '@dps/mycms-commons/dist/search-commons/model/records/baseimage-record';
import { BaseVideoRecordType } from '@dps/mycms-commons/dist/search-commons/model/records/basevideo-record';
import { CommonImageBackendConfigType, CommonKeywordMapperConfigType, CommonVideoBackendConfigType } from "./backend.commons";
import { CacheConfig } from "../../server-commons/datacache.module";
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
export interface ProcessingOptions {
    ignoreErrors: number;
    parallel: number;
}
export declare abstract class CommonDocMediaManagerModule<R extends CommonDocRecord, F extends CommonDocSearchForm, S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>> {
    protected readonly dataService: D;
    protected readonly backendConfig: CommonImageBackendConfigType<CommonKeywordMapperConfigType, CacheConfig> & CommonVideoBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>;
    protected readonly mediaManager: MediaManagerModule;
    static mapDBResultOnFileInfoType(dbResult: any, records: DBFileInfoType[]): void;
    protected constructor(backendConfig: CommonImageBackendConfigType<CommonKeywordMapperConfigType, CacheConfig> & CommonVideoBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>, dataService: D, mediaManager: MediaManagerModule);
    abstract readMetadataForCommonDocRecord(tdoc: R): Promise<{}>;
    abstract updateDateOfCommonDocRecord(tdoc: R, date: Date): Promise<{}>;
    abstract scaleCommonDocRecordMediaWidth(tdoc: R, width: number): Promise<{}>;
    abstract findCommonDocRecordsForFileInfo(baseDir: string, fileInfo: FileInfoType, additionalMappings: {
        [key: string]: FileSystemDBSyncType;
    }): Promise<DBFileInfoType[]>;
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
    protected batchProcessSearchResult(searchForm: F, cb: (tdoc: R) => Promise<{}>[], opts: GenericSearchOptions, processingOptions: ProcessingOptions): Promise<{}>;
}
