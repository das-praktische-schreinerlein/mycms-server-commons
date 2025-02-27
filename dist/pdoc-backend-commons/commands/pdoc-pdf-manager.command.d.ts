import { CommonAdminCommand } from '../../backend-commons/commands/common-admin.command';
import { ValidationRule } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import { CommonPDocBackendConfigType } from '../modules/pdoc-backend.commons';
import { CommonPdfBackendConfigType } from '../../backend-commons/modules/backend.commons';
import { PdfManagerConfigType } from '../../media-commons/modules/pdf-manager';
export interface PDocPdfBackendConfigType extends CommonPdfBackendConfigType, PdfManagerConfigType, CommonPDocBackendConfigType<any> {
}
export declare class PDocPdfManagerCommand extends CommonAdminCommand {
    protected createValidationRules(): {
        [key: string]: ValidationRule;
    };
    protected definePossibleActions(): string[];
    protected processCommandArgs(argv: {}): Promise<any>;
    protected getGenerateTypeFromAction(action: string): string;
    protected getExportTypeFromAction(action: string): string;
}
