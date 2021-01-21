import {AbstractCommand} from './abstract.command';
import {
    KeywordValidationRule,
    RegExValidationReplaceRule,
    ValidationRule
} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import * as XRegExp from 'xregexp';
import {
    CommonAdminCommandResultState,
    CommonAdminCommandStateType
} from '@dps/mycms-commons/dist/commons/model/admin-response';
import {CommonCommandStateService} from './common-command-state.service';

export class SimpleConfigFilePathValidationRule extends RegExValidationReplaceRule {
    constructor(required: boolean) {
        super(required,
            new XRegExp('^[-_.a-zA-Z0-9:\/\\\\]*$', 'gi'),
            new XRegExp('[-_.a-zA-Z0-9:\/\\\\]*', 'gi'), '', 4096);
    }
}

export class SimpleFilePathValidationRule extends RegExValidationReplaceRule {
    constructor(required: boolean) {
        super(required,
            new XRegExp('^[-_.a-zA-Z0-9:\/\\\\ \\p{LC}]*$', 'gi'),
            new XRegExp('[-_.a-zA-Z0-9:\/\\\\ \\p{LC}]*', 'gi'), '', 4096);
    }
}

export abstract class CommonAdminCommand implements AbstractCommand {
    protected parameterValidations: {[key: string]: ValidationRule};
    protected availableActions: string[];
    protected actionRunStates: {[key: string]: CommonAdminCommandStateType} = {};
    protected commandStateService: CommonCommandStateService;

    constructor() {
        this.parameterValidations = {
            command: new KeywordValidationRule(true),
            action: new KeywordValidationRule(true),
            ...this.createValidationRules()
        };
        this.availableActions = this.definePossibleActions();
        this.commandStateService = new CommonCommandStateService()
    }

    public process(argv): Promise<CommonAdminCommandStateType> {
        const me = this;
        return this.initializeArgs(argv).then(initializedArgs => {
            return me.validateCommandParameters(initializedArgs);
        }).then(validatedArgs => {
            return me.commandStateService.setCommandStarted(validatedArgs['action'], validatedArgs).then(() => {
                return me.processCommandArgs(validatedArgs).then(resultMsg => {
                    return me.commandStateService.setCommandEnded(validatedArgs['action'], validatedArgs, resultMsg,
                        CommonAdminCommandResultState.DONE);
                }).catch(reason => {
                    return me.commandStateService.setCommandEnded(validatedArgs['action'], validatedArgs, reason,
                        CommonAdminCommandResultState.ERROR).then(() => {
                        return Promise.reject(reason);
                    })
                })
            })
        });
    }

    public listCommandParameters(): string[] {
        return Object.keys(this.parameterValidations);
    }

    public validateCommandAction(action: string): Promise<{}> {
        return this.availableActions.includes(action)
            ? Promise.resolve(action)
            : Promise.reject('action not defined');
    };

    public isRunning(action: string): Promise<boolean> {
        return this.commandStateService.isRunning(action);
    };

    public isStartable(action: string): Promise<boolean> {
        return this.commandStateService.isStartable(action);
    };

    public validateCommandParameters(argv: {}): Promise<{}> {
        const errors = [];
        for (const key of Object.keys(this.parameterValidations)) {
            if (!this.parameterValidations[key].isValid(argv[key])) {
                errors.push(key);
            }
        }

        return errors.length > 0
            ? Promise.reject('invalid parameters: ' + errors)
            : Promise.resolve(argv);
    };

    protected initializeArgs(argv: {}): Promise<{}> {
        const initializedArgs = {};
        for (const key in argv) {
            if (!argv.hasOwnProperty(key)) {
                continue;
            }

            if (!this.parameterValidations.hasOwnProperty(key)) {
                console.log('SKIP parameter - ignore parameter as it is not defined for validation', key);
                continue;
            }

            initializedArgs[key] = argv[key];
        }

        return Promise.resolve(initializedArgs);
    }

    protected abstract processCommandArgs(argv: {}): Promise<any>;
    protected abstract createValidationRules(): {[key: string]: ValidationRule};
    protected abstract definePossibleActions(): string[];
}

