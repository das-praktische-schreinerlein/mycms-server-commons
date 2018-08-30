/// <reference types="express" />
import * as express from 'express';
import { DnsBLConfig, FirewallConfig } from './firewall.commons';
import { DnsBLCacheEntry, DnsBLQuery, GenericDnsBLModule } from './generic-dnsbl.module';
import { DataCacheModule } from './datacache.module';
export declare class DnsBLModule extends GenericDnsBLModule {
    protected app: express.Application;
    protected firewallConfig: FirewallConfig;
    protected config: DnsBLConfig;
    protected filePathErrorDocs: string;
    protected cache: DataCacheModule;
    private pot;
    private maxThreatScore;
    static configureDnsBL(app: express.Application, firewallConfig: FirewallConfig, filePathErrorDocs: string): DnsBLModule;
    constructor(app: express.Application, firewallConfig: FirewallConfig, config: DnsBLConfig, filePathErrorDocs: string, cache: DataCacheModule);
    protected configureDnsBLClient(): void;
    protected callDnsBLClient(query: DnsBLQuery): Promise<DnsBLCacheEntry>;
}
