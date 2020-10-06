export interface FirewallConfig {
    routerErrorsConfigs: {
        pattern: string;
        file: string;
    };
    blackListIps?: {};
    whiteListIps?: {};
    allowLocalHostOnly?: boolean;
    allowLocalNetOnly?: boolean;
    allowTokenCookieOnly?: {
        [key: string]: [string];
    };
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
    static readonly localHostOnly127CIDR: any;
    static readonly localHostOnly169CIDR: any;
    static readonly localHostOnlyFe80CIDR: any;
    static readonly localNetOnly10CIDR: any;
    static readonly localNetOnly172CIDR: any;
    static readonly localNetOnly192CIDR: any;
    static readonly localNetOnlyFd00CIDR: any;
    static resolveBlocked(req: any, res: any, firewallConfig: FirewallConfig, filePathErrorDocs: string): void;
    static prepareIpV4IP(ipOfSource: string): string;
    static isLocalhostIp(ipOfSource: string): boolean;
    static isLocalnetIp(ipOfSource: string): boolean;
    static countIpList(list: any): number;
    static isInList(list: {}, ipOfSource: string): boolean;
}
