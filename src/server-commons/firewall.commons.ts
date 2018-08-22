export interface FirewallConfig {
    routerErrorsConfigs: {
        pattern: string,
        file: string
    };
    blackListIps: {};
    dnsBLConfig: DnsBLConfig;
}

export interface DnsBLConfig {
    dnsttl: number;
    errttl: number;
    timeout: number;
    apiKey: string;
    whitelistIps: string[];
    cacheRedisUrl: string;
    cacheRedisPass: string;
    cacheRedisDB: string;
    maxThreatScore?: number;
}

export class FirewallCommons {
    public static resolveBlocked(req, res, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
        for (const key in firewallConfig.routerErrorsConfigs) {
            const errorConfig = firewallConfig.routerErrorsConfigs[key];
            if (req.url.toString().match(errorConfig.pattern)) {
                res.status(200);
                res.sendFile(errorConfig.file, {root: filePathErrorDocs});

                return;
            }
        }

        res.status(401);
        res.render('error', {
            message: 'You shall not pass'
        });
    }
}
