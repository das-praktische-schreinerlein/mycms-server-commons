import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { BaseMusicMediaDocRecordReferencesType, BaseMusicMediaDocRecordType } from '@dps/mycms-commons/dist/search-commons/model/records/basemusic-record';
import { ExportProcessingOptions } from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import { BaseMediaRecord } from '@dps/mycms-commons/dist/search-commons/model/records/basemedia-record';
import { CommonDocMediaFileExportManager, mediaType } from './cdoc-mediafile-export.service';
export interface MusicMediaExportRecordContainerType {
    [key: string]: BaseMusicMediaDocRecordType & BaseMusicMediaDocRecordReferencesType & CommonDocRecord;
}
export declare abstract class CommonDocMusicFileExportManager<R extends BaseMusicMediaDocRecordType & CommonDocRecord> extends CommonDocMediaFileExportManager<R> {
    generatePlaylistEntry(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType, exportPath: string): string;
    generateMediaDirForProfile(mdoc: R, mediaRecord: BaseMediaRecord, mediaType: string, exportProcessingOptions: ExportProcessingOptions): string;
    generateMediaFileNameForProfile(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType, exportProcessingOptions: ExportProcessingOptions): string;
}
