import express from 'express';
import { CommonServerAdminCommandConfigType, CommonServerAdminCommandManager } from '../commands/common-serveradmin-command.manager';
import { FirewallConfig } from '../../server-commons/firewall.commons';
import { CommonAdminResponseResultState, CommonAdminResponseType } from '@dps/mycms-commons/dist/commons/model/admin-response';
export interface CommonAdminBackendConfigType<A extends CommonServerAdminCommandConfigType> {
    commandConfig: A;
    port: number;
    corsOrigin: boolean;
    bindIp: string;
    tcpBacklog: number;
}
export interface CommonAdminServerConfigType<A extends CommonAdminBackendConfigType<C>, C extends CommonServerAdminCommandConfigType, F extends FirewallConfig> {
    profile: string;
    apiAdminPrefix: string;
    adminBackendConfig: A;
    filePathErrorDocs: string;
    firewallConfig: F;
}
export declare class AdminServerModule {
    static configureRoutes(app: express.Application, apiPrefix: string, adminCommandManager: CommonServerAdminCommandManager<CommonServerAdminCommandConfigType>): void;
    static createResponseObj(adminCommandManager: CommonServerAdminCommandManager<CommonServerAdminCommandConfigType>, resultState: CommonAdminResponseResultState, resultMsg: string): Promise<CommonAdminResponseType>;
}
