"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ServerLogUtils = /** @class */ (function () {
    function ServerLogUtils() {
    }
    ServerLogUtils.sanitizeLogMsg = function (msg) {
        if (msg === undefined) {
            return undefined;
        }
        return (msg + '').replace(/[^-A-Za-z0-9äöüßÄÖÜ/+;,:._*]*/gi, '');
    };
    return ServerLogUtils;
}());
exports.ServerLogUtils = ServerLogUtils;
//# sourceMappingURL=serverlog.utils.js.map