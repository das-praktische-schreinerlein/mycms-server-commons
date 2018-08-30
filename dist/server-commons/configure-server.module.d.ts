/// <reference types="express" />
import * as express from 'express';
export declare class ConfigureServerModule {
    static configureServer(app: express.Application, backendConfig: {}): void;
    static configureServerAddHysteric(app: express.Application, backendConfig: {}): void;
    static configureDefaultErrorHandler(app: express.Application): void;
}
