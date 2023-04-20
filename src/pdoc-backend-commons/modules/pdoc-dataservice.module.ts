import {PDocDataStore} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.store';
import {SearchParameterUtils} from '@dps/mycms-commons/dist/search-commons/services/searchparameter.utils';
import {PDocDataService} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service';
import {PDocSolrAdapter} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-solr.adapter';
import * as axios from 'axios';
import {HttpAdapter} from 'js-data-http';
import {FacetCacheUsageConfigurations} from '@dps/mycms-commons/dist/search-commons/services/sql-query.builder';
import {CommonPDocBackendConfigType} from './pdoc-backend.commons';
import {PDocSqlAdapter} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-sql.adapter';

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

export class PDocDataServiceModule {
    private static dataServices = new Map<string, PDocDataService>();

    public static getDataService(profile: string, backendConfig: CommonPDocBackendConfigType<any>): PDocDataService {
        if (!this.dataServices.has(profile)) {
            switch (backendConfig.pdocDataStoreAdapter) {
                case 'PDocSolrAdapter':
                    this.dataServices.set(profile, PDocDataServiceModule.createDataServiceSolr(backendConfig));
                    break;
                case 'PDocSqlAdapter':
                    this.dataServices.set(profile, PDocDataServiceModule.createDataServiceSql(backendConfig));
                    break;
                default:
                    throw new Error('configured pdocDataStoreAdapter not exist:' + backendConfig.pdocDataStoreAdapter);
            }
        }

        return this.dataServices.get(profile);
    }

    private static createDataServiceSolr(backendConfig: CommonPDocBackendConfigType<any>): PDocDataService {
        // configure store
        const dataStore: PDocDataStore = new PDocDataStore(new SearchParameterUtils());
        const dataService: PDocDataService = new PDocDataService(dataStore);

        // configure solr-adapter
        const solrConfig = backendConfig.PDocSolrAdapter;
        if (solrConfig === undefined) {
            throw new Error('config for PDocSolrAdapter not exists');
        }

        const options = {
            basePath: solrConfig.solrCorePDoc,
            suffix: '&wt=json&indent=on&datatype=jsonp&json.wrf=JSONP_CALLBACK&callback=JSONP_CALLBACK&',
            http: axios,
            beforeHTTP: function (config, opts) {
                config.auth = {
                    username: solrConfig.solrCorePDocReadUsername,
                    password: solrConfig.solrCorePDocReadPassword
                };

                // Now do the default behavior
                return HttpAdapter.prototype.beforeHTTP.call(this, config, opts);
            }
        };
        const adapter = new PDocSolrAdapter(options);
        dataStore.setAdapter('http', adapter, '', {});

        return dataService;
    }

    private static createDataServiceSql(backendConfig: CommonPDocBackendConfigType<any>): PDocDataService {
        // configure store
        const dataStore: PDocDataStore = new PDocDataStore(new SearchParameterUtils());
        const dataService: PDocDataService = new PDocDataService(dataStore);

        // configure adapter
        const sqlConfig: SqlConnectionConfig = backendConfig.PDocSqlAdapter;
        if (sqlConfig === undefined) {
            throw new Error('config for PDocSqlMytbDbAdapter not exists');
        }
        const options = {
            knexOpts: {
                client: sqlConfig.client,
                connection: sqlConfig.connection
            }
        };

        const adapter = new PDocSqlAdapter(options,
            <FacetCacheUsageConfigurations>backendConfig.PDocSqlAdapter['facetCacheUsage']);
        dataStore.setAdapter('http', adapter, '', {});

        return dataService;
    }

}
