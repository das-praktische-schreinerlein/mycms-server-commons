import { GenericSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/generic-searchresult';
import { GenericSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-searchform';
import { BaseEntityRecord } from '@dps/mycms-commons/dist/search-commons/model/records/base-entity-record';
import { GenericSearchService } from '@dps/mycms-commons/dist/search-commons/services/generic-search.service';
export interface SitemapConfig {
    sitemapBaseUrl: string;
    showBaseUrl: string;
    locale: string;
    fileDir: string;
    fileBase: string;
    perPage: number;
    urlGenerator: any;
    cdocSearchForm: {};
}
export declare class SitemapGeneratorModule {
    static generateSiteMapFiles(dataService: GenericSearchService<BaseEntityRecord, GenericSearchForm, GenericSearchResult<BaseEntityRecord, GenericSearchForm>>, sitemapConfig: SitemapConfig, searchForm: GenericSearchForm): Promise<any>;
}
