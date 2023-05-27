"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var staticpages_data_store_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.store");
var searchparameter_utils_1 = require("@dps/mycms-commons/dist/search-commons/services/searchparameter.utils");
var staticpages_data_service_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.service");
var pdoc_inmemory_adapter_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-inmemory.adapter");
var pdoc_file_utils_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-file.utils");
var fs = require("fs");
var marked = require("marked");
var htmlToText = require("html-to-text");
var pdoc_adapter_response_mapper_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper");
var PagesDataserviceModule = /** @class */ (function () {
    function PagesDataserviceModule() {
    }
    PagesDataserviceModule.getDataService = function (profile, backendConfig, locale) {
        marked.setOptions({
            gfm: true,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: true
        });
        if (!this.dataServices.has(profile)) {
            this.dataServices.set(profile, PagesDataserviceModule.createDataService(backendConfig, locale));
        }
        return this.dataServices.get(profile);
    };
    PagesDataserviceModule.createDataService = function (backendConfig, locale) {
        if (!backendConfig.filePathPagesJson) {
            if (backendConfig.filePathPDocJson) {
                return this.createLegacyDataService(backendConfig, locale);
            }
            throw new Error('for PagesDataserviceModule no filePathPagesJson OR filePathPDocJson is configured');
        }
        // configure store
        var dataStore = new staticpages_data_store_1.StaticPagesDataStore(new searchparameter_utils_1.SearchParameterUtils());
        var responseMapper = new pdoc_adapter_response_mapper_1.PDocAdapterResponseMapper(backendConfig);
        var dataService = new staticpages_data_service_1.StaticPagesDataService(dataStore);
        var mapper = dataService.getMapper(dataService.getBaseMapperName());
        var fileName = backendConfig.filePathPagesJson.replace('.pdocsexport.json', '-' + locale + '.pdocsexport.json');
        var recordSrcs = pdoc_file_utils_1.PDocFileUtils.parseRecordSourceFromJson(fs.readFileSync(fileName, { encoding: 'utf8' }));
        var docs = [];
        for (var _i = 0, recordSrcs_1 = recordSrcs; _i < recordSrcs_1.length; _i++) {
            var docSrc = recordSrcs_1[_i];
            var doc = responseMapper.mapResponseDocument(mapper, docSrc, {});
            PagesDataserviceModule.remapRecord(doc);
            docs.push(doc);
        }
        dataService.setWritable(true);
        dataService.addMany(docs).then(function doneAddMany(records) {
            console.log('loaded pdocs from assets', records);
        }, function errorCreate(reason) {
            console.warn('loading pdocs failed:', reason);
        });
        dataService.setWritable(false);
        // configure dummy-adapter
        var options = {};
        var adapter = new pdoc_inmemory_adapter_1.PDocInMemoryAdapter(options);
        dataStore.setAdapter('inmemory', adapter, '', {});
        return dataService;
    };
    PagesDataserviceModule.createLegacyDataService = function (backendConfig, locale) {
        // configure store
        var dataStore = new staticpages_data_store_1.StaticPagesDataStore(new searchparameter_utils_1.SearchParameterUtils());
        var dataService = new staticpages_data_service_1.StaticPagesDataService(dataStore);
        var fileName = backendConfig.filePathPDocJson.replace('.json', '-' + locale + '.json');
        var docs = JSON.parse(fs.readFileSync(fileName, { encoding: 'utf8' })).pdocs;
        for (var _i = 0, docs_1 = docs; _i < docs_1.length; _i++) {
            var doc = docs_1[_i];
            PagesDataserviceModule.remapRecord(doc);
        }
        dataService.setWritable(true);
        dataService.addMany(docs).then(function doneAddMany(records) {
            console.log('loaded pdocs from assets', records);
        }, function errorCreate(reason) {
            console.warn('loading pdocs failed:', reason);
        });
        dataService.setWritable(false);
        // configure dummy-adapter
        var options = {};
        var adapter = new pdoc_inmemory_adapter_1.PDocInMemoryAdapter(options);
        dataStore.setAdapter('inmemory', adapter, '', {});
        return dataService;
    };
    PagesDataserviceModule.remapRecord = function (doc) {
        if (!doc['descHtml']) {
            doc['descHtml'] = marked(doc['descMd']);
        }
        if (!doc['descTxt']) {
            doc['descTxt'] = htmlToText.fromString(doc['descHtml'], {
                wordwrap: 80
            });
        }
        // remap id by key
        if (doc['key']) {
            doc['id'] = doc['key'];
        }
    };
    PagesDataserviceModule.dataServices = new Map();
    return PagesDataserviceModule;
}());
exports.PagesDataserviceModule = PagesDataserviceModule;
//# sourceMappingURL=pages-dataservice.module.js.map