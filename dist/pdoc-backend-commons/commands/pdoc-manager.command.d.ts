import { CommonAdminCommand } from '../../backend-commons/commands/common-admin.command';
import { ValidationRule } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
export declare class PageManagerCommand extends CommonAdminCommand {
    protected createValidationRules(): {
        [key: string]: ValidationRule;
    };
    protected definePossibleActions(): string[];
    protected processCommandArgs(argv: {}): Promise<any>;
}
