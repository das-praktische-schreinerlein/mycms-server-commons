/// <reference types="express" />
import * as express from 'express';
import { FirewallConfig } from './firewall.commons';
export declare class FirewallModule {
    static configureFirewall(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string): void;
}
