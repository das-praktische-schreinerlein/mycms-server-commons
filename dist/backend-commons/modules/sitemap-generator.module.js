"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sm = require("sitemap");
var fs = require("fs");
var js_data_1 = require("js-data");
var SitemapGeneratorModule = /** @class */ (function () {
    function SitemapGeneratorModule() {
    }
    SitemapGeneratorModule.generateSiteMapFiles = function (dataService, sitemapConfig, searchForm) {
        searchForm.perPage = sitemapConfig.perPage;
        searchForm.pageNum = 1;
        var pDocSiteMaps = [];
        var createSitemapIndex = function () {
            var sitemapIndex = sm.buildSitemapIndex({
                urls: pDocSiteMaps
            });
            var fileName = sitemapConfig.fileBase + sitemapConfig.locale + '.xml';
            fs.writeFileSync(sitemapConfig.fileDir + fileName, sitemapIndex.toString());
            return js_data_1.utils.resolve('WELL DONE');
        };
        var createNextSitemap = function () {
            return dataService.search(searchForm).then(function searchDone(searchResult) {
                var urls = [];
                for (var _i = 0, _a = searchResult.currentRecords; _i < _a.length; _i++) {
                    var doc = _a[_i];
                    for (var _b = 0, _c = sitemapConfig.urlGenerator(sitemapConfig, doc); _b < _c.length; _b++) {
                        var url = _c[_b];
                        urls.push(url);
                    }
                }
                var sitemap = sm.createSitemap({
                    urls: urls
                });
                var fileName = sitemapConfig.fileBase + sitemapConfig.locale + '_' + searchForm.pageNum + '.xml';
                fs.writeFileSync(sitemapConfig.fileDir + fileName, sitemap.toString());
                searchForm.pageNum++;
                pDocSiteMaps.push(sitemapConfig.sitemapBaseUrl + fileName);
                if (searchForm.pageNum < (searchResult.recordCount / searchForm.perPage + 1)) {
                    return createNextSitemap();
                }
                else {
                    return createSitemapIndex();
                }
            }).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return js_data_1.utils.reject(error);
            });
        };
        return createNextSitemap();
    };
    return SitemapGeneratorModule;
}());
exports.SitemapGeneratorModule = SitemapGeneratorModule;
//# sourceMappingURL=sitemap-generator.module.js.map