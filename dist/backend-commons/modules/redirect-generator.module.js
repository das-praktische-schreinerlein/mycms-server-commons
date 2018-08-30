"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var js_data_1 = require("js-data");
var RedirectGeneratorModule = /** @class */ (function () {
    function RedirectGeneratorModule() {
    }
    RedirectGeneratorModule.generateRedirectFiles = function (dataService, redirectConfig, searchForm) {
        searchForm.perPage = redirectConfig.perPage;
        searchForm.pageNum = 1;
        var redirects = {};
        var createNextRedirects = function () {
            return dataService.search(searchForm).then(function searchDone(searchResult) {
                for (var _i = 0, _a = searchResult.currentRecords; _i < _a.length; _i++) {
                    var doc = _a[_i];
                    for (var _b = 0, _c = redirectConfig.srcUrlPathGenerator(redirectConfig, doc); _b < _c.length; _b++) {
                        var urlPath = _c[_b];
                        redirects[urlPath] = redirectConfig.redirectGenerator(redirectConfig, doc);
                    }
                }
                searchForm.pageNum++;
                if (searchForm.pageNum < (searchResult.recordCount / searchForm.perPage + 1)) {
                    return createNextRedirects();
                }
                else {
                    console.log(JSON.stringify(redirects, null, ' '));
                    return js_data_1.utils.resolve('Well done :-)');
                }
            }).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return js_data_1.utils.reject(error);
            });
        };
        return createNextRedirects();
    };
    return RedirectGeneratorModule;
}());
exports.RedirectGeneratorModule = RedirectGeneratorModule;
//# sourceMappingURL=redirect-generator.module.js.map