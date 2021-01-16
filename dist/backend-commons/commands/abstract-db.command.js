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
var database_service_1 = require("@dps/mycms-commons/dist/commons/services/database.service");
var knex = require("knex");
var sql_query_builder_1 = require("@dps/mycms-commons/dist/search-commons/services/sql-query.builder");
var common_admin_command_1 = require("./common-admin.command");
var AbstractDbCommand = /** @class */ (function (_super) {
    __extends(AbstractDbCommand, _super);
    function AbstractDbCommand() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbstractDbCommand.prototype.processCommandArgs = function (argv) {
        var _this = this;
        var functionFiles = [];
        var sqlFiles = [];
        return this.configureDbCommandOptions(argv).then(function (dbCommandOptions) {
            return _this.configureProcessingFiles(dbCommandOptions, functionFiles, sqlFiles);
        }).then(function (dbCommandOptions) {
            var knexOpts = {
                client: dbCommandOptions.knexConfig['client'],
                connection: dbCommandOptions.knexConfig['connection']
            };
            var sqls = [];
            for (var _i = 0, functionFiles_1 = functionFiles; _i < functionFiles_1.length; _i++) {
                var file = functionFiles_1[_i];
                sqls = sqls.concat(database_service_1.DatabaseService.extractSqlFileOnScriptPath(file, '$$'));
            }
            for (var _a = 0, sqlFiles_1 = sqlFiles; _a < sqlFiles_1.length; _a++) {
                var file = sqlFiles_1[_a];
                sqls = sqls.concat(database_service_1.DatabaseService.extractSqlFileOnScriptPath(file, ';'));
            }
            var databaseService = new database_service_1.DatabaseService(knex(knexOpts), new sql_query_builder_1.SqlQueryBuilder());
            console.log('dbCommand - executing sqls', dbCommandOptions.basePath, sqls.length, sqlFiles);
            return databaseService.executeSqls(sqls);
        });
    };
    return AbstractDbCommand;
}(common_admin_command_1.CommonAdminCommand));
exports.AbstractDbCommand = AbstractDbCommand;
//# sourceMappingURL=abstract-db.command.js.map