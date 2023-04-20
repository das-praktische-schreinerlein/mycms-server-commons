"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var staticpages_data_store_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.store");
var searchparameter_utils_1 = require("@dps/mycms-commons/dist/search-commons/services/searchparameter.utils");
var staticpages_data_service_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.service");
var pdoc_inmemory_adapter_1 = require("@dps/mycms-commons/dist/pdoc-commons/services/pdoc-inmemory.adapter");
var fs = require("fs");
var marked = require("marked");
var htmlToText = require("html-to-text");
var PagesDataserviceModule = /** @class */ (function () {
    function PagesDataserviceModule() {
    }
    PagesDataserviceModule.getDataService = function (profile, backendConfig, locale) {
        if (!this.dataServices.has(profile)) {
            this.dataServices.set(profile, PagesDataserviceModule.createDataService(backendConfig, locale));
        }
        return this.dataServices.get(profile);
    };
    PagesDataserviceModule.createDataService = function (backendConfig, locale) {
        // configure store
        var dataStore = new staticpages_data_store_1.StaticPagesDataStore(new searchparameter_utils_1.SearchParameterUtils());
        var dataService = new staticpages_data_service_1.StaticPagesDataService(dataStore);
        marked.setOptions({
            gfm: true,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: true
        });
        var fileName = backendConfig.filePathPDocJson.replace('.json', '-' + locale + '.json');
        var docs = JSON.parse(fs.readFileSync(fileName, { encoding: 'utf8' })).pdocs;
        for (var _i = 0, docs_1 = docs; _i < docs_1.length; _i++) {
            var doc = docs_1[_i];
            if (!doc['descHtml']) {
                doc['descHtml'] = marked(doc['descMd']);
            }
            if (!doc['descTxt']) {
                doc['descTxt'] = htmlToText.fromString(doc['descHtml'], {
                    wordwrap: 80
                });
            }
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
    PagesDataserviceModule.dataServices = new Map();
    return PagesDataserviceModule;
}());
exports.PagesDataserviceModule = PagesDataserviceModule;
//# sourceMappingURL=pages-dataservice.module.js.map