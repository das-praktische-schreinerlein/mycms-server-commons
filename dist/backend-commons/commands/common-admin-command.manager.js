"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Promise_serial = require("promise-serial");
var admin_response_1 = require("@dps/mycms-commons/dist/commons/model/admin-response");
var common_command_state_service_1 = require("./common-command-state.service");
var CommonAdminCommandManager = /** @class */ (function () {
    function CommonAdminCommandManager(commands, adminCommandConfig) {
        this.commands = commands;
        this.adminCommandConfig = adminCommandConfig;
        this.commandStateService = new common_command_state_service_1.CommonCommandStateService(Object.keys(this.adminCommandConfig.preparedCommands));
    }
    CommonAdminCommandManager.prototype.listPreparedCommands = function () {
        var res = {};
        for (var key in this.adminCommandConfig.preparedCommands) {
            if (!this.adminCommandConfig.preparedCommands.hasOwnProperty(key)) {
                continue;
            }
            res[key] = {
                command: key,
                description: this.adminCommandConfig.preparedCommands[key].description
            };
        }
        return res;
    };
    CommonAdminCommandManager.prototype.listCommandStatus = function () {
        return Promise.resolve(this.commandStateService.getAllRunInformation());
    };
    CommonAdminCommandManager.prototype.listAvailableCommands = function () {
        var res = {};
        if (this.adminCommandConfig === undefined || this.adminCommandConfig.availableCommands === undefined
            || this.commands === undefined) {
            return res;
        }
        for (var key in this.commands) {
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
    };
    CommonAdminCommandManager.prototype.runCommand = function (argv) {
        return this.process(argv, true);
    };
    CommonAdminCommandManager.prototype.startCommand = function (argv) {
        return this.process(argv, false);
    };
    CommonAdminCommandManager.prototype.process = function (argv, modal) {
        var me = this;
        var preparedCommandName = argv['preparedCommand'];
        return this.initializeArgs(argv).then(function (initializedArgs) {
            if (preparedCommandName) {
                return me.initializePreparedCommand(initializedArgs);
            }
            return me.initializeCommand(initializedArgs).then(function (commandRequest) {
                preparedCommandName = initializedArgs['command'] + '.' + initializedArgs['action'];
                return Promise.resolve([commandRequest]);
            });
        }).then(function (commandRequests) {
            var promises = [];
            var _loop_1 = function (commandRequest) {
                promises.push(function () {
                    return me.validateCommandParameters(commandRequest);
                });
            };
            for (var _i = 0, commandRequests_1 = commandRequests; _i < commandRequests_1.length; _i++) {
                var commandRequest = commandRequests_1[_i];
                _loop_1(commandRequest);
            }
            return Promise_serial(promises, { parallelize: 1 });
        }).then(function (commandRequests) {
            var promises = [];
            var _loop_2 = function (commandRequest) {
                promises.push(function () {
                    return me.validateStartable(commandRequest);
                });
            };
            for (var _i = 0, commandRequests_2 = commandRequests; _i < commandRequests_2.length; _i++) {
                var commandRequest = commandRequests_2[_i];
                _loop_2(commandRequest);
            }
            return Promise_serial(promises, { parallelize: 1 });
        }).then(function (commandRequests) {
            var promises = [];
            var _loop_3 = function (commandRequest) {
                promises.push(function () {
                    return me.processCommandArgs(commandRequest);
                });
            };
            for (var _i = 0, commandRequests_3 = commandRequests; _i < commandRequests_3.length; _i++) {
                var commandRequest = commandRequests_3[_i];
                _loop_3(commandRequest);
            }
            return me.commandStateService.setCommandStarted(preparedCommandName, undefined).then(function (startResult) {
                var runResult = Promise_serial(promises, { parallelize: 1 }).then(function (resultArray) {
                    return me.commandStateService.setCommandEnded(preparedCommandName, undefined, resultArray, admin_response_1.CommonAdminCommandResultState.DONE);
                }).catch(function (reason) {
                    return me.commandStateService.setCommandEnded(preparedCommandName, undefined, reason, admin_response_1.CommonAdminCommandResultState.ERROR).then(function () {
                        return Promise.reject(reason);
                    });
                });
                if (modal) {
                    return runResult;
                }
                return Promise.resolve(startResult);
            });
        });
    };
    CommonAdminCommandManager.prototype.initializeArgs = function (argv) {
        var initializedArgs = __assign({}, argv);
        for (var key in this.adminCommandConfig.constantParameters) {
            if (!this.adminCommandConfig.constantParameters.hasOwnProperty(key)) {
                continue;
            }
            initializedArgs[key] = this.adminCommandConfig.constantParameters[key];
        }
        return Promise.resolve(initializedArgs);
    };
    CommonAdminCommandManager.prototype.initializePreparedCommand = function (argv) {
        var preparedCommandName = argv['preparedCommand'];
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
        var preparedCommand = this.adminCommandConfig.preparedCommands[preparedCommandName];
        if (preparedCommand === undefined) {
            return Promise.reject('preparedCommand not found');
        }
        var preparedCommandRequest = [];
        for (var _i = 0, _a = preparedCommand.commands; _i < _a.length; _i++) {
            var command = _a[_i];
            var initializedArgs = {};
            for (var key in command.parameters) {
                if (!command.parameters.hasOwnProperty(key)) {
                    continue;
                }
                initializedArgs[key] = command.parameters[key];
            }
            var requestedCommand = initializedArgs['command'];
            if (this.commands[requestedCommand] === undefined) {
                return Promise.reject('command not defined');
            }
            preparedCommandRequest.push({
                command: this.commands[requestedCommand],
                parameters: initializedArgs
            });
        }
        return Promise.resolve(preparedCommandRequest);
    };
    CommonAdminCommandManager.prototype.initializeCommand = function (argv) {
        var _this = this;
        var requestedCommand = argv['command'];
        var requestedAction = argv['action'];
        return this.validateCommandAndAction(requestedCommand, requestedAction).then(function () {
            var command = _this.commands[requestedCommand];
            return Promise.resolve({
                command: command,
                parameters: argv
            });
        });
    };
    CommonAdminCommandManager.prototype.validateStartable = function (commandRequest) {
        return commandRequest.command.isStartable(commandRequest.parameters['action']).then(function (startable) {
            return startable
                ? Promise.resolve(commandRequest)
                : Promise.reject('BLOCKED: action is not startable - maybe already running');
        });
    };
    CommonAdminCommandManager.prototype.validateCommandParameters = function (commandRequest) {
        return commandRequest.command.validateCommandParameters(commandRequest.parameters).then(function () {
            return Promise.resolve(commandRequest);
        });
    };
    CommonAdminCommandManager.prototype.processCommandArgs = function (commandRequest) {
        return commandRequest.command.process(commandRequest.parameters);
    };
    CommonAdminCommandManager.prototype.validateCommandAndAction = function (requestedCommand, requestedAction) {
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
        var availableCommandActions;
        if (Object.keys(this.adminCommandConfig.availableCommands).length === 1
            && this.adminCommandConfig.availableCommands['*'] !== undefined) {
            availableCommandActions = this.adminCommandConfig.availableCommands['*'];
        }
        else if (this.adminCommandConfig.availableCommands[requestedCommand] !== undefined) {
            availableCommandActions = this.adminCommandConfig.availableCommands[requestedCommand];
        }
        else {
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
        var command = this.commands[requestedCommand];
        return command.validateCommandAction(requestedAction).then(function () {
            return Promise.resolve(true);
        });
    };
    return CommonAdminCommandManager;
}());
exports.CommonAdminCommandManager = CommonAdminCommandManager;
//# sourceMappingURL=common-admin-command.manager.js.map