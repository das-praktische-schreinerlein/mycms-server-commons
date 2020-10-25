import {FirewallConfig} from './firewall.commons';
import {CommonBackendConfigType, CommonKeywordMapperConfigType} from '../backend-commons/modules/backend.commons';
import {CacheConfig} from './datacache.module';

export interface CommonServerConfigType<B extends CommonBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>,
    F extends FirewallConfig> {
    apiDataPrefix: string;
    apiAssetsPrefix: string;
    apiPublicPrefix: string;
    filePathErrorDocs: string;
    backendConfig: B;
    firewallConfig: F;
}

