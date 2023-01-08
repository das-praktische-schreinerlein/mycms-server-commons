"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var password_utils_1 = require("@dps/mycms-commons/dist/commons/utils/password.utils");
var config_initializer_util_1 = require("@dps/mycms-commons/dist/tools/config-initializer.util");
var Promise_serial = require("promise-serial");
var common_admin_command_1 = require("./common-admin.command");
var ConfigInitializerCommand = /** @class */ (function (_super) {
    __extends(ConfigInitializerCommand, _super);
    function ConfigInitializerCommand() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ConfigInitializerCommand.prototype.createValidationRules = function () {
        return {
            'newpassword': new generic_validator_util_1.PasswordValidationRule(false),
            'tokenkey': new generic_validator_util_1.PasswordValidationRule(false),
            'configbasepath': new common_admin_command_1.SimpleConfigFilePathValidationRule(false)
        };
    };
    ConfigInitializerCommand.prototype.definePossibleActions = function () {
        return ['resetServicePasswords',
            'resetTokenCookie', 'setTokenCookie'
        ];
    };
    ConfigInitializerCommand.prototype.processCommandArgs = function (argv) {
        this.configbasepath = argv['configbasepath'] || 'config';
        var tokenkey = argv['tokenkey'];
        var newpassword = argv['newpassword'];
        var action = argv['action'];
        switch (action) {
            case 'resetServicePasswords':
                return Promise.resolve('DONE - resetServicePasswords');
            case 'resetTokenCookie':
                return this.setTokenCookie(tokenkey, password_utils_1.PasswordUtils.createNewDefaultPassword(30));
            case 'setTokenCookie':
                return this.setTokenCookie(tokenkey, newpassword);
            default:
                console.error('unknown action:', argv);
                return Promise.reject('unknown action');
        }
    };
    ConfigInitializerCommand.prototype.setTokenCookie = function (tokenkey, newpassword) {
        if (tokenkey === undefined || tokenkey.length < 8) {
            return Promise.reject('valid tokenkey required');
        }
        if (newpassword === undefined || newpassword.length < 8) {
            return Promise.reject('valid newpassword required');
        }
        var me = this;
        var promises = [];
        promises.push(function () {
            return config_initializer_util_1.ConfigInitializerUtil.replaceTokenCookieInFirewallConfig(me.configbasepath + '/firewall.beta.json', tokenkey, newpassword, false);
        });
        promises.push(function () {
            return config_initializer_util_1.ConfigInitializerUtil.replaceTokenCookieInFirewallConfig(me.configbasepath + '/firewall.dev.json', tokenkey, newpassword, false);
        });
        promises.push(function () {
            return config_initializer_util_1.ConfigInitializerUtil.replaceTokenCookieInFirewallConfig(me.configbasepath + '/firewall.prod.json', tokenkey, newpassword, false);
        });
        return Promise_serial(promises, { parallelize: 1 }).then(function () {
            return Promise.resolve('DONE - setTokenCookie');
        }).catch(function (reason) {
            return Promise.reject(reason);
        });
    };
    return ConfigInitializerCommand;
}(common_admin_command_1.CommonAdminCommand));
exports.ConfigInitializerCommand = ConfigInitializerCommand;
//# sourceMappingURL=config-initializer.command.js.map