import { PDocDataService } from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service';
import { CommonPDocBackendConfigType } from './pdoc-backend.commons';
export interface SqlConnectionConfig {
    client: 'sqlite3' | 'mysql';
    connection: {
        host: string;
        user: string;
        password: string;
        database: string;
        port: string;
        filename?: string;
    };
}
export declare class PDocDataServiceModule {
    private static dataServices;
    static getDataService(profile: string, backendConfig: CommonPDocBackendConfigType<any>): PDocDataService;
    private static createDataServiceSolr;
    private static createDataServiceSql;
}
