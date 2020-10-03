import * as express from 'express';
import { CommonBackendConfigType, CommonKeywordMapperConfigType } from "../backend-commons/modules/backend.commons";
import { CacheConfig } from "./datacache.module";
export declare class ConfigureServerModule {
    static configureServer(app: express.Application, backendConfig: any | CommonBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>): void;
    static configureServerAddHysteric(app: express.Application, backendConfig: {}): void;
    static configureDefaultErrorHandler(app: express.Application): void;
}
