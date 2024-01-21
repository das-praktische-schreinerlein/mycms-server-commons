import { ExportProcessingResult } from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import { ProcessingOptions } from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { CommonDocDataService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonDocSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import { PdfManager } from '../../media-commons/modules/pdf-manager';
export interface PdfExportProcessingOptions {
    generateMergedPdf?: boolean;
    addPageNumsStartingWith?: number;
    tocTemplate?: string;
    trimEmptyPages?: boolean;
}
export declare abstract class CommonDocPdfManagerModule<DS extends CommonDocDataService<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>> {
    protected dataService: DS;
    protected pdfManager: PdfManager;
    constructor(dataService: DS, pdfManager: PdfManager);
    generatePdfs(action: string, generateDir: string, generateName: string, baseUrl: string, queryParams: string, processingOptions: PdfExportProcessingOptions & ProcessingOptions, searchForm: CommonDocSearchForm, force: boolean): Promise<any>;
    generatePdf(mdoc: CommonDocRecord, action: string, generateDir: string, baseUrl: string, queryParams: string, processingOptions: PdfExportProcessingOptions & ProcessingOptions, force: boolean): Promise<ExportProcessingResult<CommonDocRecord>>;
    exportPdfs(action: string, exportDir: string, exportName: string, processingOptions: PdfExportProcessingOptions & ProcessingOptions, searchForm: CommonDocSearchForm, force: boolean): Promise<any>;
    protected abstract exportCommonDocRecordPdfFile(mdoc: CommonDocRecord, action: string, exportDir: string, exportName: string, processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>>;
    protected abstract generatePdfFileName(entity: CommonDocRecord): string;
    protected abstract updatePdfEntity(entity: CommonDocRecord, fileName: string): Promise<CommonDocRecord>;
    protected generateWebShotUrl(action: string, baseUrl: string, mdoc: CommonDocRecord, queryParams: string): string;
    protected generatePdfResultListFile(exportDir: string, exportName: string, generateResults: ExportProcessingResult<CommonDocRecord>[], processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>[]>;
    protected generatePdfResultListLstFile(exportDir: string, exportName: string, generateResults: ExportProcessingResult<CommonDocRecord>[], processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>[]>;
    protected generatePdfResultListHtmlFile(exportDir: string, exportName: string, generateResults: ExportProcessingResult<CommonDocRecord>[], processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>[]>;
    protected generatePdfResultListPdfFile(exportDir: string, exportName: string, generateResults: ExportProcessingResult<CommonDocRecord>[], processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>[]>;
}
