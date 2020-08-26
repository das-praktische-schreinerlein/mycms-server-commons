import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {Mapper, utils} from 'js-data';
import {GenericAdapterResponseMapper} from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
import {CommonDocDataService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import {CommonDocSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import {CommonDocSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';

export class CommonDocTransportModule {
    public loadDocs(recordSrcs: any[], typeOrder: string[], responseMapper: GenericAdapterResponseMapper,
                    dataService: CommonDocDataService<CommonDocRecord, CommonDocSearchForm,
                        CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>): Promise<any> {
        const mapper: Mapper = dataService.getMapper(dataService.getBaseMapperName());
        const perRun = 1;
        let records = [];
        const recordsPerType = {};
        for (const docSrc of recordSrcs) {
            const doc: CommonDocRecord = <CommonDocRecord>responseMapper.mapResponseDocument(mapper, docSrc, {});
            const type = doc.type.toLowerCase();
            if (!recordsPerType.hasOwnProperty(type)) {
                recordsPerType[type] = [];
            }
            recordsPerType[type].push(doc);
        }
        for (const type of typeOrder) {
            if (recordsPerType[type]) {
                records = records.concat(recordsPerType[type]);
            }
        }

        const recordIdMapping = {};
        const recordRecoverIdMapping = {};

        let newRecords = [];
        const readUpdateOrInsert = function(start): Promise<any> {
            const chunk = records.slice(start, start + perRun);
            const promises = chunk.map(doc => {
                return dataService.importRecord(doc, recordIdMapping, recordRecoverIdMapping)
                    .then(function recordsDone(newDocRecord: CommonDocRecord) {
                        console.log('DONE - import newrecord', newDocRecord.id);
                        return utils.resolve(newDocRecord);
                    }).catch(function onError(error) {
                        console.error('error thrown while importRecord Doc: ', error);
                        return utils.reject(error);
                    });
            });
            const results = Promise.all(promises);

            return results.then(data => {
                newRecords = newRecords.concat(data);
                console.log('DONE - chunk pos:' + (start + 1) + '/' + records.length);
                if (start + perRun > records.length) {
                    console.log('DONE - load docs');
                    return utils.resolve('WELL DONE');
                } else {
                    return readUpdateOrInsert(start + perRun);
                }
            }).catch(errors => {
                console.error('error thrown: ', errors);
                return utils.reject(errors);
            });
        };

        let finishedRecords = [];
        const updateRecoverIds = function(start): Promise<any> {
            const chunk = newRecords.slice(start, start + perRun);
            const promises = chunk.map(doc => {
                return dataService.postProcessImportRecord(doc, recordIdMapping, recordRecoverIdMapping)
                    .then(function onDone(newDocRecord: CommonDocRecord) {
                        console.log('DONE - postprocess newrecord', newDocRecord.id);
                        return utils.resolve(newDocRecord);
                    }).catch(function onError(error) {
                        console.error('error thrown while postProcessImportRecord Doc: ', error);
                        return utils.reject(error);
                    });
            });
            const results = Promise.all(promises);

            return results.then(data => {
                finishedRecords = finishedRecords.concat(data);
                console.log('DONE - chunk pos:' + (start + 1) + '/' + records.length);
                if (start + perRun > records.length) {
                    console.log('DONE - postprocess docs', finishedRecords);
                    return utils.resolve('WELL DONE');
                } else {
                    return updateRecoverIds(start + perRun);
                }
            }).catch(errors => {
                console.error('error thrown: ', errors);
                return utils.reject(errors);
            });
        };

        return readUpdateOrInsert(0).then(function onFullFilled() {
            return updateRecoverIds(0);
        });
    }

    public exportDocs(typeOrder: string[], perRun: number, writerCallback: any, responseMapper: GenericAdapterResponseMapper,
                    dataService: CommonDocDataService<CommonDocRecord, CommonDocSearchForm,
                        CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>): Promise<any> {
        let first = true;
        const replacer = function(key, value) {
            if (value === null) {
                return undefined;
            }

            return value;
        };

        const exportSearchResultToJson = function(searchForm: CommonDocSearchForm): Promise<any> {
            return dataService.search(searchForm, {
                showFacets: false,
                showForm: false,
                loadDetailsMode: 'full',
                loadTrack: true}).then(
                function searchDone(searchResult: CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>) {
                    let output = '';
                    for (const doc of searchResult.currentRecords) {
                        output += (first ? '\n  ' : ',\n  ') + JSON.stringify(responseMapper.mapToAdapterDocument({}, doc), replacer);
                        first = false;
                    }
                    writerCallback(output);

                    console.log('DONE ' + searchForm.pageNum + ' from ' + (searchResult.recordCount / searchForm.perPage + 1)
                        + ' for: ' + searchResult.recordCount, searchForm);
                    searchForm.pageNum++;
                    if (searchForm.pageNum < (searchResult.recordCount / searchForm.perPage + 1)) {
                        return exportSearchResultToJson(searchForm);
                    } else {
                        return utils.resolve('DONE');
                    }
                }
            ).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return utils.reject(error);
            });
        };

        const exportTypeToJson = function(types: string[], nr: number): Promise<any> {
            if (nr >= types.length) {
                return utils.resolve('DONE');
            }

            const globSearchForm = dataService.newSearchForm({});
            globSearchForm.perPage = perRun;
            globSearchForm.pageNum = 1;
            globSearchForm.type = types[nr];
            globSearchForm.sort = 'forExport';

            console.log('DO export ' + nr, globSearchForm);
            return exportSearchResultToJson(globSearchForm).then(value => {
                return exportTypeToJson(types, nr + 1);
            }).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return utils.reject(error);
            });
        };

        return exportTypeToJson(typeOrder, 0);
    }
}
