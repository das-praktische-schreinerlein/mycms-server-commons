"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var js_data_1 = require("js-data");
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var CommonDocWriterServerModule = /** @class */ (function () {
    function CommonDocWriterServerModule(docServerModule, responseMapper) {
        this.docServerModule = docServerModule;
        this.responseMapper = responseMapper;
        this.idValidationRule = new generic_validator_util_1.IdValidationRule(true);
        this.dataService = docServerModule.getDataService();
        this.mapper = this.dataService.getMapper(this.dataService.getBaseMapperName());
        this.adapter = this.dataService.getAdapterForMapper(this.dataService.getBaseMapperName());
        this.dataService.setWritable(true);
    }
    CommonDocWriterServerModule.configureServerRoutes = function (app, apiPrefix, docWriterServerModule) {
        var apiId = docWriterServerModule.docServerModule.getApiId();
        var apiResolveParameterName = docWriterServerModule.docServerModule.getApiResolveParameterName();
        console.log('configure route ' + apiId + ':', apiPrefix + '/:locale' + '/' + apiId + 'write/:' + apiResolveParameterName);
        app.route(apiPrefix + '/:locale' + '/' + apiId + 'write')
            .all(function (req, res, next) {
            if (req.method !== 'POST') {
                return next('not allowed');
            }
            return next();
        })
            .post(function (req, res, next) {
            var docSrc = req['body'];
            if (docSrc === undefined) {
                console.log('create failed: no requestbody');
                res.status(403);
                res.json();
                return next('not found');
            }
            docWriterServerModule.addRecord(docSrc).then(function (doc) {
                if (doc === undefined) {
                    console.log('create not fullfilled: no result');
                    res.status(403);
                    res.json();
                    return next('not found');
                }
                res.json(doc.toSerializableJsonObj());
                return next();
            }).catch(function (reason) {
                console.error('createrequest not fullfilled:', reason);
                res.status(403);
                res.json();
                return next('not found');
            });
        });
        app.route(apiPrefix + '/:locale' + '/' + apiId + 'write/:' + apiResolveParameterName)
            .all(function (req, res, next) {
            if (req.method === 'POST' || req.method === 'DEL') {
                return next('not allowed');
            }
            return next();
        })
            .put(function (req, res, next) {
            var docSrc = req['body'];
            if (docSrc === undefined) {
                console.log('update failed: no requestbody');
                res.status(403);
                res.json();
                return next('not found');
            }
            docWriterServerModule.updateRecord(docSrc).then(function (doc) {
                if (doc === undefined) {
                    console.log('update not fullfilled: doc not found');
                    res.status(403);
                    res.json();
                    return next();
                }
                res.json(doc.toSerializableJsonObj());
                return next();
            }).catch(function (reason) {
                console.error('updaterequest not fullfilled:', reason);
                res.status(403);
                res.json();
                return next('not found');
            });
        });
        app.route(apiPrefix + '/:locale' + '/' + apiId + 'action')
            .all(function (req, res, next) {
            if (req.method === 'POST' || req.method === 'DEL') {
                return next('not allowed');
            }
            return next();
        })
            .put(function (req, res, next) {
            var actionSrc = req['body'];
            if (actionSrc === undefined) {
                console.log('actiontag failed: no requestbody');
                res.status(403);
                res.json();
                return next('not found');
            }
            docWriterServerModule.doActionTag(actionSrc).then(function (doc) {
                if (doc === undefined) {
                    console.log('actiontag not fullfilled: action not found');
                    res.status(403);
                    res.json();
                    return next();
                }
                res.json(doc.toSerializableJsonObj());
                return next();
            }).catch(function (reason) {
                console.error('actiontagrequest not fullfilled:', reason);
                res.status(403);
                res.json();
                return next('not found');
            });
        });
    };
    CommonDocWriterServerModule.prototype.updateRecord = function (docSrc) {
        var doc = this.mapRecord(docSrc);
        if (doc === undefined) {
            return js_data_1.utils.reject('record not mapped: undefined');
        }
        if (doc.id === undefined || doc.id === '') {
            return js_data_1.utils.reject('record not mapped: no id');
        }
        return this.dataService.updateById(doc.id, doc);
    };
    CommonDocWriterServerModule.prototype.doActionTag = function (actionTagFormSrc) {
        var _this = this;
        var actionTagForm = this.mapActionTagForm(actionTagFormSrc);
        if (actionTagForm === undefined) {
            return js_data_1.utils.reject('actionTagForm not mapped');
        }
        return this.dataService.getById(actionTagForm.recordId).then(function (doc) {
            if (doc === undefined) {
                return js_data_1.utils.reject('record not mapped: undefined');
            }
            if (doc.id === undefined || doc.id === '') {
                return js_data_1.utils.reject('record not mapped: no id');
            }
            return _this.dataService.doActionTag(doc, actionTagForm);
        }).catch(function (reason) {
            return js_data_1.utils.reject('record not found: ' + reason);
        });
    };
    CommonDocWriterServerModule.prototype.addRecord = function (docSrc) {
        var doc = this.mapRecord(docSrc);
        if (doc === undefined) {
            return js_data_1.utils.reject('record not mapped: undefined');
        }
        if (doc.id !== undefined && doc.id !== '') {
            return js_data_1.utils.reject('record not mapped: existing id');
        }
        return this.dataService.add(doc);
    };
    CommonDocWriterServerModule.prototype.mapRecord = function (docSrc) {
        return this.responseMapper.mapResponseDocument(this.mapper, docSrc, {});
    };
    CommonDocWriterServerModule.prototype.mapActionTagForm = function (actiontTagFormSrc) {
        if (actiontTagFormSrc === undefined) {
            return undefined;
        }
        return {
            recordId: this.idValidationRule.sanitize(actiontTagFormSrc['recordId']),
            key: this.idValidationRule.sanitize(actiontTagFormSrc['key']),
            type: this.idValidationRule.sanitize(actiontTagFormSrc['type']),
            payload: actiontTagFormSrc['payload']
        };
    };
    return CommonDocWriterServerModule;
}());
exports.CommonDocWriterServerModule = CommonDocWriterServerModule;
//# sourceMappingURL=cdoc-writer-server.module.js.map