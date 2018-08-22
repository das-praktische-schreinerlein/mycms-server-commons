import express from 'express';
import {DnsBLConfig, FirewallCommons, FirewallConfig} from './firewall.commons';
import isIP from 'validator/lib/isIP';
import {CacheEntry, DataCacheModule} from './datacache.module';
import {ServerLogUtils} from './serverlog.utils';

export enum DnsBLCacheEntryState {
    OK, BLOCKED, NORESULT
}

export interface DnsBLCacheEntry extends CacheEntry {
    ip: string;
    ttl: number;
    state: DnsBLCacheEntryState;
}

export interface DnsBLQuery {
    ip: string;
    req: any;
    res: any;
    _next: any;
    alreadyServed: boolean;
    timeoutTimer: any;
}


export abstract class GenericDnsBLModule {
    private dnsBLResultCache = {};
    private queryCache = {};
    private redisPrefix = 'dnsblv1_';

    constructor(protected app: express.Application, protected firewallConfig: FirewallConfig, protected config: DnsBLConfig,
                protected filePathErrorDocs: string, protected cache: DataCacheModule) {
        this.configureDnsBLClient();
        this.configureMiddleware();
    }

    protected abstract configureDnsBLClient();

    protected abstract callDnsBLClient(query: DnsBLQuery): Promise<DnsBLCacheEntry>;

    protected checkResultOfDnsBLClient(query: DnsBLQuery, err, blocked: boolean, details: any): Promise<DnsBLCacheEntry> {
        return new Promise<DnsBLCacheEntry>((resolve, reject) => {
            this.getCachedResult(query.ip).then(value => {
                let potCacheEntry: DnsBLCacheEntry = value;
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
                        potCacheEntry.ttl = (Date.now() + this.config.dnsttl);
                        potCacheEntry.state = DnsBLCacheEntryState.OK;
                    } else {
                        // ERROR
                        console.error('DnsBLModule: error while reading for query:'
                            + ServerLogUtils.sanitizeLogMsg([query.ip, query.req.url].join(' ')), err);
                        if (potCacheEntry.state !== DnsBLCacheEntryState.BLOCKED) {
                            potCacheEntry.state = DnsBLCacheEntryState.NORESULT;
                        }
                        potCacheEntry.ttl = (Date.now() + this.config.errttl);
                    }
                } else if (!blocked) {
                    // OK
                    potCacheEntry.ttl = (Date.now() + this.config.dnsttl);
                    potCacheEntry.state = DnsBLCacheEntryState.OK;
                } else {
                    // BLOCKED
                    potCacheEntry.ttl = (Date.now() + this.config.dnsttl);
                    potCacheEntry.state = DnsBLCacheEntryState.BLOCKED;
                }

                this.putCachedResult(query.ip, potCacheEntry);

                this.resolveResult(potCacheEntry, query, this.firewallConfig, this.filePathErrorDocs);

                return resolve(potCacheEntry);
            });
        });
    }

    protected configureMiddleware() {
        const me = this;
        me.app.use(function(req, res, _next) {
            const ip = req['clientIp'];
            // check for valid ip4
            if (isIP(ip, '6')) {
                return _next();
            }
            if (!isIP(ip, '4')) {
                console.warn('DnsBLModule: BLOCKED invalid IP:' + ServerLogUtils.sanitizeLogMsg(ip) +
                    ' URL:' + ServerLogUtils.sanitizeLogMsg(req.url));
                return FirewallCommons.resolveBlocked(req, res, me.firewallConfig, me.filePathErrorDocs);
            }

            // check for dnsbl
            me.getCachedResult(ip).then(value => {
                const cacheEntry: DnsBLCacheEntry = value;
                const query = me.createQuery(ip, req, res, _next);

                // already cached
                if (me.isCacheEntryValid(cacheEntry)) {
                    return me.resolveResult(cacheEntry, query, me.firewallConfig, me.filePathErrorDocs);
                }

                // whitelisted
                if (me.isWhitelisted(ip)) {
                    return _next();
                }

                // same query running
                let promise = me.getCachedQuery(ip);
                if (promise) {
                    promise.then(function(parentCacheEntry: DnsBLCacheEntry) {
                        return me.resolveResult(parentCacheEntry, query, me.firewallConfig, me.filePathErrorDocs);
                    });
                    return;
                }

                // do new query
                promise = me.callDnsBLClient(query);
                me.putCachedQuery(ip, promise);
            });
        });
    }

    protected resolveResult(cacheEntry: DnsBLCacheEntry, query: DnsBLQuery, firewallConfig: FirewallConfig, filePathErrorDocs: string) {
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

        console.warn('DnsBLModule: BLOCKED blacklisted IP:' + ServerLogUtils.sanitizeLogMsg(query.req['clientIp']) +
            ' URL:' + ServerLogUtils.sanitizeLogMsg(query.req.url));
        return FirewallCommons.resolveBlocked(query.req, query.res, firewallConfig, filePathErrorDocs);
    }

    protected createQuery(ip: string, req, res, _next): DnsBLQuery {
        return {
            ip: ip,
            req: req,
            res: res,
            _next: _next,
            alreadyServed: false,
            timeoutTimer: undefined
        };
    }

    protected isCacheEntryValid(cacheEntry: DnsBLCacheEntry): boolean {
        return cacheEntry && cacheEntry.ttl >= Date.now();
    }

    protected isWhitelisted(ip: string): boolean {
        return this.config.whitelistIps.indexOf(ip) >= 0;
    }

    protected getCachedResult(ip: string): Promise<DnsBLCacheEntry> {
        return new Promise<DnsBLCacheEntry>((resolve, reject) => {
            if (this.dnsBLResultCache[ip]) {
                return resolve(this.dnsBLResultCache[ip]);
            } else if (this.cache) {
                this.cache.get(this.redisPrefix + ip).then(value => {
                    return resolve(<DnsBLCacheEntry>value);
                }).catch(reason => {
                    console.error('DnsBLModule: cant read cache:', reason);
                    return resolve();
                });
            } else {
                return resolve();
            }
        });
    }

    protected putCachedResult(ip: string, cacheEntry: DnsBLCacheEntry) {
        this.dnsBLResultCache[ip] = cacheEntry;
        if (this.cache) {
            this.cache.set(this.redisPrefix + ip, cacheEntry);
        }
    }

    protected getCachedQuery(ip: string): Promise<DnsBLCacheEntry> {
        return this.queryCache[ip];
    }

    protected putCachedQuery(ip: string, query: Promise<DnsBLCacheEntry>) {
        this.queryCache[ip] = query;
    }

    protected removeCachedQuery(ip: string) {
        delete this.queryCache[ip];
    }
}
