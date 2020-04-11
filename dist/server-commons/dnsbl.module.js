"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var honeypot = require("honeypot");
var generic_dnsbl_module_1 = require("./generic-dnsbl.module");
var datacache_module_1 = require("./datacache.module");
var serverlog_utils_1 = require("./serverlog.utils");
var DnsBLModule = /** @class */ (function (_super) {
    __extends(DnsBLModule, _super);
    function DnsBLModule(app, firewallConfig, config, filePathErrorDocs, cache) {
        var _this = _super.call(this, app, firewallConfig, firewallConfig.dnsBLConfig, filePathErrorDocs, cache) || this;
        _this.app = app;
        _this.firewallConfig = firewallConfig;
        _this.config = config;
        _this.filePathErrorDocs = filePathErrorDocs;
        _this.cache = cache;
        _this.maxThreatScore = 20;
        if (firewallConfig.dnsBLConfig.maxThreatScore) {
            _this.maxThreatScore = firewallConfig.dnsBLConfig.maxThreatScore;
        }
        return _this;
    }
    DnsBLModule.configureDnsBL = function (app, firewallConfig, filePathErrorDocs) {
        if (!firewallConfig || !firewallConfig.dnsBLConfig || !firewallConfig.dnsBLConfig.apiKey) {
            console.error('cant configure DnsBLModule because API-Key required!');
            return;
        }
        var cache = new datacache_module_1.DataCacheModule(firewallConfig.dnsBLConfig);
        return new DnsBLModule(app, firewallConfig, firewallConfig.dnsBLConfig, filePathErrorDocs, cache);
    };
    DnsBLModule.prototype.configureDnsBLClient = function () {
        this.pot = new honeypot(this.config.apiKey);
    };
    DnsBLModule.prototype.callDnsBLClient = function (query) {
        var _this = this;
        var me = this;
        return new Promise(function (resolve, reject) {
            query.timeoutTimer = setTimeout(function () {
                me.checkResultOfDnsBLClient(query, 'timeout after ' + me.config.timeout, false, 'timeout after ' + me.config.timeout).then(function (value) {
                    return resolve(value);
                });
            }, me.config.timeout);
            console.log('DnsBLModule: call DnsBL for IP:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(query.ip) +
                ' URL:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(query.req.url));
            _this.pot.query(query.ip, function (potErr, potRes) {
                var blocked = false;
                if (potRes) {
                    var potResData = potRes.toString().split('.').map(Number);
                    if (potResData.length === 4) {
                        if (potResData[3] !== 0 || potResData[2] > me.maxThreatScore) {
                            console.warn('DnsBLModule: blocked ' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(query.ip) +
                                ' potResult because of score>' + me.maxThreatScore, potRes);
                            blocked = true;
                        }
                        else {
                            console.log('DnsBLModule: not blocked  ' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(query.ip) + ' potResult:', potRes);
                        }
                    }
                    else {
                        console.warn('DnsBLModule: not blocked  ' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(query.ip) + ' illegal potResult:', potRes);
                    }
                }
                else {
                    console.log('DnsBLModule: not blocked  ' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(query.ip) + ' no potResult:', potRes);
                }
                me.checkResultOfDnsBLClient(query, potErr, blocked, potRes).then(function (value) {
                    return resolve(value);
                });
            });
        });
    };
    return DnsBLModule;
}(generic_dnsbl_module_1.GenericDnsBLModule));
exports.DnsBLModule = DnsBLModule;
//# sourceMappingURL=dnsbl.module.js.map