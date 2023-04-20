import express from 'express';
import { PDocRecord } from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import { PDocServerModule } from './pdoc-server.module';
import { PDocDataService } from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service';
import { CommonDocWriterServerModule } from '../../backend-commons/modules/cdoc-writer-server.module';
import { PDocSearchForm } from '@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform';
import { PDocSearchResult } from '@dps/mycms-commons/dist/pdoc-commons/model/container/pdoc-searchresult';
export declare class PDocWriterServerModule extends CommonDocWriterServerModule<PDocRecord, PDocSearchForm, PDocSearchResult, PDocDataService> {
    static configureRoutes(app: express.Application, apiPrefix: string, pdocServerModule: PDocServerModule): PDocWriterServerModule;
    constructor(pdocServerModule: PDocServerModule);
}
