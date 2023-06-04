import { StaticPagesDataService } from '@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.service';
import express from 'express';
export declare class PagesServerModule {
    static configureRoutes(app: express.Application, apiPrefix: string, dataService: StaticPagesDataService, locale: string, profile: string): void;
}
