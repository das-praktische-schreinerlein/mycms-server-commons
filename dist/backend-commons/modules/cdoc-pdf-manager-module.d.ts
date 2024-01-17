import { ExportProcessingResult } from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import { ProcessingOptions } from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { CommonDocDataService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonDocSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
export interface PdfManagerConfigType {
    nodejsBinaryPath: string;
    webshot2pdfCommandPath: string;
}
export declare abstract class CommonDocPdfManagerModule<DS extends CommonDocDataService<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>> {
    protected dataService: DS;
    protected backendConfig: PdfManagerConfigType;
    protected nodePath: string;
    protected webshot2pdfCommandPath: string;
    constructor(dataService: DS, backendConfig: PdfManagerConfigType);
    generatePdfs(action: string, generateDir: string, generateName: string, baseUrl: string, queryParams: string, processingOptions: ProcessingOptions, searchForm: CommonDocSearchForm, force: boolean): Promise<any>;
    generatePdf(mdoc: CommonDocRecord, action: string, generateDir: string, baseUrl: string, queryParams: string, force: boolean): Promise<ExportProcessingResult<CommonDocRecord>>;
    exportPdfs(action: string, exportDir: string, exportName: string, processingOptions: ProcessingOptions, searchForm: CommonDocSearchForm, force: boolean): Promise<any>;
    protected abstract exportCommonDocRecordPdfFile(mdoc: CommonDocRecord, action: string, exportDir: string, exportName: string, processingOptions: ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>>;
    protected abstract generatePdfFileName(entity: CommonDocRecord): string;
    protected abstract updatePdfEntity(entity: CommonDocRecord, fileName: string): Promise<CommonDocRecord>;
    protected generateWebShotUrl(action: string, baseUrl: string, mdoc: CommonDocRecord, queryParams: string): string;
    protected generatePdfResultListFile(exportDir: string, exportName: string, generateResults: ExportProcessingResult<CommonDocRecord>[]): Promise<any>;
}
