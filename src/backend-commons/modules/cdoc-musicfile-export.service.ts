import * as pathLib from 'path';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {
    BaseMusicMediaDocRecordReferencesType,
    BaseMusicMediaDocRecordType
} from '@dps/mycms-commons/dist/search-commons/model/records/basemusic-record';
import {ExportProcessingOptions} from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import {NameUtils} from '@dps/mycms-commons/dist/commons/utils/name.utils';
import {BaseMediaRecord} from '@dps/mycms-commons/dist/search-commons/model/records/basemedia-record';
import {CommonDocMediaFileExportManager, mediaType} from './cdoc-mediafile-export.service';

export interface MusicMediaExportRecordContainerType {
    [key: string]: BaseMusicMediaDocRecordType & BaseMusicMediaDocRecordReferencesType & CommonDocRecord;
}

export abstract class CommonDocMusicFileExportManager<R extends BaseMusicMediaDocRecordType & CommonDocRecord>
    extends CommonDocMediaFileExportManager<R> {

    public generatePlaylistEntry(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType, exportPath: string): string {
        return this.playlistService.generateM3uEntityInfo(mdoc) + '\n' + exportPath;
    }

    public generateMediaDirForProfile(mdoc: R, mediaRecord: BaseMediaRecord, mediaType: string,
                                      exportProcessingOptions: ExportProcessingOptions): string {
        if (mediaRecord === undefined) {
            return undefined;
        }

        if (exportProcessingOptions.directoryProfile === CommonDocMusicFileExportManager.PROFILE_FLAT) {
            return [NameUtils.normalizeFileNames(mdoc.albumGenre ? mdoc.albumGenre : mdoc.genre)].join('/');
        }

        return [NameUtils.normalizeFileNames(mdoc.albumGenre ? mdoc.albumGenre : mdoc.genre),
            NameUtils.normalizeFileNames(mdoc.albumArtist ? mdoc.albumArtist : mdoc.artist),
            NameUtils.normalizeFileNames(mdoc.album)].join('/');
    }

    public generateMediaFileNameForProfile(mdoc: R, mediaRecord: BaseMediaRecord, type: mediaType,
                                           exportProcessingOptions: ExportProcessingOptions): string {
        if (mediaRecord === undefined) {
            return undefined;
        }

        if (type === 'image') {
            return ('cover-' +
                NameUtils.normalizeFileNames(mdoc.artist) +
                '-' +
                NameUtils.normalizeFileNames(mdoc.album) +
                pathLib.extname(mediaRecord.fileName)).replace(/ /g, '_');
        }

        const fileParts = []
        if (exportProcessingOptions.fileNameProfile === CommonDocMusicFileExportManager.PROFILE_FLAT) {
            if (mdoc.albumArtist && mdoc.albumArtist !== mdoc.artist) {
                fileParts.push(NameUtils.normalizeFileNames(mdoc.album));
            }
            fileParts.push(NameUtils.normalizeFileNames(mdoc.artist));
            fileParts.push(NameUtils.normalizeFileNames(mdoc.trackNo + '').padStart(2, '0'));
            fileParts.push(NameUtils.normalizeFileNames(mdoc.name));
        } else {
            fileParts.push(NameUtils.normalizeFileNames(mdoc.trackNo + '').padStart(2, '0'));
            if (mdoc.albumArtist && mdoc.albumArtist !== mdoc.artist) {
                fileParts.push(NameUtils.normalizeFileNames(mdoc.artist));
            }
            fileParts.push(NameUtils.normalizeFileNames(mdoc.name));
        }

        return fileParts.join(' - ') + pathLib.extname(mediaRecord.fileName);
    }

}
