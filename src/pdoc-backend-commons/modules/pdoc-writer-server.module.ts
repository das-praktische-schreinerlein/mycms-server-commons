import express from 'express';
import {PDocRecord} from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import {PDocServerModule} from './pdoc-server.module';
import {PDocDataService} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service';
import {CommonDocWriterServerModule} from '../../backend-commons/modules/cdoc-writer-server.module';
import {PDocSearchForm} from '@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform';
import {PDocSearchResult} from '@dps/mycms-commons/dist/pdoc-commons/model/container/pdoc-searchresult';
import {PDocAdapterResponseMapper} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper';

export class PDocWriterServerModule extends CommonDocWriterServerModule<PDocRecord, PDocSearchForm, PDocSearchResult, PDocDataService> {
    public static configureRoutes(app: express.Application, apiPrefix: string, pdocServerModule: PDocServerModule): PDocWriterServerModule {
        const pdocWriterServerModule = new PDocWriterServerModule(pdocServerModule);
        CommonDocWriterServerModule.configureServerRoutes(app, apiPrefix, pdocWriterServerModule);
        return pdocWriterServerModule;
    }

    public constructor(pdocServerModule: PDocServerModule) {
        super(pdocServerModule, new PDocAdapterResponseMapper({}));
    }
}
