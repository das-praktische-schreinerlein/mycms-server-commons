import {StaticPagesDataService} from '@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.service';
import express from 'express';
import {PDocRecord} from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';

export class PagesServerModule {
    public static configureRoutes(app: express.Application, apiPrefix: string, dataService: StaticPagesDataService, locale: string, profile: string) {
        const mapper = dataService.getMapper('pdoc');

        console.log('configure route pages:', apiPrefix + '/' + locale + '/pages');
        app.route(apiPrefix + '/' + locale + '/pages')
            .all(function(req, res, next) {
                if (req.method !== 'GET') {
                    return next('not allowed');
                }
                return next();
            })
            .get(function(req, res, next) {
                try {
                    mapper.findAll(undefined, {}).then(
                        function searchDone(currentRecords: PDocRecord[]) {
                            const result = [];
                            for (const pdoc of currentRecords) {
                                if (pdoc.profiles.indexOf('profile_' + profile) < 0) {
                                    console.log('IGNORED pdoc because of missing profile key:' + pdoc.key
                                        + ' profile:' + profile
                                        + ' configured:' + pdoc.profiles);
                                    continue;
                                }
                                if (pdoc.langkeys.indexOf('lang_' + locale) < 0) {
                                    console.log('IGNORED pdoc because of missing langkey:' + pdoc.key
                                        + ' profile:' + locale
                                        + ' configured:' + pdoc.langkeys);
                                    continue;
                                }

                                // TODO filter by permission if there is a user

                                const record = PDocRecord.cloneToSerializeToJsonObj(pdoc, false);

                                result.push(record);
                            }

                            res.json(result);

                            return next();
                        }
                    ).catch(
                        function searchError(error) {
                            console.error('error thrown: ', error);
                            return next('not found');
                        }
                    );
                } catch (error) {
                    console.error('error thrown: ', error);
                    return next('not found');
                }
            });
    }
}
