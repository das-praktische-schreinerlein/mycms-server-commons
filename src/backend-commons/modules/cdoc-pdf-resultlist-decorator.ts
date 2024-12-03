import {ExportProcessingResult} from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';

export class CommonDocPdfResultListDecorator {

    public generatePdfResultListLstEntry(generateResult: ExportProcessingResult<CommonDocRecord>): string {
        const fileName = generateResult.exportFileEntry;
        const name = generateResult.record.name;
        const rtype = generateResult.record.type;
        return [fileName, name, rtype, ''].join('\t')
    }

    public generatePdfResultListHtmlEntry(generateResult: ExportProcessingResult<CommonDocRecord>): string {
        const fileName = generateResult.exportFileEntry;
        const name = generateResult.record.name;
        const rtype = generateResult.record.type;
        return `<div class='bookmark_line bookmark_line_$rtype'><div class='bookmark_file'><a href="$fileName" target="_blank">$fileName</a></div><div class='bookmark_name'><a href="$fileName" target="_blank">$name</a></div><div class='bookmark_page'></div></div>`
            .replace(/\$fileName/g, fileName)
            .replace(/\$name/g, name)
            .replace(/\$rtype/g, rtype);
    }

}

