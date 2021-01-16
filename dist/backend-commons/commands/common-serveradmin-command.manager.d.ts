import { CommonAdminCommandConfigType, CommonAdminCommandManager, CommonAdminCommandsRequestType } from './common-admin-command.manager';
import { CommonAdminCommand } from './common-admin.command';
export interface CommonServerAdminCommandConfigType extends CommonAdminCommandConfigType {
    srcBaseUrl: string;
    destBaseUrl: string;
    backend: string;
    sitemap: string;
}
export declare abstract class CommonServerAdminCommandManager<A extends CommonServerAdminCommandConfigType> extends CommonAdminCommandManager<A> {
    protected restrictedCommandActions: string[];
    constructor(commands: {
        [key: string]: CommonAdminCommand;
    }, adminCommandConfig: A, restrictedCommandActions: string[]);
    protected initializeCommand(argv: {}): Promise<CommonAdminCommandsRequestType>;
}
