import {CommonDocPlaylistService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-playlist.service';
import {PDocRecord} from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';

export class PDocServerPlaylistService extends CommonDocPlaylistService<PDocRecord> {

    constructor() {
        super();
    }

    generateM3uEntityPath(pathPrefix: string, record: PDocRecord): string {

        return undefined;
    }

    public generateM3uEntityInfo(record: PDocRecord): string {
        if (!record || !record.name) {
            return undefined;
        }

        return '#EXTINF:-1,' + record.name;
    }
}
