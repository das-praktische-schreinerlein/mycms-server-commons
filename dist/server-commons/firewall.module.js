"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var firewall_commons_1 = require("./firewall.commons");
var serverlog_utils_1 = require("./serverlog.utils");
var IpFilter = require('express-ipfilter').IpFilter;
var IpDeniedError = require('express-ipfilter').IpDeniedError;
var FirewallModule = /** @class */ (function () {
    function FirewallModule() {
    }
    FirewallModule.configureFirewall = function (app, firewallConfig, filePathErrorDocs) {
        app.use(IpFilter(firewallConfig.blackListIps));
        app.use(function (err, req, res, _next) {
            if (err instanceof IpDeniedError) {
                console.warn('FirewallModule: BLOCKED blacklisted IP:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(req['clientIp']) +
                    ' URL:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(req.url));
                return firewall_commons_1.FirewallCommons.resolveBlocked(req, res, firewallConfig, filePathErrorDocs);
            }
            console.warn('request blocked', err);
            res.status(err.status || 500);
            res.render('error', {
                message: 'You shall not pass'
            });
        });
    };
    return FirewallModule;
}());
exports.FirewallModule = FirewallModule;
//# sourceMappingURL=firewall.module.js.map