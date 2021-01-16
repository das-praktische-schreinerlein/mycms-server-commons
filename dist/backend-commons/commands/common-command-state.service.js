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
var admin_response_1 = require("@dps/mycms-commons/dist/commons/model/admin-response");
var CommonCommandStateService = /** @class */ (function () {
    function CommonCommandStateService(availableCommands) {
        this.commandRunStates = {};
        this.availableCommands = availableCommands;
    }
    CommonCommandStateService.prototype.getAllRunInformation = function () {
        var res = {};
        for (var _i = 0, _a = Object.keys(this.commandRunStates); _i < _a.length; _i++) {
            var command = _a[_i];
            res[command] = __assign({}, this.commandRunStates[command]);
        }
        return Promise.resolve(res);
    };
    ;
    CommonCommandStateService.prototype.getRunInformation = function (command) {
        if (!this.availableCommands.includes(command)) {
            Promise.reject('unknown command');
        }
        return Promise.resolve(__assign({}, this.commandRunStates[command]));
    };
    ;
    CommonCommandStateService.prototype.isRunning = function (command) {
        if (!this.availableCommands.includes(command)) {
            Promise.reject('unknown command');
        }
        if (this.commandRunStates[command] && this.commandRunStates[command].state === admin_response_1.CommonAdminCommandState.RUNNING) {
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    };
    ;
    CommonCommandStateService.prototype.isStartable = function (command) {
        return this.isRunning(command).then(function (running) {
            return Promise.resolve(!running);
        });
    };
    ;
    CommonCommandStateService.prototype.setCommandStarted = function (command, args) {
        var state = {
            command: command,
            state: admin_response_1.CommonAdminCommandState.RUNNING,
            resultState: admin_response_1.CommonAdminCommandResultState.RUNNING,
            started: new Date(),
            ended: undefined,
            resultMsg: undefined
        };
        return this.setCommandRunInformation(command, state);
    };
    ;
    CommonCommandStateService.prototype.setCommandEnded = function (action, args, resultMsg, resultState) {
        var _this = this;
        return this.getRunInformation(action).then(function (oldState) {
            var state = __assign({}, oldState, { state: admin_response_1.CommonAdminCommandState.AVAILABLE, resultState: resultState, ended: new Date(), resultMsg: resultMsg });
            return _this.setCommandRunInformation(action, state);
        });
    };
    ;
    CommonCommandStateService.prototype.setCommandRunInformation = function (action, state) {
        if (!this.availableCommands.includes(action)) {
            Promise.reject('unknown action');
        }
        this.commandRunStates[action] = __assign({}, state);
        return Promise.resolve(state);
    };
    ;
    return CommonCommandStateService;
}());
exports.CommonCommandStateService = CommonCommandStateService;
//# sourceMappingURL=common-command-state.service.js.map