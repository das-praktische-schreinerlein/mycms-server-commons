import * as express from 'express';
import {FirewallCommons, FirewallConfig} from './firewall.commons';
import {ServerLogUtils} from './serverlog.utils';
import * as cookieParser from 'cookie-parser';

const IpFilter = require('express-ipfilter').IpFilter;
const IpDeniedError = require('express-ipfilter').IpDeniedError;

export class FirewallModule {
    public static configureFirewall(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        if (firewallConfig.allowLocalHostOnly) {
            this.configureLocalHostOnly(app, firewallConfig, filePathErrorDocs);
        } else if (firewallConfig.allowLocalNetOnly) {
            this.configureLocalNetOnly(app, firewallConfig, filePathErrorDocs);
        } else {
            console.log('CONFIGURE access-restriction: NONE');
        }

        if (FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0) {
            this.configureIPWhitelist(app, firewallConfig, filePathErrorDocs);
        }
        if (FirewallCommons.countIpList(firewallConfig.blackListIps) > 0) {
            this.configureIPBlacklist(app, firewallConfig, filePathErrorDocs);
        }

        if (firewallConfig.allowTokenCookieOnly) {
            this.configureCookieOnly(app, firewallConfig, filePathErrorDocs);
        }
    }

    public static configureLocalHostOnly(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        console.log('CONFIGURE access-restriction: LOCALHOST-only' +
            (FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0
                ? ' with IP-Whitelist: ' + FirewallCommons.countIpList(firewallConfig.whiteListIps)
                : '') +
            (FirewallCommons.countIpList(firewallConfig.blackListIps) > 0
                ? ' with IP-Blacklist: ' + FirewallCommons.countIpList(firewallConfig.blackListIps)
                : '')
        );
        app.use(function(req, res, next) {
            const ipOfSource = req.connection.remoteAddress;
            if (FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0 &&
                FirewallCommons.isInList(firewallConfig.whiteListIps, ipOfSource)) {
                return next();
            }

            if (FirewallCommons.countIpList(firewallConfig.blackListIps) > 0 &&
                FirewallCommons.isInList(firewallConfig.blackListIps, ipOfSource)) {
                const err = new IpDeniedError('Only localhost allowed but IP in blacklist - ' +
                    'Access denied to IP address: ' + ipOfSource);
                return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
            }

            if (FirewallCommons.isLocalhostIp(ipOfSource)) {
                return next();
            }

            const err = new IpDeniedError('Only localhost allowed - Access denied to IP address: ' + ipOfSource);
            return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
        })
    }

    public static configureLocalNetOnly(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        console.log('CONFIGURE access-restriction: LOCALNET-only' +
            (FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0
                ? ' with IP-Whitelist: ' + FirewallCommons.countIpList(firewallConfig.whiteListIps)
                : '') +
            (FirewallCommons.countIpList(firewallConfig.blackListIps) > 0
                ? ' with IP-Blacklist: ' + FirewallCommons.countIpList(firewallConfig.blackListIps)
                : '')
        );
        app.use(function(req, res, next) {
            const ipOfSource = req.connection.remoteAddress;
            if (FirewallCommons.countIpList(firewallConfig.whiteListIps) > 0 &&
                FirewallCommons.isInList(firewallConfig.whiteListIps, ipOfSource)) {
                return next();
            }

            if (FirewallCommons.countIpList(firewallConfig.blackListIps) > 0 &&
                FirewallCommons.isInList(firewallConfig.blackListIps, ipOfSource)) {
                const err = new IpDeniedError('Only localnet allowed but IP in blacklist - ' +
                    'Access denied to IP address: ' + ipOfSource);
                return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
            }

            if (FirewallCommons.isLocalhostIp(ipOfSource) || FirewallCommons.isLocalnetIp(ipOfSource)) {
                return next();
            }

            const err = new IpDeniedError('Only localnet allowed - Access denied to IP address: ' + ipOfSource);
            return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
        })
    }

    public static configureIPWhitelist(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        console.log('CONFIGURE access-restriction IP-whitelist with '
            + FirewallCommons.countIpList(firewallConfig.whiteListIps) + ' ips');
        app.use(function(req, res, next) {
            const ipOfSource = req.connection.remoteAddress;
            if (FirewallCommons.isInList(firewallConfig.whiteListIps, ipOfSource)) {
                return next();
            }

            const err = new IpDeniedError('Only white allowed - Access denied to IP address: ' + ipOfSource);
            return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
        })
    }

    public static configureIPBlacklist(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        console.log('CONFIGURE access-restriction IP-blacklist with ' +
            FirewallCommons.countIpList(firewallConfig.blackListIps) + ' ips');
        app.use(IpFilter(firewallConfig.blackListIps));
        app.use(function(err, req, res, _next) {
            FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, _next);
        });
    }

    public static configureCookieOnly(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        console.log('CONFIGURE additional access-restriction: TOKENCOOKIE only: ' + Object.keys(firewallConfig.allowTokenCookieOnly));
        app.use(cookieParser());
        app.use(function(req, res, next) {
            const cookies = req.cookies;
            const ipOfSource = req.connection.remoteAddress;
            if (cookies) {
                for (const cookieName in firewallConfig.allowTokenCookieOnly) {
                    if (cookies[cookieName] &&
                        firewallConfig.allowTokenCookieOnly[cookieName].includes(cookies[cookieName])) {
                        return next();
                    }
                }
            }

            const err = new IpDeniedError('Only requests with tokenCookie: "' + Object.keys(firewallConfig.allowTokenCookieOnly) + '"' +
                ' are allowed - Access denied to IP address: ' + ipOfSource, undefined);
            return FirewallModule.renderError(firewallConfig, filePathErrorDocs, err, req, res, next);
        })
    }

    public static renderError(firewallConfig: FirewallConfig, filePathErrorDocs: string, err, req, res, _next) {
        if (err instanceof IpDeniedError) {
            console.warn('FirewallModule: BLOCKED blacklisted IP:' + ServerLogUtils.sanitizeLogMsg(req['clientIp']) +
                ' URL:' + ServerLogUtils.sanitizeLogMsg(req.url) +
                ' ERR:' + err.message);
            return FirewallCommons.resolveBlocked(req, res, firewallConfig, filePathErrorDocs);
        }
        console.warn('request blocked', err);

        res.status(err.status || 500);
        res.render('error', {
            message: 'You shall not pass'
        });

    }

}
