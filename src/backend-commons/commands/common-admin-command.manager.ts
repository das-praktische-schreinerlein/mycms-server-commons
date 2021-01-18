import {CommonAdminCommand} from './common-admin.command';
import * as Promise_serial from 'promise-serial';
import {
    CommonAdminCommandResultState,
    CommonAdminCommandsListResponseType,
    CommonAdminCommandStateType
} from '@dps/mycms-commons/dist/commons/model/admin-response';
import {CommonCommandStateService} from './common-command-state.service';

export interface CommonAdminPreparedCommandCommandConfigType {
    parameters: {[key: string]: string}[];
}

export interface CommonAdminPreparedCommandConfigType {
    commands: CommonAdminPreparedCommandCommandConfigType[];
    description: string;
}

export interface CommonAdminCommandConfigType {
    adminWritable: boolean;
    availableCommands?: {[key: string]: string[]};
    preparedCommands: {[key: string]: CommonAdminPreparedCommandConfigType};
    constantParameters?: {[key: string]: string};
}

export interface CommonAdminCommandsRequestType {
    command: CommonAdminCommand;
    parameters: {[key: string]: string};
}

export abstract class CommonAdminCommandManager<A extends CommonAdminCommandConfigType> {
    protected commands: {[key: string]: CommonAdminCommand};
    protected adminCommandConfig: A;
    protected commandStateService: CommonCommandStateService;

    constructor(commands: {[key: string]: CommonAdminCommand}, adminCommandConfig: A) {
        this.commands = commands;
        this.adminCommandConfig = adminCommandConfig;
        this.commandStateService = new CommonCommandStateService();
    }

    public listPreparedCommands(): {[key: string]: CommonAdminCommandsListResponseType} {
        const res: {[key: string]: CommonAdminCommandsListResponseType} = {};
        for (const key in this.adminCommandConfig.preparedCommands) {
            if (!this.adminCommandConfig.preparedCommands.hasOwnProperty(key)) {
                continue;
            }

            res[key] = {
                command: key,
                description: this.adminCommandConfig.preparedCommands[key].description
            };
        }

        return res;
    }

    public listCommandStatus(): Promise<{[key: string]: CommonAdminCommandStateType}> {
        return Promise.resolve(this.commandStateService.getAllRunInformation());
    }

    public listAvailableCommands(): {[key: string]: CommonAdminCommandsListResponseType} {
        const res: {[key: string]: CommonAdminCommandsListResponseType} = {};
        if (this.adminCommandConfig === undefined || this.adminCommandConfig.availableCommands === undefined
            || this.commands === undefined) {
            return res;
        }

        for (const key in this.commands) {
            if (!this.adminCommandConfig.availableCommands.hasOwnProperty(key)) {
                continue;
            }

            res[key] = {
                command: key,
                actions: this.adminCommandConfig.availableCommands[key],
            };

            if (this.commands[key] !== undefined) {
                res[key].parameters = this.commands[key].listCommandParameters();
            }
        }

        return res;
    }

    public runCommand(argv: string[]): Promise<CommonAdminCommandStateType> {
        return this.process(argv, true);
    }

    public startCommand(argv: string[]): Promise<CommonAdminCommandStateType> {
        return this.process(argv, false);
    }

    protected process(argv: string[], modal: boolean): Promise<CommonAdminCommandStateType> {
        const me = this;
        let preparedCommandName = argv['preparedCommand'];
        return this.initializeArgs(argv).then(initializedArgs => {
            if (preparedCommandName) {
                return me.initializePreparedCommand(initializedArgs);
            }

            return me.initializeCommand(initializedArgs).then(commandRequest => {
                preparedCommandName = initializedArgs['command'] + '.' + initializedArgs['action'];
                return Promise.resolve([commandRequest]);
            });
        }).then(commandRequests => {
            const promises = [];
            for (const commandRequest of commandRequests) {
                promises.push(function() {
                    return me.validateCommandParameters(commandRequest);
                });
            }

            return Promise_serial(promises, {parallelize: 1});
        }).then(commandRequests => {
            const promises = [];
            for (const commandRequest of commandRequests) {
                promises.push(function() {
                    return me.validateStartable(commandRequest);
                });
            }

            return Promise_serial(promises, {parallelize: 1});
        }).then(commandRequests => {
            const promises = [];
            for (const commandRequest of commandRequests) {
                promises.push(function() {
                    return me.processCommandArgs(commandRequest);
                });
            }

            return me.commandStateService.setCommandStarted(preparedCommandName, undefined).then(startResult => {
                const runResult = Promise_serial(promises, {parallelize: 1}).then(resultArray => {
                    return me.commandStateService.setCommandEnded(preparedCommandName, undefined, resultArray,
                        CommonAdminCommandResultState.DONE);
                }).catch(reason => {
                    return me.commandStateService.setCommandEnded(preparedCommandName, undefined, reason,
                        CommonAdminCommandResultState.ERROR).then(() => {
                        return Promise.reject(reason);
                    })
                });

                if (modal) {
                    return runResult;
                }

                return Promise.resolve(startResult)
            });
        });
    }

