import * as redis from 'redis';

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

export class DataCacheModule {
    private redisClient;

    constructor(protected config: CacheConfig) {
        this.configureRedisStore();
    }

    protected configureRedisStore() {
        if (this.config.cacheRedisUrl) {
            this.redisClient = redis.createClient({url: this.config.cacheRedisUrl, password: this.config.cacheRedisPass,
                db: this.config.cacheRedisDB});
        }
    }
    public get(key: string): Promise<CacheEntry> {
        return new Promise<CacheEntry>((resolve, reject) => {
            if (this.redisClient) {
                this.redisClient.get(key, function (er, data) {
                    if (er) {
                        console.error('DataCacheModule: error while calling redis:', er);
                    }
                    if (!data || data === null || data === 'null') {
                        return resolve();
                    }

                    let result;
                    try {
                        result = JSON.parse(data.toString());
                    } catch (error) {
                        console.error('DataCacheModule: cant parse redisresult:', error, data);
                        return resolve();
                    }
                    return resolve(result);
                });
            } else {
                return resolve();
            }
        });
    }

    public set(key: string, cacheEntry: CacheEntry) {
        if (this.redisClient) {
            this.redisClient.set(key, JSON.stringify(cacheEntry));
        }
    }
}
