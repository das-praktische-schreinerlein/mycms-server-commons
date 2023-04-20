"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pdoc_data_store_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.store");
var searchparameter_utils_1 = require("@dps/mycms-commons/dist/search-commons/services/searchparameter.utils");
var pdoc_data_service_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-data.service");
var pdoc_solr_adapter_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-solr.adapter");
var axios = require("axios");
var js_data_http_1 = require("js-data-http");
var pdoc_sql_adapter_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-sql.adapter");
var PDocDataServiceModule = /** @class */ (function () {
    function PDocDataServiceModule() {
    }
    PDocDataServiceModule.getDataService = function (profile, backendConfig) {
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
    };
    PDocDataServiceModule.createDataServiceSolr = function (backendConfig) {
        // configure store
        var dataStore = new pdoc_data_store_1.PDocDataStore(new searchparameter_utils_1.SearchParameterUtils());
        var dataService = new pdoc_data_service_1.PDocDataService(dataStore);
        // configure solr-adapter
        var solrConfig = backendConfig.PDocSolrAdapter;
        if (solrConfig === undefined) {
            throw new Error('config for PDocSolrAdapter not exists');
        }
        var options = {
            basePath: solrConfig.solrCorePDoc,
            suffix: '&wt=json&indent=on&datatype=jsonp&json.wrf=JSONP_CALLBACK&callback=JSONP_CALLBACK&',
            http: axios,
            beforeHTTP: function (config, opts) {
                config.auth = {
                    username: solrConfig.solrCorePDocReadUsername,
                    password: solrConfig.solrCorePDocReadPassword
                };
                // Now do the default behavior
                return js_data_http_1.HttpAdapter.prototype.beforeHTTP.call(this, config, opts);
            }
        };
        var adapter = new pdoc_solr_adapter_1.PDocSolrAdapter(options);
        dataStore.setAdapter('http', adapter, '', {});
        return dataService;
    };
    PDocDataServiceModule.createDataServiceSql = function (backendConfig) {
        // configure store
        var dataStore = new pdoc_data_store_1.PDocDataStore(new searchparameter_utils_1.SearchParameterUtils());
        var dataService = new pdoc_data_service_1.PDocDataService(dataStore);
        // configure adapter
        var sqlConfig = backendConfig.PDocSqlAdapter;
        if (sqlConfig === undefined) {
            throw new Error('config for PDocSqlMytbDbAdapter not exists');
        }
        var options = {
            knexOpts: {
                client: sqlConfig.client,
                connection: sqlConfig.connection
            }
        };
        var adapter = new pdoc_sql_adapter_1.PDocSqlAdapter(options, backendConfig.PDocSqlAdapter['facetCacheUsage']);
        dataStore.setAdapter('http', adapter, '', {});
        return dataService;
    };
    PDocDataServiceModule.dataServices = new Map();
    return PDocDataServiceModule;
}());
exports.PDocDataServiceModule = PDocDataServiceModule;
//# sourceMappingURL=pdoc-dataservice.module.js.map