import { StaticPagesDataService } from '@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.service';
import { CommonPDocBackendConfigType } from './pdoc-backend.commons';
import { MarkdownService } from '@dps/mycms-commons/dist/markdown-commons/markdown.service';
export declare class PagesDataserviceModule {
    private static dataServices;
    static getDataService(profile: string, backendConfig: CommonPDocBackendConfigType<any>, locale: string, markdownService: MarkdownService): StaticPagesDataService;
    private static createDataService;
    private static createLegacyDataService;
    private static remapRecord;
}
