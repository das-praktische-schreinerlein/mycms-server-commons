import {Router} from 'js-data-express';
import * as express from 'express';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {CommonDocSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import {CommonDocSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import {CommonDocDataService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import {
    CommonDocPlaylistExporter,
    CommonDocPlaylistExporterConfig
} from '@dps/mycms-commons/dist/search-commons/services/cdoc-playlist-exporter';

export abstract class CommonDocPlaylistServerModule<R extends CommonDocRecord, F extends CommonDocSearchForm,
    S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>> {
    public static configurePlaylistServerRoutes(app: express.Application, apiPrefix: string,
                                                cdocPlaylistServerModule: CommonDocPlaylistServerModule<CommonDocRecord,
                                                    CommonDocSearchForm,
                                                    CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>,
                                                    CommonDocDataService<CommonDocRecord, CommonDocSearchForm,
                                                        CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>>,
                                                backendConfig: {}) {
        // use own wrapper for search
        const exportConfig: CommonDocPlaylistExporterConfig = {
            maxAllowed: backendConfig['playlistExportMaxM3uRecordAllowed']
        };
        if (! (exportConfig.maxAllowed > 0)) {
            console.warn('SKIP route m3uplaylist NOT Enabled: playlistExportMaxM3uRecordAllowed=',
                exportConfig.maxAllowed);
            return;
        }

        console.log('configure route ' + cdocPlaylistServerModule.getApiId() + 'm3uplaylist:', apiPrefix + '/:locale/'
            + cdocPlaylistServerModule.getApiId() + 'm3uplaylist');
        app.route(apiPrefix + '/:locale/' + cdocPlaylistServerModule.getApiId() + 'm3uplaylist')
            .all(function(req, res, next) {
                if (req.method !== 'GET') {
                    return next('not allowed');
                }
                return next();
            })
            .get(function(req, res, next) {
                const searchForm = cdocPlaylistServerModule.getDataService().newSearchForm(req.query);
                if (!cdocPlaylistServerModule.isSearchFormValid(searchForm)) {
                    console.warn('form invalid');
                    res.text();
                    return next();
                }
                try {
                    cdocPlaylistServerModule.playlistExporter.exportPlaylist(exportConfig, searchForm).then(playlist => {
                        if (playlist === undefined) {
                            console.log('m3uplaylist not fullfilled');
                            res.status(403);
                            res.send('');
                            return next();
                        }

                        res.set({
                            'Content-Type': 'application/m3u',
                            'Content-Disposition': 'attachment; filename=playlist.m3u'
                        });
                        res.status(200);
                        res.send(playlist);
                        return next();
                    }).catch(reason => {
                        console.error('m3uplaylist not fullfilled:', reason);
                        res.status(403);
                        res.text('');
                        return next('not found');
                    });
                } catch (error) {
                    console.error('error thrown: ', error);
                    return next('not found');
                }
            });
    }

    public constructor(protected dataService: D, protected playlistExporter: CommonDocPlaylistExporter<R, F, S, D>) {
    }

    public abstract getApiId(): string;

    public getDataService(): D {
        return this.dataService;
    }
    public abstract isSearchFormValid(searchForm: CommonDocSearchForm): boolean;
}
