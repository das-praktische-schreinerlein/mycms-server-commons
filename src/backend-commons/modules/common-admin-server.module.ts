import express from 'express';
import {CommonServerAdminCommandConfigType, CommonServerAdminCommandManager} from '../commands/common-serveradmin-command.manager';
import {FirewallConfig} from '../../server-commons/firewall.commons';
import {CommonAdminResponseResultState, CommonAdminResponseType} from '@dps/mycms-commons/dist/commons/model/admin-response';

export interface CommonAdminBackendConfigType<A extends CommonServerAdminCommandConfigType> {
    commandConfig: A;
    port: number;
    corsOrigin: boolean;
    bindIp: string;
    tcpBacklog: number;
}

export interface CommonAdminServerConfigType<A extends CommonAdminBackendConfigType<C>,
    C extends CommonServerAdminCommandConfigType, F extends FirewallConfig> {
    apiAdminPrefix: string;
    adminBackendConfig: A;
    filePathErrorDocs: string;
    firewallConfig: F;
}

export class AdminServerModule {
    public static configureRoutes(app: express.Application, apiPrefix: string,
                                  adminCommandManager: CommonServerAdminCommandManager<CommonServerAdminCommandConfigType>) {
        console.log('configure route ', apiPrefix + '/:locale');
        app.route(apiPrefix + '/:locale' + '/' + 'status')
            .all(function(req, res, next) {
                if (req.method !== 'POST') {
                    return next('not allowed');
                }
                return next();
            })
            .post(function(req, res, next) {
                AdminServerModule.createResponseObj(adminCommandManager,
                    CommonAdminResponseResultState.DONE,
                    'state done').then(response => {
                    res.json(response);
                    return next();
                });
            });

        app.route(apiPrefix + '/:locale' + '/' + 'execCommand')
            .all(function(req, res, next) {
                if (req.method !== 'POST') {
                    return next('not allowed');
                }
                return next();
            })
            .post(function(req, res, next) {
                const commandSrc = req['body'];
                if (commandSrc === undefined) {
                    console.log('adminequest failed: no requestbody');
                    res.status(403);
                    res.json();
                    return next('not found');
                }

                const argv = typeof commandSrc === 'string'
                    ? JSON.parse(commandSrc).execommand
                    : commandSrc;
                adminCommandManager.startCommand(argv).then(value => {
                    console.log('DONE - adminrequest finished:', value, argv);
                    AdminServerModule.createResponseObj(adminCommandManager, CommonAdminResponseResultState.DONE,
                        'stat adminrequest done').then(response => {
                        res.json(response);
                        return next();
                    });
                }).catch(reason => {
                    console.error('ERROR - adminrequest failed:', reason, argv);
                    AdminServerModule.createResponseObj(adminCommandManager, CommonAdminResponseResultState.ERROR,
                        'start adminrequest failed:' + reason).then(response => {
                        res.json(response);
                        return next();
                    });
                });
            });
    }

    public static createResponseObj(adminCommandManager: CommonServerAdminCommandManager<CommonServerAdminCommandConfigType>,
                                    resultState: CommonAdminResponseResultState, resultMsg: string): Promise<CommonAdminResponseType> {
        const preparedCommands = adminCommandManager.listPreparedCommands();
        return adminCommandManager.listCommandStatus().then(value => {
            return Promise.resolve({
                resultMsg: resultMsg,
                resultState: resultState,
                resultDate: new Date(),
                preparedCommands: preparedCommands,
                commandsStates: value
            });
        }).catch(reason => {
            console.error('ERROR - adminrequest createResponseObj failed:', reason);
            return Promise.resolve({
                resultMsg: resultMsg,
                resultState: resultState,
                resultDate: new Date(),
                preparedCommands: preparedCommands,
                commandsStates: {}
            });
        })
    }

}
