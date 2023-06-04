"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pdoc_record_1 = require("@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record");
var PagesServerModule = /** @class */ (function () {
    function PagesServerModule() {
    }
    PagesServerModule.configureRoutes = function (app, apiPrefix, dataService, locale, profile) {
        var mapper = dataService.getMapper('pdoc');
        console.log('configure route pages:', apiPrefix + '/' + locale + '/pages');
        app.route(apiPrefix + '/' + locale + '/pages')
            .all(function (req, res, next) {
            if (req.method !== 'GET') {
                return next('not allowed');
            }
            return next();
        })
            .get(function (req, res, next) {
            try {
                mapper.findAll(undefined, {}).then(function searchDone(currentRecords) {
                    var result = [];
                    for (var _i = 0, currentRecords_1 = currentRecords; _i < currentRecords_1.length; _i++) {
                        var pdoc = currentRecords_1[_i];
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
                        var record = pdoc_record_1.PDocRecord.cloneToSerializeToJsonObj(pdoc, false);
                        result.push(record);
                    }
                    res.json(result);
                    return next();
                }).catch(function searchError(error) {
                    console.error('error thrown: ', error);
                    return next('not found');
                });
            }
            catch (error) {
                console.error('error thrown: ', error);
                return next('not found');
            }
        });
    };
    return PagesServerModule;
}());
exports.PagesServerModule = PagesServerModule;
//# sourceMappingURL=pages-server.module.js.map