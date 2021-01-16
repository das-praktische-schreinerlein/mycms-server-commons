"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var admin_response_1 = require("@dps/mycms-commons/dist/commons/model/admin-response");
var AdminServerModule = /** @class */ (function () {
    function AdminServerModule() {
    }
    AdminServerModule.configureRoutes = function (app, apiPrefix, adminCommandManager) {
        console.log('configure route ', apiPrefix + '/:locale');
        app.route(apiPrefix + '/:locale' + '/' + 'status')
            .all(function (req, res, next) {
            if (req.method !== 'POST') {
                return next('not allowed');
            }
            return next();
        })
            .post(function (req, res, next) {
            AdminServerModule.createResponseObj(adminCommandManager, admin_response_1.CommonAdminResponseResultState.DONE, 'state done').then(function (response) {
                res.json(response);
                return next();
            });
        });
        app.route(apiPrefix + '/:locale' + '/' + 'execCommand')
            .all(function (req, res, next) {
            if (req.method !== 'POST') {
                return next('not allowed');
            }
            return next();
        })
            .post(function (req, res, next) {
            var commandSrc = req['body'];
            if (commandSrc === undefined) {
                console.log('adminequest failed: no requestbody');
                res.status(403);
                res.json();
                return next('not found');
            }
            var argv = typeof commandSrc === 'string'
                ? JSON.parse(commandSrc).execommand
                : commandSrc;
            adminCommandManager.startCommand(argv).then(function (value) {
                console.log('DONE - adminrequest finished:', value, argv);
                AdminServerModule.createResponseObj(adminCommandManager, admin_response_1.CommonAdminResponseResultState.DONE, 'stat adminrequest done').then(function (response) {
                    res.json(response);
                    return next();
                });
            }).catch(function (reason) {
                console.error('ERROR - adminrequest failed:', reason, argv);
                AdminServerModule.createResponseObj(adminCommandManager, admin_response_1.CommonAdminResponseResultState.ERROR, 'start adminrequest failed:' + reason).then(function (response) {
                    res.json(response);
                    return next();
                });
            });
        });
    };
    AdminServerModule.createResponseObj = function (adminCommandManager, resultState, resultMsg) {
        var preparedCommands = adminCommandManager.listPreparedCommands();
        return adminCommandManager.listCommandStatus().then(function (value) {
            return Promise.resolve({
                resultMsg: resultMsg,
                resultState: resultState,
                resultDate: new Date(),
                preparedCommands: preparedCommands,
                commandsStates: value
            });
        }).catch(function (reason) {
            console.error('ERROR - adminrequest createResponseObj failed:', reason);
            return Promise.resolve({
                resultMsg: resultMsg,
                resultState: resultState,
                resultDate: new Date(),
                preparedCommands: preparedCommands,
                commandsStates: {}
            });
        });
    };
    return AdminServerModule;
}());
exports.AdminServerModule = AdminServerModule;
//# sourceMappingURL=common-admin-server.module.js.map