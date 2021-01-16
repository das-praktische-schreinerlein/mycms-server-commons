"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var XRegExp = require("xregexp");
var admin_response_1 = require("@dps/mycms-commons/dist/commons/model/admin-response");
var common_command_state_service_1 = require("./common-command-state.service");
var SimpleConfigFilePathValidationRule = /** @class */ (function (_super) {
    __extends(SimpleConfigFilePathValidationRule, _super);
    function SimpleConfigFilePathValidationRule(required) {
        return _super.call(this, required, new XRegExp('^[-_.a-zA-Z\/\\\\]*$', 'gi'), new XRegExp('[-_.a-zA-Z\/\\\\]*', 'gi'), '', 4096) || this;
    }
    return SimpleConfigFilePathValidationRule;
}(generic_validator_util_1.RegExValidationReplaceRule));
exports.SimpleConfigFilePathValidationRule = SimpleConfigFilePathValidationRule;
var SimpleFilePathValidationRule = /** @class */ (function (_super) {
    __extends(SimpleFilePathValidationRule, _super);
    function SimpleFilePathValidationRule(required) {
        return _super.call(this, required, new XRegExp('^[-_.a-zA-Z\/\\\\ \\p{LC}]*$', 'gi'), new XRegExp('[-_.a-zA-Z\/\\\\ \\p{LC}]*', 'gi'), '', 4096) || this;
    }
    return SimpleFilePathValidationRule;
}(generic_validator_util_1.RegExValidationReplaceRule));
exports.SimpleFilePathValidationRule = SimpleFilePathValidationRule;
var CommonAdminCommand = /** @class */ (function () {
    function CommonAdminCommand() {
        this.actionRunStates = {};
        this.parameterValidations = __assign({ command: new generic_validator_util_1.KeywordValidationRule(true), action: new generic_validator_util_1.KeywordValidationRule(true) }, this.createValidationRules());
        this.availableActions = this.definePossibleActions();
        this.commandStateService = new common_command_state_service_1.CommonCommandStateService(this.availableActions);
    }
    CommonAdminCommand.prototype.process = function (argv) {
        var me = this;
        return this.initializeArgs(argv).then(function (initializedArgs) {
            return me.validateCommandParameters(initializedArgs);
        }).then(function (validatedArgs) {
            return me.commandStateService.setCommandStarted(validatedArgs['action'], validatedArgs).then(function () {
                return me.processCommandArgs(validatedArgs).then(function (resultMsg) {
                    return me.commandStateService.setCommandEnded(validatedArgs['action'], validatedArgs, resultMsg, admin_response_1.CommonAdminCommandResultState.DONE);
                }).catch(function (reason) {
                    return me.commandStateService.setCommandEnded(validatedArgs['action'], validatedArgs, reason, admin_response_1.CommonAdminCommandResultState.ERROR).then(function () {
                        return Promise.reject(reason);
                    });
                });
            });
        });
    };
    CommonAdminCommand.prototype.listCommandParameters = function () {
        return Object.keys(this.parameterValidations);
    };
    CommonAdminCommand.prototype.validateCommandAction = function (action) {
        return this.availableActions.includes(action)
            ? Promise.resolve(action)
            : Promise.reject('action not defined');
    };
    ;
    CommonAdminCommand.prototype.isRunning = function (action) {
        return this.commandStateService.isRunning(action);
    };
    ;
    CommonAdminCommand.prototype.isStartable = function (action) {
        return this.commandStateService.isStartable(action);
    };
    ;
    CommonAdminCommand.prototype.validateCommandParameters = function (argv) {
        var errors = [];
        for (var _i = 0, _a = Object.keys(this.parameterValidations); _i < _a.length; _i++) {
            var key = _a[_i];
            if (!this.parameterValidations[key].isValid(argv[key])) {
                errors.push(key);
            }
        }
        return errors.length > 0
            ? Promise.reject('invalid parameters: ' + errors)
            : Promise.resolve(argv);
    };
    ;
    CommonAdminCommand.prototype.initializeArgs = function (argv) {
        var initializedArgs = {};
        for (var key in argv) {
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
    };
    return CommonAdminCommand;
}());
exports.CommonAdminCommand = CommonAdminCommand;
//# sourceMappingURL=common-admin.command.js.map