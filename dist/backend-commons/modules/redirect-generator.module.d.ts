import { GenericSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/generic-searchresult';
import { GenericSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-searchform';
import { BaseEntityRecord } from '@dps/mycms-commons/dist/search-commons/model/records/base-entity-record';
import { GenericSearchService } from '@dps/mycms-commons/dist/search-commons/services/generic-search.service';
export interface RedirectConfig {
    perPage: number;
    srcUrlPathGenerator: any;
    redirectGenerator: any;
}
export declare class RedirectGeneratorModule {
    static generateRedirectFiles(dataService: GenericSearchService<BaseEntityRecord, GenericSearchForm, GenericSearchResult<BaseEntityRecord, GenericSearchForm>>, redirectConfig: RedirectConfig, searchForm: GenericSearchForm): Promise<any>;
}
