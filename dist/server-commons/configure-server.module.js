"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var body_parser_1 = require("body-parser");
var cors = require('cors');
var helmet = require('helmet');
var compression = require('compression');
var protect = require('@risingstack/protect');
var requestIp = require('request-ip');
var ConfigureServerModule = /** @class */ (function () {
    function ConfigureServerModule() {
    }
    ConfigureServerModule.configureServer = function (app, backendConfig) {
        // configure parsing
        app.use(body_parser_1.json({ limit: '1mb' })); // for parsing application/json
        app.use(body_parser_1.urlencoded({ extended: true, limit: '1mb' })); // for parsing application/x-www-form-urlencoded
        // secure server
        var mycors = cors({
            origin: backendConfig['corsOrigin'],
            optionsSuccessStatus: 200,
            credentials: true
        });
        app.use(mycors);
        app.use(helmet());
        // configure response
        app.use(compression());
        // require request-ip and register it as middleware
        app.use(requestIp.mw());
    };
    ConfigureServerModule.configureServerAddHysteric = function (app, backendConfig) {
        app.use(protect.express.sqlInjection({
            body: true,
            loggerFunction: console.warn
        }));
        app.use(protect.express.xss({
            body: true,
            loggerFunction: console.warn
        }));
    };
    ConfigureServerModule.configureDefaultErrorHandler = function (app) {
        app.use(function (err, req, res, next) {
            console.error(err);
            res.status(500);
            res.send('UiUiUi an error :-(');
        });
    };
    return ConfigureServerModule;
}());
exports.ConfigureServerModule = ConfigureServerModule;
//# sourceMappingURL=configure-server.module.js.map