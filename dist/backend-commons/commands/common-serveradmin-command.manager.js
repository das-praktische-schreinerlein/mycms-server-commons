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
var common_admin_command_manager_1 = require("./common-admin-command.manager");
var CommonServerAdminCommandManager = /** @class */ (function (_super) {
    __extends(CommonServerAdminCommandManager, _super);
    function CommonServerAdminCommandManager(commands, adminCommandConfig, restrictedCommandActions) {
        var _this = _super.call(this, commands, adminCommandConfig) || this;
        _this.adminCommandConfig.availableCommands = {};
        _this.restrictedCommandActions = restrictedCommandActions;
        return _this;
    }
    CommonServerAdminCommandManager.prototype.initializeCommand = function (argv) {
        var _this = this;
        return _super.prototype.initializeCommand.call(this, argv).then(function (command) {
            var requestedAction = argv['action'];
            if (requestedAction !== undefined
                && !(_this.restrictedCommandActions.length === 1 && _this.restrictedCommandActions[0] === '*')
                && !_this.restrictedCommandActions.includes(requestedAction)) {
                return Promise.reject('action not allowed on adminserver');
            }
            return Promise.resolve(command);
        });
    };
    return CommonServerAdminCommandManager;
}(common_admin_command_manager_1.CommonAdminCommandManager));
exports.CommonServerAdminCommandManager = CommonServerAdminCommandManager;
//# sourceMappingURL=common-serveradmin-command.manager.js.map