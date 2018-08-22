import {Router} from 'js-data-express';
import {GenericSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/generic-searchresult';
import {GenericSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-searchform';
import {BaseEntityRecord} from '@dps/mycms-commons/dist/search-commons/model/records/base-entity-record';
import {GenericSearchService} from '@dps/mycms-commons/dist/search-commons/services/generic-search.service';
import {utils} from 'js-data';

export interface RedirectConfig {
    perPage: number;
    srcUrlPathGenerator: any;
    redirectGenerator: any;
}

export class RedirectGeneratorModule {
    public static generateRedirectFiles(
        dataService: GenericSearchService<BaseEntityRecord, GenericSearchForm, GenericSearchResult<BaseEntityRecord, GenericSearchForm>>,
        redirectConfig: RedirectConfig, searchForm: GenericSearchForm) {

        searchForm.perPage = redirectConfig.perPage;
        searchForm.pageNum = 1;

        const redirects = {};
        const createNextRedirects = function(): Promise<any> {
            return dataService.search(searchForm).then(
                function searchDone(searchResult: GenericSearchResult<BaseEntityRecord, GenericSearchForm>) {
                    for (const doc of searchResult.currentRecords) {
                        for (const urlPath of redirectConfig.srcUrlPathGenerator(redirectConfig, doc)) {
                            redirects[urlPath] = redirectConfig.redirectGenerator(redirectConfig, doc);
                        }
                    }

                    searchForm.pageNum++;
                    if (searchForm.pageNum < (searchResult.recordCount / searchForm.perPage + 1)) {
                        return createNextRedirects();
                    } else {
                        console.log(JSON.stringify(redirects, null, ' '));
                        return utils.resolve('Well done :-)');
                    }
                }
            ).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return utils.reject(error);
            });
        };

        return createNextRedirects();
    }
}
