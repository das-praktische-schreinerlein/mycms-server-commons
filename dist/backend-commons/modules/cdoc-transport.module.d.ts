import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { GenericAdapterResponseMapper } from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
import { CommonDocDataService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonDocSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
export declare class CommonDocTransportModule {
    loadDocs(recordSrcs: any[], typeOrder: string[], responseMapper: GenericAdapterResponseMapper, dataService: CommonDocDataService<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>): Promise<any>;
    exportDocs(typeOrder: string[], perRun: number, writerCallback: any, responseMapper: GenericAdapterResponseMapper, dataService: CommonDocDataService<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>): Promise<any>;
}
