"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    return FirewallCommons;
}());
exports.FirewallCommons = FirewallCommons;
//# sourceMappingURL=firewall.commons.js.map