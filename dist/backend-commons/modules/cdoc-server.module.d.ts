import * as express from 'express';
import { IdValidationRule } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonDocSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import { CommonDocDataService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import { CacheConfig, DataCacheModule } from '../../server-commons/datacache.module';
import { CommonBackendConfigType, CommonKeywordMapperConfigType } from './backend.commons';
export declare abstract class CommonDocServerModule<R extends CommonDocRecord, F extends CommonDocSearchForm, S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>> {
    protected dataService: D;
    protected cache: DataCacheModule;
    idValidationRule: IdValidationRule;
    static configureServerRoutes(app: express.Application, apiPrefix: string, cdocServerModule: CommonDocServerModule<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>, CommonDocDataService<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>>, cache: DataCacheModule, backendConfig: any | CommonBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>): void;
    constructor(dataService: D, cache: DataCacheModule);
    getById(req: any, next: any, id: any): Promise<S>;
    initCache(): Promise<any>;
    abstract getApiId(): string;
    abstract getApiResolveParameterName(): string;
    generateCacheKey(id: any): string;
    getCache(): DataCacheModule;
    getDataService(): D;
    abstract isSearchFormValid(searchForm: CommonDocSearchForm): boolean;
}
