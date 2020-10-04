"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IPCIDR = require('ip-cidr');
var FirewallCommons = /** @class */ (function () {
    function FirewallCommons() {
    }
    FirewallCommons.resolveBlocked = function (req, res, firewallConfig, filePathErrorDocs) {
        for (var key in firewallConfig.routerErrorsConfigs) {
            var errorConfig = firewallConfig.routerErrorsConfigs[key];
            if (req.url.toString().match(errorConfig.pattern)) {
                res.status(200);
                res.sendFile(errorConfig.file, { root: filePathErrorDocs });
                return;
            }
        }
        res.status(401);
        res.render('error', {
            message: 'You shall not pass'
        });
    };
    FirewallCommons.prepareIpV4IP = function (ipOfSource) {
        if (ipOfSource.startsWith('::ffff:')) {
            return ipOfSource.replace(/^::ffff:/, '');
        }
        return ipOfSource;
    };
    FirewallCommons.isLocalhostIp = function (ipOfSource) {
        var ipV4 = FirewallCommons.prepareIpV4IP(ipOfSource);
        // https://en.wikipedia.org/wiki/Localhost
        // 127.0.0.0/8
        // 127.0.0.1    localhost
        // ::1          localhost
        if (ipV4 === '127.0.0.1' || ipV4 === 'localhost' || ipV4 === '::1') {
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
    };
    FirewallCommons.isLocalnetIp = function (ipOfSource) {
        var ipV4 = FirewallCommons.prepareIpV4IP(ipOfSource);
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
    };
    FirewallCommons.countIpList = function (list) {
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
    };
    FirewallCommons.isInList = function (list, ipOfSource) {
        var ipV4 = FirewallCommons.prepareIpV4IP(ipOfSource);
        if (Array.isArray(list)) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var ip = list_1[_i];
                if (ip === ipOfSource || ip === ipV4) {
                    return true;
                }
            }
        }
        else {
            if (list[ipOfSource]) {
                return true;
            }
            if (list[ipV4]) {
                return true;
            }
        }
        // TODO check for list and cidr...
        return false;
    };
    FirewallCommons.localHostOnly127CIDR = new IPCIDR('127.0.0.0/8');
    FirewallCommons.localHostOnly169CIDR = new IPCIDR('169.254.0.0/16');
    FirewallCommons.localHostOnlyFe80CIDR = new IPCIDR('fe80::/10');
    FirewallCommons.localNetOnly10CIDR = new IPCIDR('10.0.0.0/8');
    FirewallCommons.localNetOnly172CIDR = new IPCIDR('172.16.0.0/12');
    FirewallCommons.localNetOnly192CIDR = new IPCIDR('192.168.0.0/16');
    FirewallCommons.localNetOnlyFd00CIDR = new IPCIDR('fd00::/8');
    return FirewallCommons;
}());
exports.FirewallCommons = FirewallCommons;
//# sourceMappingURL=firewall.commons.js.map