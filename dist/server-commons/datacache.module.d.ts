export interface CacheEntry {
    created: number;
    updated: number;
    details: any;
}
export interface CacheConfig {
    cacheRedisUrl: string;
    cacheRedisPass: string;
    cacheRedisDB: string;
}
export declare class DataCacheModule {
    protected config: CacheConfig;
    private redisClient;
    constructor(config: CacheConfig);
    protected configureRedisStore(): void;
    get(key: string): Promise<CacheEntry>;
    set(key: string, cacheEntry: CacheEntry): void;
}
