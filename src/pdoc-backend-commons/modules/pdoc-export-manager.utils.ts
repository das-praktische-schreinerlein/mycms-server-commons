import {
    IdCsvValidationRule,
    NumberValidationRule,
    SimpleFilePathValidationRule,
    SolrValidationRule,
    ValidationRule,
    WhiteListValidationRule
} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import {PDocSearchForm} from '@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform';

export class PDocExportManagerUtils {
    public static createExportValidationRules(): {[key: string]: ValidationRule} {
        return {
            exportDir: new SimpleFilePathValidationRule(false),
            exportName: new SimpleFilePathValidationRule(false),
            ignoreErrors: new NumberValidationRule(false, 1, 999999999, 10),
            parallel: new NumberValidationRule(false, 1, 99, 10),
            force: new WhiteListValidationRule(false, [true, false, 'true', 'false'], false)
        };
    }

    public static createPDocSearchFormValidationRules(): {[key: string]: ValidationRule} {
        return {
            pageNum: new NumberValidationRule(false, 1, 999999999, 1),
            subtype: new IdCsvValidationRule(false),
            langkeys: new IdCsvValidationRule(false),
            profiles: new IdCsvValidationRule(false),
            fulltext: new SolrValidationRule(false)
        };
    }

    public static createPDocSearchForm(type: string, argv: {}): Promise<PDocSearchForm> {
        const pageNum = Number.parseInt(argv['pageNum'], 10);
        const subtype = argv['subtype'];
        const langkeys = argv['langkeys'];
        const profiles = argv['profiles'];
        const fulltext = argv['fulltext'];

        const searchForm = new PDocSearchForm({
            type: type,
            subtype: subtype,
            langkeys: langkeys,
            profiles: profiles,
            fulltext: fulltext,
            sort: 'forExport',
            pageNum: Number.isInteger(pageNum) ? pageNum : 1
        });

        return Promise.resolve(searchForm);
    }

}
