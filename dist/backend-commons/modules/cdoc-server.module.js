"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var facets_1 = require("@dps/mycms-commons/dist/search-commons/model/container/facets");
var js_data_1 = require("js-data");
var generic_validator_util_2 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var CommonDocServerModule = /** @class */ (function () {
    function CommonDocServerModule(dataService, cache) {
        this.dataService = dataService;
        this.cache = cache;
        this.idValidationRule = new generic_validator_util_1.IdValidationRule(true);
        this.optionalProfileValidationRule = new generic_validator_util_2.KeyParamsValidationRule(false);
    }
    CommonDocServerModule.configureServerRoutes = function (app, apiPrefix, cdocServerModule, cache, backendConfig) {
        // configure express
        app.param(cdocServerModule.getApiResolveParameterName(), function (req, res, next, id) {
            var idParam = (id || '');
            if (!cdocServerModule.idValidationRule.isValid(idParam)) {
                return next('not found');
            }
            var cacheKey = cdocServerModule.generateCacheKey(id);
            // @ts-ignore: is functional
            cache.get(cacheKey).then(function (value) {
                if (value !== undefined) {
                    req[cdocServerModule.getApiId()] = Object.assign(cdocServerModule.getDataService().newRecord({}), value.details);
                    return next();
                }
                return cdocServerModule.getById(req, next, id);
            }).catch(function (reason) {
                return cdocServerModule.getById(req, next, id);
            });
        });
        console.log('configure route ' + cdocServerModule.getApiId() + ':', apiPrefix + '/:locale' + '/' + cdocServerModule.getApiId() + '/:' + cdocServerModule.getApiResolveParameterName());
        app.route(apiPrefix + '/:locale' + '/' + cdocServerModule.getApiId() + '/:' + cdocServerModule.getApiResolveParameterName())
            .all(function (req, res, next) {
            if (req.method !== 'GET') {
                return next('not allowed');
            }
            return next();
        })
            .get(function (req, res, next) {
            var doc = req[cdocServerModule.getApiId()];
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
            .all(function (req, res, next) {
            if (req.method !== 'GET') {
                return next('not allowed');
            }
            return next();
        })
            .get(function (req, res, next) {
            var searchForm = cdocServerModule.getDataService().newSearchForm(req.query);
            if (!cdocServerModule.isSearchFormValid(searchForm)) {
                console.warn('form invalid');
                res.json((cdocServerModule.getDataService().newSearchResult(searchForm, 0, [], new facets_1.Facets())
                    .toSerializableJsonObj()));
                return next();
            }
            try {
                var searchOptions_1 = {
                    showForm: req.query['showForm'] !== 'false',
                    loadTrack: req.query['loadTrack'] && req.query['loadTrack'] !== 'false',
                    showFacets: true
                };
                if (req.query['showFacets'] === 'false') {
                    searchOptions_1.showFacets = false;
                }
                else if (req.query['showFacets'] === 'true') {
                    searchOptions_1.showFacets = true;
                }
                else if (req.query['showFacets'] !== undefined) {
                    var facetsValue = req.query['showFacets'].toString();
                    if (!cdocServerModule.optionalProfileValidationRule.isValid(facetsValue)) {
                        res.json((cdocServerModule.getDataService().newSearchResult(searchForm, 0, [], new facets_1.Facets())
                            .toSerializableJsonObj()));
                        return next();
                    }
                    searchOptions_1.showFacets = facetsValue.split(',');
                }
                if (req.query['loadDetailsMode'] === false || req.query['loadDetailsMode'] === 'false') {
                    searchOptions_1.loadDetailsMode = 'none';
                }
                else if (req.query['loadDetailsMode'] !== undefined) {
                    var loadDetailsModeValue = req.query['loadDetailsMode'].toString();
                    if (!cdocServerModule.optionalProfileValidationRule.isValid(loadDetailsModeValue)) {
                        res.json((cdocServerModule.getDataService().newSearchResult(searchForm, 0, [], new facets_1.Facets())
                            .toSerializableJsonObj()));
                        return next();
                    }
                    searchOptions_1.loadDetailsMode = loadDetailsModeValue;
                }
                cdocServerModule.getDataService().search(searchForm, searchOptions_1).then(function searchDone(searchResult) {
                    if (searchOptions_1.showForm === false) {
                        searchResult.searchForm = cdocServerModule.getDataService().newSearchForm({});
                    }
                    if (searchOptions_1.showFacets === false) {
                        searchResult.facets = new facets_1.Facets();
                    }
                    res.json(searchResult.toSerializableJsonObj(backendConfig.apiAnonymizeMedia));
                    return next();
                }).catch(function searchError(error) {
                    console.error('error thrown: ', error);
                    return next('not found');
                });
            }
            catch (error) {
                console.error('error thrown: ', error);
                return next('not found');
            }
        });
    };
    CommonDocServerModule.prototype.getById = function (req, next, id) {
        var searchOptions = {
            showForm: false,
            loadTrack: false,
            showFacets: false,
            loadDetailsMode: 'details'
        };
        var searchForm = this.dataService.newSearchForm({ moreFilter: 'id:' + this.idValidationRule.sanitize(id) });
        var cacheKey = this.generateCacheKey(id);
        var me = this;
        return me.dataService.search(searchForm, searchOptions).then(function searchDone(searchResult) {
            if (!searchResult || searchResult.recordCount !== 1) {
                req[me.getApiId()] = undefined;
                return next();
            }
            req[me.getApiId()] = searchResult.currentRecords[0];
            var cachedDoc = req[me.getApiId()].toSerializableJsonObj();
            me.cache.set(cacheKey, { details: cachedDoc, created: new Date().getDate(), updated: new Date().getDate() });
            return next();
        }).catch(function searchError(error) {
            console.error('error thrown: ', error);
            return next('not found');
        });
    };
    CommonDocServerModule.prototype.initCache = function () {
        var me = this;
        var searchForm = this.getDataService().newSearchForm({});
        var getById = function (id) {
            return me.getById({}, function () { }, id);
        };
        var createNextCache = function () {
            console.log('DO - search for page: ' + searchForm.pageNum);
            return me.getDataService().search(searchForm).then(function searchDone(searchResult) {
                var ids = [];
                for (var _i = 0, _a = searchResult.currentRecords; _i < _a.length; _i++) {
                    var doc = _a[_i];
                    ids.push(doc.id);
                }
                console.log('DO - initcache for page: ' + searchForm.pageNum + ' docs:', ids);
                var actions = ids.map(getById); // run the function over all items
                // we now have a promises array and we want to wait for it
                var results = Promise.all(actions); // pass array of promises
                return results.then(function (data) {
                    console.log('DONE - initcache for page: ' + searchForm.pageNum + ' docs:', ids);
                    searchForm.pageNum++;
                    if (searchForm.pageNum < searchResult.recordCount / searchForm.perPage) {
                        return createNextCache();
                    }
                    else {
                        console.log('DONE - initializing cache');
                        return js_data_1.utils.resolve('WELL DONE');
                    }
                });
            }).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return js_data_1.utils.reject(error);
            });
        };
        return createNextCache();
    };
    CommonDocServerModule.prototype.generateCacheKey = function (id) {
        return 'cachev1_solr_' + this.getApiId() + 'Id_' + id;
    };
    CommonDocServerModule.prototype.getCache = function () {
        return this.cache;
    };
    CommonDocServerModule.prototype.getDataService = function () {
        return this.dataService;
    };
    return CommonDocServerModule;
}());
exports.CommonDocServerModule = CommonDocServerModule;
//# sourceMappingURL=cdoc-server.module.js.map