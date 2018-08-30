"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var js_data_1 = require("js-data");
var CommonDocTransportModule = /** @class */ (function () {
    function CommonDocTransportModule() {
    }
    CommonDocTransportModule.prototype.loadDocs = function (recordSrcs, typeOrder, responseMapper, dataService) {
        var mapper = dataService.getMapper(dataService.getBaseMapperName());
        var perRun = 1;
        var records = [];
        var recordsPerType = {};
        for (var _i = 0, recordSrcs_1 = recordSrcs; _i < recordSrcs_1.length; _i++) {
            var docSrc = recordSrcs_1[_i];
            var doc = responseMapper.mapResponseDocument(mapper, docSrc, {});
            var type = doc.type.toLowerCase();
            if (!recordsPerType.hasOwnProperty(type)) {
                recordsPerType[type] = [];
            }
            recordsPerType[type].push(doc);
        }
        for (var _a = 0, typeOrder_1 = typeOrder; _a < typeOrder_1.length; _a++) {
            var type = typeOrder_1[_a];
            if (recordsPerType[type]) {
                records = records.concat(recordsPerType[type]);
            }
        }
        var recordIdMapping = {};
        var recordRecoverIdMapping = {};
        var newRecords = [];
        var readUpdateOrInsert = function (start) {
            var chunk = records.slice(start, start + perRun);
            var promises = chunk.map(function (doc) {
                return dataService.importRecord(doc, recordIdMapping, recordRecoverIdMapping)
                    .then(function recordsDone(newDocRecord) {
                    console.log('DONE - import newrecord', newDocRecord.id);
                    return js_data_1.utils.resolve(newDocRecord);
                }).catch(function onError(error) {
                    console.error('error thrown while importRecord Doc: ', error);
                    return js_data_1.utils.reject(error);
                });
            });
            var results = Promise.all(promises);
            return results.then(function (data) {
                newRecords = newRecords.concat(data);
                console.log('DONE - chunk pos:' + (start + 1) + '/' + records.length);
                if (start + perRun > records.length) {
                    console.log('DONE - load docs');
                    return js_data_1.utils.resolve('WELL DONE');
                }
                else {
                    return readUpdateOrInsert(start + perRun);
                }
            }).catch(function (errors) {
                console.error('error thrown: ', errors);
                return js_data_1.utils.reject(errors);
            });
        };
        var finishedRecords = [];
        var updateRecoverIds = function (start) {
            var chunk = newRecords.slice(start, start + perRun);
            var promises = chunk.map(function (doc) {
                return dataService.postProcessImportRecord(doc, recordIdMapping, recordRecoverIdMapping)
                    .then(function onDone(newDocRecord) {
                    console.log('DONE - postprocess newrecord', newDocRecord.id);
                    return js_data_1.utils.resolve(newDocRecord);
                }).catch(function onError(error) {
                    console.error('error thrown while postProcessImportRecord Doc: ', error);
                    return js_data_1.utils.reject(error);
                });
            });
            var results = Promise.all(promises);
            return results.then(function (data) {
                finishedRecords = finishedRecords.concat(data);
                console.log('DONE - chunk pos:' + (start + 1) + '/' + records.length);
                if (start + perRun > records.length) {
                    console.log('DONE - postprocess docs', finishedRecords);
                    return js_data_1.utils.resolve('WELL DONE');
                }
                else {
                    return updateRecoverIds(start + perRun);
                }
            }).catch(function (errors) {
                console.error('error thrown: ', errors);
                return js_data_1.utils.reject(errors);
            });
        };
        return readUpdateOrInsert(0).then(function onFullFilled() {
            return updateRecoverIds(0);
        });
    };
    CommonDocTransportModule.prototype.exportDocs = function (typeOrder, perRun, writerCallback, responseMapper, dataService) {
        var first = true;
        var replacer = function (key, value) {
            if (value === null) {
                return undefined;
            }
            return value;
        };
        var exportSearchResultToJson = function (searchForm) {
            return dataService.search(searchForm, {
                showFacets: false,
                showForm: false,
                loadDetailsMode: 'full',
                loadTrack: true
            }).then(function searchDone(searchResult) {
                var output = '';
                for (var _i = 0, _a = searchResult.currentRecords; _i < _a.length; _i++) {
                    var doc = _a[_i];
                    output += (first ? '\n  ' : ',\n  ') + JSON.stringify(responseMapper.mapToAdapterDocument({}, doc), replacer);
                    first = false;
                }
                writerCallback(output);
                console.log('DONE ' + searchForm.pageNum + ' from ' + (searchResult.recordCount / searchForm.perPage + 1)
                    + ' for: ' + searchResult.recordCount, searchForm);
                searchForm.pageNum++;
                if (searchForm.pageNum < (searchResult.recordCount / searchForm.perPage + 1)) {
                    return exportSearchResultToJson(searchForm);
                }
                else {
                    return js_data_1.utils.resolve('DONE');
                }
            }).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return js_data_1.utils.reject(error);
            });
        };
        var exportTypeToJson = function (types, nr) {
            if (nr >= types.length) {
                return js_data_1.utils.resolve('DONE');
            }
            var globSearchForm = dataService.newSearchForm({});
            globSearchForm.perPage = perRun;
            globSearchForm.pageNum = 1;
            globSearchForm.type = types[nr];
            globSearchForm.sort = 'forExport';
            console.log('DO export ' + nr, globSearchForm);
            return exportSearchResultToJson(globSearchForm).then(function (value) {
                return exportTypeToJson(types, nr + 1);
            }).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return js_data_1.utils.reject(error);
            });
        };
        return exportTypeToJson(typeOrder, 0);
    };
    return CommonDocTransportModule;
}());
exports.CommonDocTransportModule = CommonDocTransportModule;
//# sourceMappingURL=cdoc-transport.module.js.map