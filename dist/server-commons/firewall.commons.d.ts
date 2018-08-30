export interface FirewallConfig {
    routerErrorsConfigs: {
        pattern: string;
        file: string;
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
export declare class FirewallCommons {
    static resolveBlocked(req: any, res: any, firewallConfig: FirewallConfig, filePathErrorDocs: string): void;
}
