import axios, {Method} from 'axios';
import {CommonAdminCommand} from './common-admin.command';
import * as Promise_serial from 'promise-serial';
import {utils} from 'js-data';

export interface WebRequestCommandOptions {
}

export interface SingleWebRequestConfigType {
    method: Method,
    url: string,
    auth: {
        username: string,
        password: string
    },
    headers?: {[key: string]: any},
    params?: {[key: string]: any},
    data?: {[key: string]: any}
}

export abstract class AbstractWebRequestCommand<O extends WebRequestCommandOptions> extends CommonAdminCommand {

    protected abstract configureWebRequestCommandOptions(argv: {}): Promise<O>;

    protected processCommandArgs(argv: {}): Promise<any> {
        const webRequests: SingleWebRequestConfigType[] = [];
        return this.configureWebRequestCommandOptions(argv).then(webRequestCommandOptions => {
            return this.configureRequests(webRequestCommandOptions, webRequests);
        }).then((webRequestCommandOptions) => {
            return this.executeRequests(webRequestCommandOptions, webRequests);
        });
    }

    protected abstract configureRequests(webRequestCommandOptions: O, webRequests: SingleWebRequestConfigType[])
        : Promise<O> ;

    protected executeRequests(webRequestCommandOptions: O, webRequests: SingleWebRequestConfigType[]): Promise<any> {
        const me = this;
        const webRequestPromises = [];
        for (const webRequest of webRequests) {
            webRequestPromises.push(function () {
                return me.executeRequest(webRequestCommandOptions, webRequest);
            });
        }

        return Promise_serial(webRequestPromises, {parallelize: 1}).then(() => {
            return utils.resolve('DONE - executed webrequest');
        }).catch(reason => {
            return utils.reject(reason);
        });
    };

    protected executeRequest(webRequestCommandOptions: O, webRequest: SingleWebRequestConfigType): Promise<any> {
        console.log('webcommand - execute webrequest', webRequest.method, webRequest.url);
        return axios.request({
            url: webRequest.url,
            auth: webRequest.auth,
            method: webRequest.method,
            headers: webRequest.headers,
            data: webRequest.data,
            params: webRequest.params
        }).then(response => {
            if (response.status !== 200) {
                return Promise.reject('ERROR - cant load url: ' + response.status);
            }

            return Promise.resolve('DONE - url loaded');
        }).catch(error => {
            return Promise.reject('ERROR - cant load url: "' + error + '"');
        });
    }
}
