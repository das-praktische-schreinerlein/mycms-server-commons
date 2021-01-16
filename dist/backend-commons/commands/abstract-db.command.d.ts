import { CommonAdminCommand } from './common-admin.command';
export interface DbCommandOptions {
    basePath: string;
    knexConfig: {
        client: string;
        connection: {};
    };
}
export declare abstract class AbstractDbCommand<O extends DbCommandOptions> extends CommonAdminCommand {
    protected abstract configureDbCommandOptions(argv: {}): Promise<O>;
    protected processCommandArgs(argv: {}): Promise<any>;
    protected abstract configureProcessingFiles(processingFilesOptions: O, functionFiles: string[], sqlFiles: string[]): Promise<O>;
}
