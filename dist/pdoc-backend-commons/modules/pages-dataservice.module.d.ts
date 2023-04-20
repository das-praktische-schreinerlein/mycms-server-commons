import { StaticPagesDataService } from '@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.service';
import { CommonPDocBackendConfigType } from './pdoc-backend.commons';
export declare class PagesDataserviceModule {
    private static dataServices;
    static getDataService(profile: string, backendConfig: CommonPDocBackendConfigType<any>, locale: string): StaticPagesDataService;
    private static createDataService;
}
