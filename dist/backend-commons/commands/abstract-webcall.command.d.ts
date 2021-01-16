import { Method } from 'axios';
import { CommonAdminCommand } from './common-admin.command';
export interface WebRequestCommandOptions {
}
export interface SingleWebRequestConfigType {
    method: Method;
    url: string;
    auth: {
        username: string;
        password: string;
    };
    headers?: {
        [key: string]: any;
    };
    params?: {
        [key: string]: any;
    };
    data?: {
        [key: string]: any;
    };
}
export declare abstract class AbstractWebRequestCommand<O extends WebRequestCommandOptions> extends CommonAdminCommand {
    protected abstract configureWebRequestCommandOptions(argv: {}): Promise<O>;
    protected processCommandArgs(argv: {}): Promise<any>;
    protected abstract configureRequests(webRequestCommandOptions: O, webRequests: SingleWebRequestConfigType[]): Promise<O>;
    protected executeRequests(webRequestCommandOptions: O, webRequests: SingleWebRequestConfigType[]): Promise<any>;
    protected executeRequest(webRequestCommandOptions: O, webRequest: SingleWebRequestConfigType): Promise<any>;
}
