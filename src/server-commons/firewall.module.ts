import * as express from 'express';
import {FirewallCommons, FirewallConfig} from './firewall.commons';
import {ServerLogUtils} from './serverlog.utils';

const IpFilter = require('express-ipfilter').IpFilter;
const IpDeniedError = require('express-ipfilter').IpDeniedError;

export class FirewallModule {
    public static configureFirewall(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        this.configureIPBlacklist(app, firewallConfig, filePathErrorDocs);
    }

    public static configureLocalHostOnly(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        // TODO use localhotOnly
    }

    public static configureLocalNetOnly(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        // TODO use use localnetonly
    }

    public static configureIPWhitelist(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        // TODO use ip-whitelist
    }

    public static configureIPBlacklist(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        // use ip-blacklist
        app.use(IpFilter(firewallConfig.blackListIps));
        app.use(function(err, req, res, _next) {
            if (err instanceof IpDeniedError) {
                console.warn('FirewallModule: BLOCKED blacklisted IP:' + ServerLogUtils.sanitizeLogMsg(req['clientIp']) +
                    ' URL:' + ServerLogUtils.sanitizeLogMsg(req.url));
                return FirewallCommons.resolveBlocked(req, res, firewallConfig, filePathErrorDocs);
            }
            console.warn('request blocked', err);

            res.status(err.status || 500);
            res.render('error', {
                message: 'You shall not pass'
            });
        });
    }
}
