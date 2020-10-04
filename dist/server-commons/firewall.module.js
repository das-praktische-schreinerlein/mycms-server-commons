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
        if (firewallConfig.allowLocalHostOnly) {
            this.configureLocalHostOnly(app, firewallConfig, filePathErrorDocs);
        }
        else if (firewallConfig.allowLocalNetOnly) {
            this.configureLocalNetOnly(app, firewallConfig, filePathErrorDocs);
        }
        if (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0) {
            this.configureIPWhitelist(app, firewallConfig, filePathErrorDocs);
        }
        if (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.blackListIps) > 0) {
            this.configureIPBlacklist(app, firewallConfig, filePathErrorDocs);
        }
    };
    FirewallModule.configureLocalHostOnly = function (app, firewallConfig, filePathErrorDocs) {
        console.log('CONFIGURE access-restriction: LOCALHOST-only' +
            (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0
                ? ' with IP-Whitelist: ' + firewall_commons_1.FirewallCommons.countIpList(firewallConfig.whiteListIps)
                : '') +
            (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.blackListIps) > 0
                ? ' with IP-Blacklist: ' + firewall_commons_1.FirewallCommons.countIpList(firewallConfig.blackListIps)
                : ''));
        app.use(function (req, res, next) {
            var ipOfSource = req.connection.remoteAddress;
            if (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0 &&
                firewall_commons_1.FirewallCommons.isInList(firewallConfig.whiteListIps, ipOfSource)) {
                return next();
            }
            if (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.blackListIps) > 0 &&
                firewall_commons_1.FirewallCommons.isInList(firewallConfig.blackListIps, ipOfSource)) {
                var err_1 = new IpDeniedError('Only localhost allowed but IP in blacklist - ' +
                    'Access denied to IP address: ' + ipOfSource);
                return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err_1, req, res, next);
            }
            if (firewall_commons_1.FirewallCommons.isLocalhostIp(ipOfSource)) {
                return next();
            }
            var err = new IpDeniedError('Only localhost allowed - Access denied to IP address: ' + ipOfSource);
            return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
        });
    };
    FirewallModule.configureLocalNetOnly = function (app, firewallConfig, filePathErrorDocs) {
        console.log('CONFIGURE access-restriction: LOCALNET-only' +
            (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0
                ? ' with IP-Whitelist: ' + firewall_commons_1.FirewallCommons.countIpList(firewallConfig.whiteListIps)
                : '') +
            (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.blackListIps) > 0
                ? ' with IP-Blacklist: ' + firewall_commons_1.FirewallCommons.countIpList(firewallConfig.blackListIps)
                : ''));
        app.use(function (req, res, next) {
            var ipOfSource = req.connection.remoteAddress;
            if (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0 &&
                firewall_commons_1.FirewallCommons.isInList(firewallConfig.whiteListIps, ipOfSource)) {
                return next();
            }
            if (firewall_commons_1.FirewallCommons.countIpList(firewallConfig.blackListIps) > 0 &&
                firewall_commons_1.FirewallCommons.isInList(firewallConfig.blackListIps, ipOfSource)) {
                var err_2 = new IpDeniedError('Only localnet allowed but IP in blacklist - ' +
                    'Access denied to IP address: ' + ipOfSource);
                return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err_2, req, res, next);
            }
            if (firewall_commons_1.FirewallCommons.isLocalhostIp(ipOfSource) || firewall_commons_1.FirewallCommons.isLocalnetIp(ipOfSource)) {
                return next();
            }
            var err = new IpDeniedError('Only localnet allowed - Access denied to IP address: ' + ipOfSource);
            return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
        });
    };
    FirewallModule.configureIPWhitelist = function (app, firewallConfig, filePathErrorDocs) {
        console.log('CONFIGURE access-restriction IP-whitelist with '
            + firewall_commons_1.FirewallCommons.countIpList(firewallConfig.whiteListIps) + ' ips');
        app.use(function (req, res, next) {
            var ipOfSource = req.connection.remoteAddress;
            if (firewall_commons_1.FirewallCommons.isInList(firewallConfig.whiteListIps, ipOfSource)) {
                return next();
            }
            var err = new IpDeniedError('Only white allowed - Access denied to IP address: ' + ipOfSource);
            return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
        });
    };
    FirewallModule.configureIPBlacklist = function (app, firewallConfig, filePathErrorDocs) {
        console.log('CONFIGURE access-restriction IP-blacklist with ' +
            firewall_commons_1.FirewallCommons.countIpList(firewallConfig.blackListIps) + ' ips');
        app.use(IpFilter(firewallConfig.blackListIps));
        app.use(function (err, req, res, _next) {
            FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, _next);
        });
    };
    FirewallModule.renderError = function (firewallConfig, filePathErrorDocs, err, req, res, _next) {
        if (err instanceof IpDeniedError) {
            console.warn('FirewallModule: BLOCKED blacklisted IP:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(req['clientIp']) +
                ' URL:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(req.url) +
                ' ERR:' + err.message);
            return firewall_commons_1.FirewallCommons.resolveBlocked(req, res, firewallConfig, filePathErrorDocs);
        }
        console.warn('request blocked', err);
        res.status(err.status || 500);
        res.render('error', {
            message: 'You shall not pass'
        });
    };
    return FirewallModule;
}());
exports.FirewallModule = FirewallModule;
//# sourceMappingURL=firewall.module.js.map