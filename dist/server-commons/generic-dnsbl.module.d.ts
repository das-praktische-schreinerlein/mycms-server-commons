import * as express from 'express';
import { DnsBLConfig, FirewallConfig } from './firewall.commons';
import { CacheEntry, DataCacheModule } from './datacache.module';
export declare enum DnsBLCacheEntryState {
    OK = 0,
    BLOCKED = 1,
    NORESULT = 2
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
export declare abstract class GenericDnsBLModule {
    protected app: express.Application;
    protected firewallConfig: FirewallConfig;
    protected config: DnsBLConfig;
    protected filePathErrorDocs: string;
    protected cache: DataCacheModule;
    private dnsBLResultCache;
    private queryCache;
    private redisPrefix;
    constructor(app: express.Application, firewallConfig: FirewallConfig, config: DnsBLConfig, filePathErrorDocs: string, cache: DataCacheModule);
    protected abstract configureDnsBLClient(): any;
    protected abstract callDnsBLClient(query: DnsBLQuery): Promise<DnsBLCacheEntry>;
    protected checkResultOfDnsBLClient(query: DnsBLQuery, err: any, blocked: boolean, details: any): Promise<DnsBLCacheEntry>;
    protected configureMiddleware(): void;
    protected resolveResult(cacheEntry: DnsBLCacheEntry, query: DnsBLQuery, firewallConfig: FirewallConfig, filePathErrorDocs: string): any;
    protected createQuery(ip: string, req: any, res: any, _next: any): DnsBLQuery;
    protected isCacheEntryValid(cacheEntry: DnsBLCacheEntry): boolean;
    protected isWhitelisted(ip: string): boolean;
    protected getCachedResult(ip: string): Promise<DnsBLCacheEntry>;
    protected putCachedResult(ip: string, cacheEntry: DnsBLCacheEntry): void;
    protected getCachedQuery(ip: string): Promise<DnsBLCacheEntry>;
    protected putCachedQuery(ip: string, query: Promise<DnsBLCacheEntry>): void;
    protected removeCachedQuery(ip: string): void;
}
