"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CommonDocPlaylistServerModule = /** @class */ (function () {
    function CommonDocPlaylistServerModule(dataService, playlistExporter) {
        this.dataService = dataService;
        this.playlistExporter = playlistExporter;
    }
    CommonDocPlaylistServerModule.configurePlaylistServerRoutes = function (app, apiPrefix, cdocPlaylistServerModule, backendConfig) {
        // use own wrapper for search
        var exportConfig = {
            maxAllowed: backendConfig.playlistExportMaxM3uRecordAllowed
        };
        if (exportConfig.maxAllowed <= 0) {
            console.warn('SKIP route m3uplaylist NOT Enabled: playlistExportMaxM3uRecordAllowed=', exportConfig.maxAllowed);
            return;
        }
        console.log('configure route ' + cdocPlaylistServerModule.getApiId() + 'export/m3uplaylist:', apiPrefix + '/:locale/'
            + cdocPlaylistServerModule.getApiId() + 'export/m3uplaylist');
        app.route(apiPrefix + '/:locale/' + cdocPlaylistServerModule.getApiId() + 'export/m3uplaylist')
            .all(function (req, res, next) {
            if (req.method !== 'GET') {
                return next('not allowed');
            }
            return next();
        })
            .get(function (req, res, next) {
            var searchForm = cdocPlaylistServerModule.getDataService().newSearchForm(req.query);
            if (!cdocPlaylistServerModule.isSearchFormValid(searchForm)) {
                console.warn('form invalid');
                res.send('');
                return next();
            }
            try {
                cdocPlaylistServerModule.playlistExporter.exportPlaylist(exportConfig, searchForm).then(function (playlist) {
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
                }).catch(function (reason) {
                    console.error('m3uplaylist not fullfilled:', reason);
                    res.status(403);
                    return next('not found');
                });
            }
            catch (error) {
                console.error('error thrown: ', error);
                return next('not found');
            }
        });
    };
    CommonDocPlaylistServerModule.configureCsvPlaylistServerRoutes = function (app, apiPrefix, cdocPlaylistServerModule, backendConfig) {
        // use own wrapper for search
        var exportConfig = {
            maxAllowed: backendConfig.playlistExportMaxM3uRecordAllowed
        };
        if (exportConfig.maxAllowed <= 0) {
            console.warn('SKIP route csvplaylist NOT Enabled: playlistExportMaxM3uRecordAllowed=', exportConfig.maxAllowed);
            return;
        }
        console.log('configure route ' + cdocPlaylistServerModule.getApiId() + 'export/csvplaylist:', apiPrefix + '/:locale/'
            + cdocPlaylistServerModule.getApiId() + 'export/csvplaylist');
        app.route(apiPrefix + '/:locale/' + cdocPlaylistServerModule.getApiId() + 'export/csvplaylist')
            .all(function (req, res, next) {
            if (req.method !== 'GET') {
                return next('not allowed');
            }
            return next();
        })
            .get(function (req, res, next) {
            var searchForm = this.getDataService().newSearchForm(req.query);
            if (!cdocPlaylistServerModule.isSearchFormValid(searchForm)) {
                console.warn('form invalid');
                res.send('');
                return next();
            }
            try {
                cdocPlaylistServerModule.playlistExporter.exportCsvPlaylist(exportConfig, searchForm).then(function (playlist) {
                    if (playlist === undefined) {
                        console.log('csvplaylist not fullfilled');
                        res.status(403);
                        res.send('');
                        return next();
                    }
                    res.set({
                        'Content-Type': 'application/csv',
                        'Content-Disposition': 'attachment; filename=playlist.csv'
                    });
                    res.status(200);
                    res.send(playlist);
                    return next();
                }).catch(function (reason) {
                    console.error('csvplaylist not fullfilled:', reason);
                    res.status(403);
                    return next('not found');
                });
            }
            catch (error) {
                console.error('error thrown: ', error);
                return next('not found');
            }
        });
    };
    CommonDocPlaylistServerModule.prototype.getDataService = function () {
        return this.dataService;
    };
    return CommonDocPlaylistServerModule;
}());
exports.CommonDocPlaylistServerModule = CommonDocPlaylistServerModule;
//# sourceMappingURL=cdoc-playlist-server.module.js.map