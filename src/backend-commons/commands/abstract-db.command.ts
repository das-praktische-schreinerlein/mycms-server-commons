import {DatabaseService} from '@dps/mycms-commons/dist/commons/services/database.service';
import * as knex from 'knex';
import {SqlQueryBuilder} from '@dps/mycms-commons/dist/search-commons/services/sql-query.builder';
import {CommonAdminCommand} from './common-admin.command';

export interface DbCommandOptions {
    basePath: string;
    knexConfig: {
        client: string;
        connection: {}
    }
}

export abstract class AbstractDbCommand<O extends DbCommandOptions> extends CommonAdminCommand {

    protected abstract configureDbCommandOptions(argv: {}): Promise<O>;

    protected processCommandArgs(argv: {}): Promise<any> {
        const functionFiles: string[] = [];
        const sqlFiles: string[] = [];

        return this.configureDbCommandOptions(argv).then(dbCommandOptions => {
            return this.configureProcessingFiles(dbCommandOptions, functionFiles, sqlFiles);
        }).then(dbCommandOptions => {
            const knexOpts = {
                client: dbCommandOptions.knexConfig['client'],
                connection: dbCommandOptions.knexConfig['connection']
            };

            let sqls = [];
            for (const file of functionFiles) {
                sqls = sqls.concat(DatabaseService.extractSqlFileOnScriptPath(file, '$$'));
            }
            for (const file of sqlFiles) {
                sqls = sqls.concat(DatabaseService.extractSqlFileOnScriptPath(file, ';'));
            }

            const databaseService = new DatabaseService(knex(knexOpts), new SqlQueryBuilder());

            console.log('dbCommand - executing sqls', dbCommandOptions.basePath, sqls.length, sqlFiles);
            return databaseService.executeSqls(sqls);
        });
    }

    protected abstract configureProcessingFiles(processingFilesOptions: O, functionFiles: string[],
                                                sqlFiles: string[]): Promise<O>;
}
