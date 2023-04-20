"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pdoc_record_1 = require("@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record");
var PagesServerModule = /** @class */ (function () {
    function PagesServerModule() {
    }
    PagesServerModule.configureRoutes = function (app, apiPrefix, dataService, locale) {
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
                    for (var i = 0; i < currentRecords.length; i++) {
                        var record = pdoc_record_1.PDocRecord.cloneToSerializeToJsonObj(currentRecords[i], false);
                        // TODO filter by locale
                        // TODO filter by profile
                        // TODO filter by permission if there is a user
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