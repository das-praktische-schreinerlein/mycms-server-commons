import {PasswordValidationRule, ValidationRule} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import {PasswordUtils} from '@dps/mycms-commons/dist/commons/utils/password.utils';
import {ConfigInitializerUtil} from '@dps/mycms-commons/dist/tools/config-initializer.util';
import * as Promise_serial from 'promise-serial';
import {CommonAdminCommand, SimpleConfigFilePathValidationRule} from './common-admin.command';

export class ConfigInitializerCommand extends CommonAdminCommand {
    protected configbasepath: string;

    protected createValidationRules(): {[key: string]: ValidationRule} {
        return {
            'newpassword': new PasswordValidationRule(false),
            'tokenkey': new PasswordValidationRule(false),
            'configbasepath': new SimpleConfigFilePathValidationRule(false)
        };
    }

    protected definePossibleActions(): string[] {
        return ['resetServicePasswords',
            'resetTokenCookie', 'setTokenCookie'
        ];
    }

    protected processCommandArgs(argv: {}): Promise<any> {
        this.configbasepath = argv['configbasepath'] || 'config';
        const tokenkey = argv['tokenkey'];
        const newpassword = argv['newpassword'];

        const action = argv['action'];
        switch (action) {
            case 'resetServicePasswords':
                return Promise.resolve('DONE - resetServicePasswords');
            case 'resetTokenCookie':
                return this.setTokenCookie(tokenkey, PasswordUtils.createNewDefaultPassword(30));
            case 'setTokenCookie':
                return this.setTokenCookie(tokenkey, newpassword);
            default:
                console.error('unknown action:', argv);
                return Promise.reject('unknown action');
        }
    }

    protected setTokenCookie(tokenkey: string, newpassword: string): Promise<any> {
        if (tokenkey === undefined || tokenkey.length < 8) {
            return Promise.reject('valid tokenkey required');
        }
        if (newpassword === undefined || newpassword.length < 8) {
            return Promise.reject('valid newpassword required');
        }

        const me = this;
        const promises = [];
        promises.push(function () {
            return ConfigInitializerUtil.replaceTokenCookieInFirewallConfig(
                me.configbasepath + '/firewall.beta.json',
                tokenkey,
                newpassword, false);
        });
        promises.push(function () {
            return ConfigInitializerUtil.replaceTokenCookieInFirewallConfig(
                me.configbasepath + '/firewall.dev.json',
                tokenkey,
                newpassword, false);
        });
        promises.push(function () {
            return ConfigInitializerUtil.replaceTokenCookieInFirewallConfig(
                me.configbasepath + '/firewall.prod.json',
                tokenkey,
                newpassword, false);
        });

        return Promise_serial(promises, {parallelize: 1}).then(() => {
            return Promise.resolve('DONE - setTokenCookie');
        }).catch(reason => {
            return Promise.reject(reason);
        });
    }
}
