import {ProcessingOptions} from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import {SitemapConfig} from '../../backend-commons/modules/sitemap-generator.module';
import {StringUtils} from '@dps/mycms-commons/dist/commons/utils/string.utils';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {CommonDocPdfManagerModule, PdfManagerConfigType} from '../../backend-commons/modules/cdoc-pdf-manager-module';
import {PDocRecord} from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import {PDocDataService} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service';

export class PagePdfManagerModule extends CommonDocPdfManagerModule<PDocDataService> {

    private sitemapConfig: SitemapConfig;

    constructor(dataService: PDocDataService, backendConfig: PdfManagerConfigType, sitemapConfig: SitemapConfig) {
        super(dataService, backendConfig);
        this.sitemapConfig = sitemapConfig;
    }

    protected exportCommonDocRecordPdfFile(mdoc: CommonDocRecord, action: string, exportDir: string, exportName: string,
                                           processingOptions: ProcessingOptions) {
        return this.generatePdf(<PDocRecord>mdoc, action, exportDir, this.sitemapConfig.showBaseUrl, undefined, false);
    }

    protected generateWebShotUrl(action: string, baseUrl: string, mdoc: PDocRecord, queryParams: string) {
        return baseUrl + '/' + mdoc.key + '?print&' + queryParams;
    }

    protected generatePdfFileName(entity: PDocRecord): string {
        if (!entity) {
            return undefined;
        }

        let name = StringUtils.generateTechnicalName(entity.name);

        const baseName = [entity.type, entity.key, entity.id].join('_') + '.pdf';
        if ([baseName, name].join('_').length > 140) {
            name = name.substring(0, 135 - baseName.length);
        }

        return [entity.type, entity.key,
            name,
            entity.id].join('_') + '.pdf';
    }

    protected updatePdfEntity(entity: CommonDocRecord, fileName: string): Promise<CommonDocRecord> {
        return Promise.resolve(entity);
    }

}
