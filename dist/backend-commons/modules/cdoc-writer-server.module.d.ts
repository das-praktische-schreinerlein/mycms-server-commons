import * as express from 'express';
import { CommonDocServerModule } from './cdoc-server.module';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonDocDataService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { CommonDocSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import { GenericAdapterResponseMapper } from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
export declare abstract class CommonDocWriterServerModule<R extends CommonDocRecord, F extends CommonDocSearchForm, S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>> {
    private docServerModule;
    protected responseMapper: GenericAdapterResponseMapper;
    private dataService;
    private mapper;
    private adapter;
    private idValidationRule;
    static configureServerRoutes(app: express.Application, apiPrefix: string, docWriterServerModule: CommonDocWriterServerModule<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>, CommonDocDataService<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>>): void;
    constructor(docServerModule: CommonDocServerModule<R, F, S, D>, responseMapper: GenericAdapterResponseMapper);
    updateRecord(docSrc: {}): Promise<R>;
    doActionTag(actionTagFormSrc: {}): Promise<R>;
    addRecord(docSrc: {}): Promise<R>;
    private mapRecord;
    private mapActionTagForm;
}
