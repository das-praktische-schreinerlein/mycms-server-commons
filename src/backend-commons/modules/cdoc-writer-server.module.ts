import * as express from 'express';
import {CommonDocServerModule} from './cdoc-server.module';
import {Adapter} from 'js-data-adapter';
import {Mapper, utils} from 'js-data';
import {ActionTagForm} from '@dps/mycms-commons/dist/commons/utils/actiontag.utils';
import {IdValidationRule} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import {CommonDocSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import {CommonDocDataService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {CommonDocSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import {GenericAdapterResponseMapper} from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';

export abstract class CommonDocWriterServerModule<R extends CommonDocRecord, F extends CommonDocSearchForm,
    S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>> {
    private dataService: D;
    private mapper: Mapper;
    private adapter: Adapter;
    private idValidationRule = new IdValidationRule(true);

    public static configureServerRoutes(app: express.Application, apiPrefix: string,
                                  docWriterServerModule: CommonDocWriterServerModule<CommonDocRecord, CommonDocSearchForm,
                                      CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>,
                                      CommonDocDataService<CommonDocRecord, CommonDocSearchForm,
                                          CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>>) {
        const apiId = docWriterServerModule.docServerModule.getApiId();
        const apiResolveParameterName = docWriterServerModule.docServerModule.getApiResolveParameterName();
        console.log('configure route ' + apiId + ':', apiPrefix + '/:locale' + '/' + apiId + 'write/:' + apiResolveParameterName);
        app.route(apiPrefix + '/:locale' + '/' + apiId + 'write')
            .all(function(req, res, next) {
                if (req.method !== 'POST') {
                    return next('not allowed');
                }
                return next();
            })
            .post(function(req, res, next) {
                const docSrc = req['body'];
                if (docSrc === undefined) {
                    console.log('create failed: no requestbody');
                    res.status(403);
                    res.json();
                    return next('not found');
                }

                docWriterServerModule.addRecord(docSrc).then(doc => {
                    if (doc === undefined) {
                        console.log('create not fullfilled: no result');
                        res.status(403);
                        res.json();
                        return next('not found');
                    }

                    res.json(doc.toSerializableJsonObj());
                    return next();
                }).catch(reason => {
                    console.error('createrequest not fullfilled:', reason);
                    res.status(403);
                    res.json();
                    return next('not found');
                });
            });
        app.route(apiPrefix + '/:locale' + '/' + apiId + 'write/:' + apiResolveParameterName)
            .all(function(req, res, next) {
                if (req.method === 'POST' || req.method === 'DEL') {
                    return next('not allowed');
                }
                return next();
            })
            .put(function(req, res, next) {
                const docSrc = req['body'];
                if (docSrc === undefined) {
                    console.log('update failed: no requestbody');
                    res.status(403);
                    res.json();
                    return next('not found');
                }

                docWriterServerModule.updateRecord(docSrc).then(doc => {
                    if (doc === undefined) {
                        console.log('update not fullfilled: doc not found');
                        res.status(403);
                        res.json();
                        return next();
                    }

                    res.json(doc.toSerializableJsonObj());
                    return next();
                }).catch(reason => {
                    console.error('updaterequest not fullfilled:', reason);
                    res.status(403);
                    res.json();
                    return next('not found');
                });
            });
        app.route(apiPrefix + '/:locale' + '/' + apiId + 'action')
            .all(function(req, res, next) {
                if (req.method === 'POST' || req.method === 'DEL') {
                    return next('not allowed');
                }
                return next();
            })
            .put(function(req, res, next) {
                const actionSrc = req['body'];
                if (actionSrc === undefined) {
                    console.log('actiontag failed: no requestbody');
                    res.status(403);
                    res.json();
                    return next('not found');
                }

                docWriterServerModule.doActionTag(actionSrc).then(doc => {
                    if (doc === undefined) {
                        console.log('actiontag not fullfilled: action not found');
                        res.status(403);
                        res.json();
                        return next();
                    }

                    res.json(doc.toSerializableJsonObj());
                    return next();
                }).catch(reason => {
                    console.error('actiontagrequest not fullfilled:', reason);
                    res.status(403);
                    res.json();
                    return next('not found');
                });
            });
    }

    public constructor(private docServerModule: CommonDocServerModule<R, F, S, D>,
                       protected responseMapper: GenericAdapterResponseMapper) {
        this.dataService = docServerModule.getDataService();
        this.mapper = this.dataService.getMapper(this.dataService.getBaseMapperName());
        this.adapter = this.dataService.getAdapterForMapper(this.dataService.getBaseMapperName());
        this.dataService.setWritable(true);
    }

    public updateRecord(docSrc: {}): Promise<R> {
        const doc: R = this.mapRecord(docSrc);
        if (doc === undefined) {
            return utils.reject('record not mapped: undefined');
        }
        if (doc.id === undefined || doc.id === '') {
            return utils.reject('record not mapped: no id');
        }

        return this.dataService.updateById(doc.id, doc);
    }

    public doActionTag(actionTagFormSrc: {}): Promise<R> {
        const actionTagForm = this.mapActionTagForm(actionTagFormSrc);
        if (actionTagForm === undefined) {
            return utils.reject('actionTagForm not mapped');
        }

        return this.dataService.getById(actionTagForm.recordId).then(doc => {
            if (doc === undefined) {
                return utils.reject('record not mapped: undefined');
            }
            if (doc.id === undefined || doc.id === '') {
                return utils.reject('record not mapped: no id');
            }

            return this.dataService.doActionTag(doc, actionTagForm);
        }).catch(reason => {
            return utils.reject('record not found: ' + reason);
        });
    }

    public addRecord(docSrc: {}): Promise<R> {
        const doc: R = this.mapRecord(docSrc);
        if (doc === undefined) {
            return utils.reject('record not mapped: undefined');
        }
        if (doc.id !== undefined && doc.id !== '') {
            return utils.reject('record not mapped: existing id');
        }

        return this.dataService.add(doc);
    }

    private mapRecord(docSrc: {}): R {
        return <R>this.responseMapper.mapResponseDocument(this.mapper, docSrc, {});
    }

    private mapActionTagForm(actiontTagFormSrc: {}): ActionTagForm {
        if (actiontTagFormSrc === undefined) {
            return undefined;
        }

        return {
            recordId: this.idValidationRule.sanitize(actiontTagFormSrc['recordId']),
            key: this.idValidationRule.sanitize(actiontTagFormSrc['key']),
            type: this.idValidationRule.sanitize(actiontTagFormSrc['type']),
            payload: actiontTagFormSrc['payload']
        };
    }
}
