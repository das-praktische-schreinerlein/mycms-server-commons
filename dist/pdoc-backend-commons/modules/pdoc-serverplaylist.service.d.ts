import { CommonDocPlaylistService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-playlist.service';
import { PDocRecord } from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
export declare class PDocServerPlaylistService extends CommonDocPlaylistService<PDocRecord> {
    constructor();
    generateM3uEntityPath(pathPrefix: string, record: PDocRecord): string;
    generateM3uEntityInfo(record: PDocRecord): string;
}
