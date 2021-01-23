import { IAudioMetadata } from 'music-metadata';
import { Mapper } from 'js-data';
import * as fs from 'fs';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { GenericAdapterResponseMapper } from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
import { BaseAudioRecord } from '@dps/mycms-commons/dist/search-commons/model/records/baseaudio-record';
import { BaseImageRecord } from '@dps/mycms-commons/dist/search-commons/model/records/baseimage-record';
import { MediaManagerModule } from '../../media-commons/modules/media-manager.module';
import { BaseMusicMediaDocRecordReferencesType, BaseMusicMediaDocRecordType } from '@dps/mycms-commons/dist/search-commons/model/records/basemusic-record';
export interface MediaImportRecordContainerType {
    [key: string]: BaseMusicMediaDocRecordType & BaseMusicMediaDocRecordReferencesType & CommonDocRecord;
}
export interface MediaImportFileContainerType {
    [key: string]: fs.Stats;
}
export interface MediaImportFileNameContainerType {
    [key: string]: string;
}
export interface MediaImportFileCheckType {
    readyToImport: boolean;
    hint: string;
}
export interface MediaImportContainerType {
    FILES: MediaImportFileContainerType;
    ALBUMCOVERFILES: MediaImportFileNameContainerType;
    ARTIST: MediaImportRecordContainerType;
    AUDIO: MediaImportRecordContainerType;
    ALBUM: MediaImportRecordContainerType;
    ALBUMFOLDER: MediaImportRecordContainerType;
    GENRE: MediaImportRecordContainerType;
    GENREARTISTS: MediaImportRecordContainerType;
}
export interface MusicMediaDataContainerType {
    genreName: string;
    artistName: string;
    albumName: string;
    albumArtistName: string;
    albumGenreName: string;
    titleName: string;
    trackNr: number;
    releaseYear: string;
}
export declare abstract class CommonDocMusicFileImportManager<R extends BaseMusicMediaDocRecordType & BaseMusicMediaDocRecordReferencesType & CommonDocRecord> {
    protected mediaManager: MediaManagerModule;
    unknownGenre: string;
    unknownArtist: string;
    unknownAlbum: string;
    protected readonly baseDir: string;
    protected constructor(baseDir: string, mediaManager: MediaManagerModule);
    generateMusicDocRecordsFromMediaDir(mapper: Mapper, responseMapper: GenericAdapterResponseMapper, baseDir: string, mappings: {}): Promise<R[]>;
    generateMusicDocsForImportContainer(container: MediaImportContainerType, mediaTypes: {}, baseDir: string, mappings: {}, mapper: Mapper, responseMapper: GenericAdapterResponseMapper): Promise<R[]>;
    checkMusicFile(path: string, records: R[], container: MediaImportContainerType, fileStats: fs.Stats): Promise<MediaImportFileCheckType>;
    checkMusicMediaData(path: string, records: R[], container: MediaImportContainerType, mediaDataContainer: MusicMediaDataContainerType, fileStats: fs.Stats, metadata: IAudioMetadata): Promise<MediaImportFileCheckType>;
    createRecordsForMusicMediaData(mapper: Mapper, responseMapper: GenericAdapterResponseMapper, path: string, records: R[], container: MediaImportContainerType, mediaDataContainer: MusicMediaDataContainerType, fileStats: fs.Stats, metadata: IAudioMetadata): Promise<{}>;
    extractAndSetCoverFile(mdoc: R, metaData: IAudioMetadata): Promise<boolean>;
    checkAndUpdateAlbumCover(container: {}, path: string): void;
    mapAudioMetaDataToMusicMediaData(mappings: {}, path: string, metaData: IAudioMetadata, mediaDataContainer: MusicMediaDataContainerType): void;
    mapMediaDataContainerToAudioMetaData(mappings: {}, mediaDataContainer: MusicMediaDataContainerType, metaData: IAudioMetadata): void;
    mapMediaDocToMediaDataRecordToMediaDataContainer(mappings: {}, mdoc: R, mediaDataContainer: MusicMediaDataContainerType): void;
    mapMediaDataRecordToAudioMetaDataToMediaDocRecord(mappings: {}, mediaDataContainer: MusicMediaDataContainerType, mdoc: R): void;
    getFileExtensionToTypeMappings(): {};
    getMimeTypeToFileExtension(): {};
    protected abstract appendCoverImageToRecord(mdoc: R, coverFile: string): any;
    protected abstract appendLinkedArtistToAlbumRecord(mapper: Mapper, mdoc: R, artistId: number, artistName: string): any;
    protected abstract getAudiosFromRecord(mdoc: R): BaseAudioRecord[];
    protected abstract getImagesFromRecord(mdoc: R): BaseImageRecord[];
}
