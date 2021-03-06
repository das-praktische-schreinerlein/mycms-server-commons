import { ValidationRule } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import { CommonAdminCommand } from './common-admin.command';
export declare class ConfigInitializerCommand extends CommonAdminCommand {
    protected configbasepath: string;
    protected createValidationRules(): {
        [key: string]: ValidationRule;
    };
    protected definePossibleActions(): string[];
    protected processCommandArgs(argv: {}): Promise<any>;
    protected setTokenCookie(tokenkey: string, newpassword: string): Promise<any>;
}
