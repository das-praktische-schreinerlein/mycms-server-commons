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
Object.defineProperty(exports, "__esModule", { value: true });
var common_admin_command_1 = require("./common-admin.command");
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var DBMigrate = require('db-migrate');
var DbMigrateCommand = /** @class */ (function (_super) {
    __extends(DbMigrateCommand, _super);
    function DbMigrateCommand() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DbMigrateCommand.prototype.createValidationRules = function () {
        return {
            migrationDbConfigFile: new common_admin_command_1.SimpleConfigFilePathValidationRule(true),
            migrationsDir: new common_admin_command_1.SimpleFilePathValidationRule(true),
            migrationEnv: new generic_validator_util_1.NameValidationRule(true)
        };
    };
    DbMigrateCommand.prototype.definePossibleActions = function () {
        return ['migrateDB'];
    };
    DbMigrateCommand.prototype.processCommandArgs = function (argv) {
        var migrationDbConfigFile = argv['migrationDbConfigFile'];
        if (migrationDbConfigFile === undefined) {
            return Promise.reject('ERROR - parameters required migrationDbConfigFile: "--migrationDbConfigFile"');
        }
        var migrationsDir = argv['migrationsDir'];
        if (migrationsDir === undefined) {
            return Promise.reject('ERROR - parameters required migrationsDir: "--migrationsDir"');
        }
        var migrationEnv = argv['migrationEnv'];
        if (migrationEnv === undefined) {
            return Promise.reject('ERROR - parameters required migrationEnv: "--migrationEnv"');
        }
        var options = {
            config: migrationDbConfigFile,
            cmdOptions: {
                'migrations-dir': migrationsDir
            },
            env: migrationEnv,
            throwUncatched: true
        };
        var dbMigrate = DBMigrate.getInstance(true, options);
        return dbMigrate.up();
    };
    return DbMigrateCommand;
}(common_admin_command_1.CommonAdminCommand));
exports.DbMigrateCommand = DbMigrateCommand;
//# sourceMappingURL=dbmigrate.command.js.map