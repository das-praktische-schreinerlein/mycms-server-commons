import * as express from 'express';
import {IdValidationRule} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import {Facets} from '@dps/mycms-commons/dist/search-commons/model/container/facets';
import {GenericSearchOptions} from '@dps/mycms-commons/dist/search-commons/services/generic-search.service';
import {GenericSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/generic-searchresult';
import {utils} from 'js-data';
import {GenericSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-searchform';
import {BaseEntityRecord} from '@dps/mycms-commons/dist/search-commons/model/records/base-entity-record';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {CommonDocSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import {CommonDocSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import {CommonDocDataService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import {CacheConfig, DataCacheModule} from '../../server-commons/datacache.module';
import {CommonBackendConfigType, CommonKeywordMapperConfigType} from "./backend.commons";

export abstract class CommonDocServerModule<R extends CommonDocRecord, F extends CommonDocSearchForm,
    S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>> {
    public idValidationRule = new IdValidationRule(true);

    public static configureServerRoutes(app: express.Application, apiPrefix: string,
                                        cdocServerModule: CommonDocServerModule<CommonDocRecord, CommonDocSearchForm,
                                            CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>,
                                            CommonDocDataService<CommonDocRecord, CommonDocSearchForm,
                                                CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>>,
                                        cache: DataCacheModule, backendConfig: any | CommonBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>) {
        // configure express
        app.param(cdocServerModule.getApiResolveParameterName(), function(req, res, next, id) {
            const idParam = (id || '');
            if (!cdocServerModule.idValidationRule.isValid(idParam)) {
                return next('not found');
            }

            const cacheKey = cdocServerModule.generateCacheKey(id);
            // @ts-ignore: is functional
            cache.get(cacheKey).then(value => {
                if (value !== undefined) {
                    req[cdocServerModule.getApiId()] = Object.assign(cdocServerModule.getDataService().newRecord({}), value.details);
                    return next();
                }

                return cdocServerModule.getById(req, next, id);
            }).catch(reason => {
                return cdocServerModule.getById(req, next, id);
            });
        });

        console.log('configure route ' + cdocServerModule.getApiId() + ':',
            apiPrefix + '/:locale' + '/' + cdocServerModule.getApiId() + '/:' + cdocServerModule.getApiResolveParameterName());
        app.route(apiPrefix + '/:locale' + '/' + cdocServerModule.getApiId() + '/:' + cdocServerModule.getApiResolveParameterName())
            .all(function(req, res, next) {
                if (req.method !== 'GET') {
                    return next('not allowed');
                }
                return next();
            })
            .get(function(req, res, next) {
                const doc: CommonDocRecord = req[cdocServerModule.getApiId()];
                if (doc === undefined) {
                    res.json();
                    return next();
                }
                res.json(doc.toSerializableJsonObj(backendConfig.apiAnonymizeMedia));
                return next();
            });

        // use own wrapper for search
        console.log('configure route ' + cdocServerModule.getApiId() + 'search:', apiPrefix + '/:locale/'
            + cdocServerModule.getApiId() + 'search');
        app.route(apiPrefix + '/:locale/' + cdocServerModule.getApiId() + 'search')
            .all(function(req, res, next) {
                if (req.method !== 'GET') {
                    return next('not allowed');
                }
                return next();
            })
            .get(function(req, res, next) {
                const searchForm = cdocServerModule.getDataService().newSearchForm(req.query);
                if (!cdocServerModule.isSearchFormValid(searchForm)) {
                    console.warn('form invalid');
                    res.json((cdocServerModule.getDataService().newSearchResult(searchForm, 0, [], new Facets())
                        .toSerializableJsonObj()));
                    return next();
                }
                try {
                    const searchOptions: GenericSearchOptions = {
                        showForm: req.query['showForm'] !== 'false',
                        loadTrack: req.query['loadTrack'] && req.query['loadTrack'] !== 'false',
                        showFacets: true
                    };
                    if (req.query['showFacets'] === 'false') {
                        searchOptions.showFacets = false;
                    } else if (req.query['showFacets'] === 'true') {
                        searchOptions.showFacets = true;
                    } else if (req.query['showFacets'] !== undefined) {
                        searchOptions.showFacets = req.query['showFacets'].toString().split(',');
                    }

                    cdocServerModule.getDataService().search(searchForm, searchOptions).then(
                        function searchDone(searchResult: CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>) {
                            if (searchOptions.showForm === false) {
                                searchResult.searchForm = cdocServerModule.getDataService().newSearchForm({});
                            }
                            if (searchOptions.showFacets === false) {
                                searchResult.facets = new Facets();
                            }
                            res.json(searchResult.toSerializableJsonObj(backendConfig.apiAnonymizeMedia));
                            return next();
                        }
                    ).catch(
                        function searchError(error) {
                            console.error('error thrown: ', error);
                            return next('not found');
                        }
                    );
                } catch (error) {
                    console.error('error thrown: ', error);
                    return next('not found');
                }
            });
    }

    public constructor(protected dataService: D, protected cache: DataCacheModule) {
    }

    public getById(req, next, id): Promise<S> {
        const searchOptions: GenericSearchOptions = {
            showForm: false,
            loadTrack: false,
            showFacets: false,
            loadDetailsMode: 'details'
        };
        const searchForm = this.dataService.newSearchForm({moreFilter: 'id:' + this.idValidationRule.sanitize(id)});
        const cacheKey = this.generateCacheKey(id);
        const me = this;
        return me.dataService.search(searchForm, searchOptions).then(
            function searchDone(searchResult: CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>) {
                if (!searchResult || searchResult.recordCount !== 1) {
                    req[me.getApiId()] = undefined;
                    return next();
                }
                req[me.getApiId()] = searchResult.currentRecords[0];
                const cachedDoc = req[me.getApiId()].toSerializableJsonObj();
                me.cache.set(cacheKey, {details: cachedDoc, created: new Date().getDate(), updated: new Date().getDate()});
                return next();
            }
        ).catch(
            function searchError(error) {
                console.error('error thrown: ', error);
                return next('not found');
            }
        );
    }

    public initCache(): Promise<any> {
        const me = this;
        const searchForm = this.getDataService().newSearchForm({});

        const getById = function(id) {
            return me.getById({}, function () {}, id);
        };

        const createNextCache = function(): Promise<any> {
            console.log('DO - search for page: ' + searchForm.pageNum);
            return me.getDataService().search(searchForm).then(
                function searchDone(searchResult: GenericSearchResult<BaseEntityRecord, GenericSearchForm>) {
                    const ids = [];
                    for (const doc of searchResult.currentRecords) {
                        ids.push(doc.id);
                    }

                    console.log('DO - initcache for page: ' + searchForm.pageNum + ' docs:', ids);

                    const actions = ids.map(getById); // run the function over all items

                    // we now have a promises array and we want to wait for it
                    const results = Promise.all(actions); // pass array of promises

                    return results.then(data => {
                        console.log('DONE - initcache for page: ' + searchForm.pageNum + ' docs:', ids);
                        searchForm.pageNum++;
                        if (searchForm.pageNum < searchResult.recordCount / searchForm.perPage) {
                            return createNextCache();
                        } else {
                            console.log('DONE - initializing cache');
                            return utils.resolve('WELL DONE');
                        }
                    });
                }).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return utils.reject(error);
            });
        };

        return createNextCache();
    }

    public abstract getApiId(): string;

    public abstract getApiResolveParameterName(): string;

    public generateCacheKey(id: any): string {
        return 'cachev1_solr_' + this.getApiId() + 'Id_' + id;
    }

    public getCache(): DataCacheModule {
        return this.cache;
    }

    public getDataService(): D {
        return this.dataService;
    }
    public abstract isSearchFormValid(searchForm: CommonDocSearchForm): boolean;
}
