import * as express from 'express';
import { FirewallConfig } from './firewall.commons';
export declare class FirewallModule {
    static configureFirewall(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string): void;
    static configureLocalHostOnly(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string): void;
    static configureLocalNetOnly(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string): void;
    static configureIPWhitelist(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string): void;
    static configureIPBlacklist(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string): void;
    static renderError(firewallConfig: FirewallConfig, filePathErrorDocs: string, err: any, req: any, res: any, _next: any): void;
}
