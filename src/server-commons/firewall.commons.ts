const IPCIDR = require('ip-cidr');

export interface FirewallConfig {
    routerErrorsConfigs: {
        pattern: string,
        file: string
    };
    blackListIps?: {};
    whiteListIps?: {};
    allowLocalHostOnly?: boolean;
    allowLocalNetOnly?: boolean;
    allowTokenCookieOnly?: {
        [key: string]: [string];
    }
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
    public static readonly localHostOnly127CIDR = new IPCIDR('127.0.0.0/8');
    public static readonly localHostOnly169CIDR = new IPCIDR('169.254.0.0/16');
    public static readonly localHostOnlyFe80CIDR = new IPCIDR('fe80::/10');
    public static readonly localNetOnly10CIDR = new IPCIDR('10.0.0.0/8');
    public static readonly localNetOnly172CIDR = new IPCIDR('172.16.0.0/12');
    public static readonly localNetOnly192CIDR = new IPCIDR('192.168.0.0/16');
    public static readonly localNetOnlyFd00CIDR = new IPCIDR('fd00::/8');

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

    public static prepareIpV4IP(ipOfSource: string): string {
        if (ipOfSource.startsWith('::ffff:')) {
            return ipOfSource.replace(/^::ffff:/, '');
        }

        return ipOfSource;
    }

    public static isLocalhostIp(ipOfSource: string): boolean {
        const ipV4 = FirewallCommons.prepareIpV4IP(ipOfSource);

        // https://en.wikipedia.org/wiki/Localhost
        // 127.0.0.0/8
        // 127.0.0.1    localhost
        // ::1          localhost
        if (ipV4 === '127.0.0.1' || ipV4 === 'localhost'|| ipV4 === '::1') {
            return true;
        }
        if (FirewallCommons.localHostOnly127CIDR.contains(ipV4)) {
            return true;
        }

        // https://en.wikipedia.org/wiki/Link-local_address
        // 169.254.0.0/16 (169.254.0.0 – 169.254.255.255)
        // fe80::/10
        if (ipV4.match(/^169\.254\.\D{1,3}\.\D{1,3}$/)) {
            return true;
        }
        if (FirewallCommons.localHostOnly169CIDR.contains(ipV4)) {
            return true;
        }
        if (FirewallCommons.localHostOnlyFe80CIDR.contains(ipOfSource)) {
            return true;
        }

        return false;
    }

    public static isLocalnetIp(ipOfSource: string): boolean {
        const ipV4 = FirewallCommons.prepareIpV4IP(ipOfSource);

        // https://en.wikipedia.org/wiki/Private_network
        // RFC1918 name 	IP address range 	Number of addresses 	Largest CIDR block (subnet mask) 	Host ID size 	Mask bits 	Classful description[Note 1]
        // 24-bit block 	10.0.0.0 – 10.255.255.255 	16777216 	10.0.0.0/8 (255.0.0.0) 	24 bits 	8 bits 	single class A network
        // 20-bit block 	172.16.0.0 – 172.31.255.255 	1048576 	172.16.0.0/12 (255.240.0.0) 	20 bits 	12 bits 	16 contiguous class B networks
        // 16-bit block 	192.168.0.0 – 192.168.255.255 	65536 	192.168.0.0/16 (255.255.0.0) 	16 bits 	16 bits 	256 contiguous class C networks
        if (ipV4.match(/^10\.\D{1,3}\.\D{1,3}\.\D{1,3}$/)) {
            return true;
        }
        if (ipV4.match(/^172\.16\.\D{1,3}\.\D{1,3}$/)) { // TODO all others
            return true;
        }
        if (ipV4.match(/^192\.168\.\D{1,3}\.\D{1,3}$/)) {
            return true;
        }
        if (FirewallCommons.localNetOnly10CIDR.contains(ipV4)) {
            return true;
        }
        if (FirewallCommons.localNetOnly172CIDR.contains(ipV4)) {
            return true;
        }
        if (FirewallCommons.localNetOnly192CIDR.contains(ipV4)) {
            return true;
        }

        // RFC 4193 Block 	Prefix/L 	Global ID (random) 	Subnet ID 	Number of addresses in subnet
        // 	48 bits 	16 bits 	64 bits
        // fd00::/8 	fd 	xx:xxxx:xxxx 	yyyy 	18446744073709551616
        if (FirewallCommons.localNetOnlyFd00CIDR.contains(ipOfSource)) {
            return true;
        }

        return false;
    }

    public static countIpList(list: any): number {
        if (list === undefined || list === null) {
            return 0;
        }

        if (Array.isArray(list) && list.length > 0) {
            return list.length;
        }

        if (Object.keys(list).length > 0) {
            return Object.keys(list).length;
        }

        return 0;

    }
    public static isInList(list: {}, ipOfSource: string): boolean {
        const ipV4 = FirewallCommons.prepareIpV4IP(ipOfSource);

        if (Array.isArray(list)) {
            if (list.includes(ipOfSource) || list.includes(ipV4)) {
                return true;
            }
        } else {
            if (list[ipOfSource]) {
                return true;
            }
            if (list[ipV4]) {
                return true;
            }
        }
        // TODO check for list and cidr...

        return false;
    }
}
