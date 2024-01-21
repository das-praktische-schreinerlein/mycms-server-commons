import { ProcessingOptions } from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import { SitemapConfig } from '../../backend-commons/modules/sitemap-generator.module';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { CommonDocPdfManagerModule, PdfExportProcessingOptions } from '../../backend-commons/modules/cdoc-pdf-manager-module';
import { PDocRecord } from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import { PDocDataService } from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service';
import { PdfManager } from '../../media-commons/modules/pdf-manager';
export declare class PagePdfManagerModule extends CommonDocPdfManagerModule<PDocDataService> {
    private sitemapConfig;
    constructor(dataService: PDocDataService, pdfManager: PdfManager, sitemapConfig: SitemapConfig);
    protected exportCommonDocRecordPdfFile(mdoc: CommonDocRecord, action: string, exportDir: string, exportName: string, processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<import("@dps/mycms-commons/dist/search-commons/services/cdoc-export.service").ExportProcessingResult<CommonDocRecord>>;
    protected generateWebShotUrl(action: string, baseUrl: string, mdoc: PDocRecord, queryParams: string): string;
    protected generatePdfFileName(entity: PDocRecord): string;
    protected updatePdfEntity(entity: CommonDocRecord, fileName: string): Promise<CommonDocRecord>;
}
