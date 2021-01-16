import { CommonAdminCommand } from './common-admin.command';
import { CommonAdminCommandsListResponseType, CommonAdminCommandStateType } from '@dps/mycms-commons/dist/commons/model/admin-response';
import { CommonCommandStateService } from './common-command-state.service';
export interface CommonAdminPreparedCommandCommandConfigType {
    parameters: {
        [key: string]: string;
    }[];
}
export interface CommonAdminPreparedCommandConfigType {
    commands: CommonAdminPreparedCommandCommandConfigType[];
    description: string;
}
export interface CommonAdminCommandConfigType {
    adminWritable: boolean;
    availableCommands?: {
        [key: string]: string[];
    };
    preparedCommands: {
        [key: string]: CommonAdminPreparedCommandConfigType;
    };
    constantParameters?: {
        [key: string]: string;
    };
}
export interface CommonAdminCommandsRequestType {
    command: CommonAdminCommand;
    parameters: {
        [key: string]: string;
    };
}
export declare abstract class CommonAdminCommandManager<A extends CommonAdminCommandConfigType> {
    protected commands: {
        [key: string]: CommonAdminCommand;
    };
    protected adminCommandConfig: A;
    protected commandStateService: CommonCommandStateService;
    constructor(commands: {
        [key: string]: CommonAdminCommand;
    }, adminCommandConfig: A);
    listPreparedCommands(): {
        [key: string]: CommonAdminCommandsListResponseType;
    };
    listCommandStatus(): Promise<{
        [key: string]: CommonAdminCommandStateType;
    }>;
    listAvailableCommands(): {
        [key: string]: CommonAdminCommandsListResponseType;
    };
    runCommand(argv: string[]): Promise<CommonAdminCommandStateType>;
    startCommand(argv: string[]): Promise<CommonAdminCommandStateType>;
    protected process(argv: string[], modal: boolean): Promise<CommonAdminCommandStateType>;
    protected initializeArgs(argv: {}): Promise<{}>;
    protected initializePreparedCommand(argv: {}): Promise<CommonAdminCommandsRequestType[]>;
    protected initializeCommand(argv: {}): Promise<CommonAdminCommandsRequestType>;
    protected validateStartable(commandRequest: CommonAdminCommandsRequestType): Promise<CommonAdminCommandsRequestType>;
    protected validateCommandParameters(commandRequest: CommonAdminCommandsRequestType): Promise<CommonAdminCommandsRequestType>;
    protected processCommandArgs(commandRequest: CommonAdminCommandsRequestType): Promise<CommonAdminCommandStateType>;
    protected validateCommandAndAction(requestedCommand: string, requestedAction: string): Promise<boolean>;
}
