"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redis = require("redis");
var DataCacheModule = /** @class */ (function () {
    function DataCacheModule(config) {
        this.config = config;
        this.configureRedisStore();
    }
    DataCacheModule.prototype.configureRedisStore = function () {
        if (this.config.cacheRedisUrl) {
            this.redisClient = redis.createClient({ url: this.config.cacheRedisUrl, password: this.config.cacheRedisPass,
                db: this.config.cacheRedisDB });
        }
    };
    DataCacheModule.prototype.get = function (key) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.redisClient) {
                _this.redisClient.get(key, function (er, data) {
                    if (er) {
                        console.error('DataCacheModule: error while calling redis:', er);
                    }
                    if (!data || data === null || data === 'null') {
                        return resolve();
                    }
                    var result;
                    try {
                        result = JSON.parse(data.toString());
                    }
                    catch (er) {
                        console.error('DataCacheModule: cant parse redisresult:', data);
                        return resolve();
                    }
                    return resolve(result);
                });
            }
            else {
                return resolve();
            }
        });
    };
    DataCacheModule.prototype.set = function (key, cacheEntry) {
        if (this.redisClient) {
            this.redisClient.set(key, JSON.stringify(cacheEntry));
        }
    };
    return DataCacheModule;
}());
exports.DataCacheModule = DataCacheModule;
//# sourceMappingURL=datacache.module.js.map