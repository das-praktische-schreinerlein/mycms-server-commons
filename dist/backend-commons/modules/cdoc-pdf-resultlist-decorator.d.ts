import { ExportProcessingResult } from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
export declare class CommonDocPdfResultListDecorator {
    generatePdfResultListLstEntry(generateResult: ExportProcessingResult<CommonDocRecord>): string;
    generatePdfResultListHtmlEntry(generateResult: ExportProcessingResult<CommonDocRecord>): string;
}
