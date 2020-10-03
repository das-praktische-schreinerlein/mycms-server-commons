import { AbstractCommand } from './abstract.command';
import { CommonImageBackendConfigType, CommonKeywordMapperConfigType, CommonVideoBackendConfigType } from "../modules/backend.commons";
import { CacheConfig } from "../../server-commons/datacache.module";
export declare class CommonMediaManagerCommand implements AbstractCommand {
    private backendConfig;
    constructor(backendConfig: CommonImageBackendConfigType<CommonKeywordMapperConfigType, CacheConfig> & CommonVideoBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>);
    process(argv: any): Promise<any>;
}
