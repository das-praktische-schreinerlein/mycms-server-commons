import { ValidationRule } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import { PDocSearchForm } from '@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform';
export declare class PDocExportManagerUtils {
    static createExportValidationRules(): {
        [key: string]: ValidationRule;
    };
    static createPDocSearchFormValidationRules(): {
        [key: string]: ValidationRule;
    };
    static createPDocSearchForm(type: string, argv: {}): Promise<PDocSearchForm>;
}
