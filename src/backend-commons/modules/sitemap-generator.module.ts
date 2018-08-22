import {Router} from 'js-data-express';
import sm from 'sitemap';
import * as fs from 'fs';
import {GenericSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/generic-searchresult';
import {GenericSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-searchform';
import {BaseEntityRecord} from '@dps/mycms-commons/dist/search-commons/model/records/base-entity-record';
import {GenericSearchService} from '@dps/mycms-commons/dist/search-commons/services/generic-search.service';
import {utils} from 'js-data';

export interface SitemapConfig {
    sitemapBaseUrl: string;
    showBaseUrl: string;
    locale: string;
    fileDir: string;
    fileBase: string;
    perPage: number;
    urlGenerator: any;
    sdocSearchForm: {};
}

export class SitemapGeneratorModule {
    public static generateSiteMapFiles(
        dataService: GenericSearchService<BaseEntityRecord, GenericSearchForm, GenericSearchResult<BaseEntityRecord, GenericSearchForm>>,
        sitemapConfig: SitemapConfig, searchForm: GenericSearchForm) {

        searchForm.perPage = sitemapConfig.perPage;
        searchForm.pageNum = 1;
        const pDocSiteMaps = [];

        const createSitemapIndex = function(): Promise<any> {
            const sitemapIndex = sm.buildSitemapIndex({
                urls: pDocSiteMaps
            });
            const fileName = sitemapConfig.fileBase + sitemapConfig.locale + '.xml';
            fs.writeFileSync(sitemapConfig.fileDir + fileName, sitemapIndex.toString());
            return utils.resolve('WELL DONE');
        };
        const createNextSitemap = function(): Promise<any> {
            return dataService.search(searchForm).then(
                function searchDone(searchResult: GenericSearchResult<BaseEntityRecord, GenericSearchForm>) {
                    const urls = [];
                    for (const doc of searchResult.currentRecords) {
                        for (const url of sitemapConfig.urlGenerator(sitemapConfig, doc)) {
                            urls.push(url);
                        }
                    }

                    const sitemap = sm.createSitemap({
                        urls: urls
                    });

                    const fileName = sitemapConfig.fileBase + sitemapConfig.locale + '_' + searchForm.pageNum + '.xml';
                    fs.writeFileSync(sitemapConfig.fileDir + fileName, sitemap.toString());
                    searchForm.pageNum++;
                    pDocSiteMaps.push(sitemapConfig.sitemapBaseUrl + fileName);
                    if (searchForm.pageNum < (searchResult.recordCount / searchForm.perPage + 1)) {
                        return createNextSitemap();
                    } else {
                        return createSitemapIndex();
                    }
                }
            ).catch(function searchError(error) {
                    console.error('error thrown: ', error);
                    return utils.reject(error);
            });
        };

        return createNextSitemap();
    }
}
