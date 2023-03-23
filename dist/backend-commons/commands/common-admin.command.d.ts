import { AbstractCommand } from './abstract.command';
import { ValidationRule } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import { CommonAdminCommandStateType } from '@dps/mycms-commons/dist/commons/model/admin-response';
import { CommonCommandStateService } from './common-command-state.service';
export declare abstract class CommonAdminCommand implements AbstractCommand {
    protected parameterValidations: {
        [key: string]: ValidationRule;
    };
    protected availableActions: string[];
    protected actionRunStates: {
        [key: string]: CommonAdminCommandStateType;
    };
    protected commandStateService: CommonCommandStateService;
    constructor();
    process(argv: any): Promise<CommonAdminCommandStateType>;
    listCommandParameters(): string[];
    validateCommandAction(action: string): Promise<{}>;
    isRunning(action: string): Promise<boolean>;
    isStartable(action: string): Promise<boolean>;
    validateCommandParameters(argv: {}): Promise<{}>;
    protected initializeArgs(argv: {}): Promise<{}>;
    protected abstract processCommandArgs(argv: {}): Promise<any>;
    protected abstract createValidationRules(): {
        [key: string]: ValidationRule;
    };
    protected abstract definePossibleActions(): string[];
}