    protected initializeArgs(argv: {}): Promise<{}> {
        const initializedArgs = {...argv};
        for (const key in this.adminCommandConfig.constantParameters) {
            if (!this.adminCommandConfig.constantParameters.hasOwnProperty(key)) {
                continue;
            }

            initializedArgs[key] = this.adminCommandConfig.constantParameters[key];
        }

        return Promise.resolve(initializedArgs);
    }

    protected initializePreparedCommand(argv: {}): Promise<CommonAdminCommandsRequestType[]> {
        const preparedCommandName = argv['preparedCommand'];
        if (preparedCommandName === undefined) {
            return Promise.reject('preparedCommand not defined');
        }

        if (this.adminCommandConfig === undefined || this.adminCommandConfig.adminWritable !== true) {
            return Promise.reject('adminCommandConfig.adminWritable not active');
        }

        if (this.commands === undefined || Object.keys(this.commands).length < 1) {
            return Promise.reject('no commands defined');
        }

        if (this.adminCommandConfig.preparedCommands === undefined
            || Object.keys(this.adminCommandConfig.preparedCommands).length < 1) {
            return Promise.reject('adminCommandConfig.preparedCommands not defined');
        }

        const preparedCommand = this.adminCommandConfig.preparedCommands[preparedCommandName];
        if (preparedCommand === undefined) {
            return Promise.reject('preparedCommand not found');
        }

        const preparedCommandRequest: CommonAdminCommandsRequestType[] = [];
        for (const command of preparedCommand.commands) {
            const initializedArgs = {};
            for (const key in command.parameters) {
                if (!command.parameters.hasOwnProperty(key)) {
                    continue;
                }

                initializedArgs[key] = command.parameters[key];
            }

            const requestedCommand = initializedArgs['command'];
            if (this.commands[requestedCommand] === undefined) {
                return Promise.reject('command not defined');
            }

            preparedCommandRequest.push({
                command: this.commands[requestedCommand],
                parameters: initializedArgs
            });
        }

        return Promise.resolve(preparedCommandRequest)
    }

    protected initializeCommand(argv: {}): Promise<CommonAdminCommandsRequestType> {
        const requestedCommand = argv['command'];
        const requestedAction = argv['action'];
        return this.validateCommandAndAction(requestedCommand, requestedAction).then(() => {
            const command = this.commands[requestedCommand];
            return Promise.resolve({
                command: command,
                parameters: argv
            });
        })
    }

    protected validateStartable(commandRequest: CommonAdminCommandsRequestType): Promise<CommonAdminCommandsRequestType> {
        return commandRequest.command.isStartable(commandRequest.parameters['action']).then(startable => {
            return startable
                ? Promise.resolve(commandRequest)
                : Promise.reject('BLOCKED: action is not startable - maybe already running');
        });
    }

    protected validateCommandParameters(commandRequest: CommonAdminCommandsRequestType): Promise<CommonAdminCommandsRequestType> {
        return commandRequest.command.validateCommandParameters(commandRequest.parameters).then(() => {
            return Promise.resolve(commandRequest);
        });
    }

    protected processCommandArgs(commandRequest: CommonAdminCommandsRequestType): Promise<CommonAdminCommandStateType> {
        return commandRequest.command.process(commandRequest.parameters);
    }

    protected validateCommandAndAction(requestedCommand: string, requestedAction: string): Promise<boolean> {
        if (this.adminCommandConfig === undefined || this.adminCommandConfig.adminWritable !== true) {
            return Promise.reject('adminCommandConfig.adminWritable not active');
        }

        if (this.adminCommandConfig.availableCommands === undefined
            || Object.keys(this.adminCommandConfig.availableCommands).length < 1) {
            return Promise.reject('adminCommandConfig.commands not defined');
        }

        if (this.commands === undefined || Object.keys(this.commands).length < 1) {
            return Promise.reject('no commands defined');
        }

        let availableCommandActions;
        if (Object.keys(this.adminCommandConfig.availableCommands).length === 1
            && this.adminCommandConfig.availableCommands['*'] !== undefined) {
            availableCommandActions = this.adminCommandConfig.availableCommands['*'];
        } else if (this.adminCommandConfig.availableCommands[requestedCommand] !== undefined) {
            availableCommandActions = this.adminCommandConfig.availableCommands[requestedCommand];
        } else {
            return Promise.reject('command not allowed');
        }

        if (requestedAction !== undefined
            && !(availableCommandActions.length === 1 && availableCommandActions[0] === '*')
            && !availableCommandActions.includes(requestedAction)) {
            return Promise.reject('action not allowed');
        }

        if (this.commands[requestedCommand] === undefined) {
            return Promise.reject('command not defined');
        }

        const command = this.commands[requestedCommand];
        return command.validateCommandAction(requestedAction).then(() => {
            return Promise.resolve(true);
        });
    }

}

