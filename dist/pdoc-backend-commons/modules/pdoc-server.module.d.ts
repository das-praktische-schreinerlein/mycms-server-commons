import { PDocSearchResult } from '@dps/mycms-commons/dist/pdoc-commons/model/container/pdoc-searchresult';
import { PDocSearchForm } from '@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform';
import { PDocDataService } from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service';
import express from 'express';
import { PDocRecord } from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import { DataCacheModule } from '../../server-commons/datacache.module';
import { CommonDocServerModule } from '../../backend-commons/modules/cdoc-server.module';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonPDocBackendConfigType } from './pdoc-backend.commons';
export declare class PDocServerModule extends CommonDocServerModule<PDocRecord, PDocSearchForm, PDocSearchResult, PDocDataService> {
    protected dataService: PDocDataService;
    protected cache: DataCacheModule;
    static configureRoutes(app: express.Application, apiPrefix: string, dataService: PDocDataService, cache: DataCacheModule, backendConfig: CommonPDocBackendConfigType<any>): PDocServerModule;
    constructor(dataService: PDocDataService, cache: DataCacheModule);
    getApiId(): string;
    getApiResolveParameterName(): string;
    isSearchFormValid(searchForm: CommonDocSearchForm): boolean;
}
