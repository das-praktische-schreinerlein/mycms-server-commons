import { GenericAdapterResponseMapper } from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
import { CommonDocDocExportService, ExportProcessingOptions, ExportProcessingResult, ExportProcessingResultMediaFileMappingsType, ExportProcessingResultRecordFieldMappingsType } from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import { MediaExportProcessingOptions } from '../../backend-commons/modules/cdoc-mediafile-export.service';
import { PDocRecord } from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import { PDocSearchForm } from '@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform';
import { PDocSearchResult } from '@dps/mycms-commons/dist/pdoc-commons/model/container/pdoc-searchresult';
import { PDocDataService } from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service';
import { PDocServerPlaylistService } from './pdoc-serverplaylist.service';
import { PDocAdapterResponseMapper } from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper';
import { ProcessingOptions } from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
export declare class PDocExportService extends CommonDocDocExportService<PDocRecord, PDocSearchForm, PDocSearchResult, PDocDataService, PDocServerPlaylistService> {
    protected readonly playlistService: PDocServerPlaylistService;
    protected readonly dataService: PDocDataService;
    protected readonly responseMapper: GenericAdapterResponseMapper;
    constructor(backendConfig: any, dataService: PDocDataService, playlistService: PDocServerPlaylistService, responseMapper: PDocAdapterResponseMapper);
    exportMediaRecordFiles(pdoc: PDocRecord, processingOptions: MediaExportProcessingOptions, exportResults: ExportProcessingResult<PDocRecord>[]): Promise<ExportProcessingResult<PDocRecord>>;
    protected generatePlaylistEntry(pdoc: PDocRecord, file: string): string;
    protected generatePlaylistForExportResults(processingOptions: ProcessingOptions & ExportProcessingOptions, exportResults: ExportProcessingResult<PDocRecord>[]): Promise<{}>;
    protected checkIdToRead(doc: PDocRecord, idsRead: {}): any[];
    protected convertAdapterDocValues(mdoc: {}, idMediaFileMappings: ExportProcessingResultMediaFileMappingsType, idRecordFieldMappings: ExportProcessingResultRecordFieldMappingsType): {};
}
