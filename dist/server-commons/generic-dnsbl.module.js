"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var firewall_commons_1 = require("./firewall.commons");
var isIP = require("validator/lib/isIP");
var serverlog_utils_1 = require("./serverlog.utils");
var DnsBLCacheEntryState;
(function (DnsBLCacheEntryState) {
    DnsBLCacheEntryState[DnsBLCacheEntryState["OK"] = 0] = "OK";
    DnsBLCacheEntryState[DnsBLCacheEntryState["BLOCKED"] = 1] = "BLOCKED";
    DnsBLCacheEntryState[DnsBLCacheEntryState["NORESULT"] = 2] = "NORESULT";
})(DnsBLCacheEntryState = exports.DnsBLCacheEntryState || (exports.DnsBLCacheEntryState = {}));
var GenericDnsBLModule = /** @class */ (function () {
    function GenericDnsBLModule(app, firewallConfig, config, filePathErrorDocs, cache) {
        this.app = app;
        this.firewallConfig = firewallConfig;
        this.config = config;
        this.filePathErrorDocs = filePathErrorDocs;
        this.cache = cache;
        this.dnsBLResultCache = {};
        this.queryCache = {};
        this.redisPrefix = 'dnsblv1_';
        this.configureDnsBLClient();
        this.configureMiddleware();
    }
    GenericDnsBLModule.prototype.checkResultOfDnsBLClient = function (query, err, blocked, details) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getCachedResult(query.ip).then(function (value) {
                var potCacheEntry = value;
                if (!potCacheEntry) {
                    potCacheEntry = {
                        created: Date.now(),
                        updated: undefined,
                        details: undefined,
                        state: undefined,
                        ttl: undefined,
                        ip: query.ip,
                    };
                }
                potCacheEntry.updated = Date.now();
                potCacheEntry.details = details;
                if (err) {
                    // NORESULT
                    if (err.code === 'ENOTFOUND') {
                        // not known: OK
                        potCacheEntry.ttl = (Date.now() + _this.config.dnsttl);
                        potCacheEntry.state = DnsBLCacheEntryState.OK;
                    }
                    else {
                        // ERROR
                        console.error('DnsBLModule: error while reading for query:'
                            + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg([query.ip, query.req.url].join(' ')), err);
                        if (potCacheEntry.state !== DnsBLCacheEntryState.BLOCKED) {
                            potCacheEntry.state = DnsBLCacheEntryState.NORESULT;
                        }
                        potCacheEntry.ttl = (Date.now() + _this.config.errttl);
                    }
                }
                else if (!blocked) {
                    // OK
                    potCacheEntry.ttl = (Date.now() + _this.config.dnsttl);
                    potCacheEntry.state = DnsBLCacheEntryState.OK;
                }
                else {
                    // BLOCKED
                    potCacheEntry.ttl = (Date.now() + _this.config.dnsttl);
                    potCacheEntry.state = DnsBLCacheEntryState.BLOCKED;
                }
                _this.putCachedResult(query.ip, potCacheEntry);
                _this.resolveResult(potCacheEntry, query, _this.firewallConfig, _this.filePathErrorDocs);
                return resolve(potCacheEntry);
            });
        });
    };
    GenericDnsBLModule.prototype.configureMiddleware = function () {
        var me = this;
        me.app.use(function (req, res, _next) {
            var ip = req['clientIp'];
            // check for valid ip4
            if (isIP(ip, '6')) {
                return _next();
            }
            if (!isIP(ip, '4')) {
                console.warn('DnsBLModule: BLOCKED invalid IP:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(ip) +
                    ' URL:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(req.url));
                return firewall_commons_1.FirewallCommons.resolveBlocked(req, res, me.firewallConfig, me.filePathErrorDocs);
            }
            // check for dnsbl
            me.getCachedResult(ip).then(function (value) {
                var cacheEntry = value;
                var query = me.createQuery(ip, req, res, _next);
                // already cached
                if (me.isCacheEntryValid(cacheEntry)) {
                    return me.resolveResult(cacheEntry, query, me.firewallConfig, me.filePathErrorDocs);
                }
                // whitelisted
                if (me.isWhitelisted(ip)) {
                    return _next();
                }
                // same query running
                var promise = me.getCachedQuery(ip);
                if (promise) {
                    promise.then(function (parentCacheEntry) {
                        return me.resolveResult(parentCacheEntry, query, me.firewallConfig, me.filePathErrorDocs);
                    });
                    return;
                }
                // do new query
                promise = me.callDnsBLClient(query);
                me.putCachedQuery(ip, promise);
            });
        });
    };
    GenericDnsBLModule.prototype.resolveResult = function (cacheEntry, query, firewallConfig, filePathErrorDocs) {
        // remove from queryCache
        this.removeCachedQuery(query.ip);
        // delete timer
        if (query.timeoutTimer) {
            clearTimeout(query.timeoutTimer);
        }
        // ignore if already served
        if (query.alreadyServed) {
            return;
        }
        query.alreadyServed = true;
        if (cacheEntry.state !== DnsBLCacheEntryState.BLOCKED) {
            return query._next();
        }
        console.warn('DnsBLModule: BLOCKED blacklisted IP:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(query.req['clientIp']) +
            ' URL:' + serverlog_utils_1.ServerLogUtils.sanitizeLogMsg(query.req.url));
        return firewall_commons_1.FirewallCommons.resolveBlocked(query.req, query.res, firewallConfig, filePathErrorDocs);
    };
    GenericDnsBLModule.prototype.createQuery = function (ip, req, res, _next) {
        return {
            ip: ip,
            req: req,
            res: res,
            _next: _next,
            alreadyServed: false,
            timeoutTimer: undefined
        };
    };
    GenericDnsBLModule.prototype.isCacheEntryValid = function (cacheEntry) {
        return cacheEntry && cacheEntry.ttl >= Date.now();
    };
    GenericDnsBLModule.prototype.isWhitelisted = function (ip) {
        return this.config.whitelistIps.indexOf(ip) >= 0;
    };
    GenericDnsBLModule.prototype.getCachedResult = function (ip) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.dnsBLResultCache[ip]) {
                return resolve(_this.dnsBLResultCache[ip]);
            }
            else if (_this.cache) {
                _this.cache.get(_this.redisPrefix + ip).then(function (value) {
                    return resolve(value);
                }).catch(function (reason) {
                    console.error('DnsBLModule: cant read cache:', reason);
                    return resolve();
                });
            }
            else {
                return resolve();
            }
        });
    };
    GenericDnsBLModule.prototype.putCachedResult = function (ip, cacheEntry) {
        this.dnsBLResultCache[ip] = cacheEntry;
        if (this.cache) {
            this.cache.set(this.redisPrefix + ip, cacheEntry);
        }
    };
    GenericDnsBLModule.prototype.getCachedQuery = function (ip) {
        return this.queryCache[ip];
    };
    GenericDnsBLModule.prototype.putCachedQuery = function (ip, query) {
        this.queryCache[ip] = query;
    };
    GenericDnsBLModule.prototype.removeCachedQuery = function (ip) {
        delete this.queryCache[ip];
    };
    return GenericDnsBLModule;
}());
exports.GenericDnsBLModule = GenericDnsBLModule;
//# sourceMappingURL=generic-dnsbl.module.js.map