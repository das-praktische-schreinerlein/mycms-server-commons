"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var generic_validator_util_1 = require("@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util");
var pdoc_searchform_1 = require("@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform");
var PDocExportManagerUtils = /** @class */ (function () {
    function PDocExportManagerUtils() {
    }
    PDocExportManagerUtils.createExportValidationRules = function () {
        return {
            exportDir: new generic_validator_util_1.SimpleFilePathValidationRule(false),
            exportName: new generic_validator_util_1.SimpleFilePathValidationRule(false),
            ignoreErrors: new generic_validator_util_1.NumberValidationRule(false, 1, 999999999, 10),
            parallel: new generic_validator_util_1.NumberValidationRule(false, 1, 99, 10),
            force: new generic_validator_util_1.WhiteListValidationRule(false, [true, false, 'true', 'false'], false)
        };
    };
    PDocExportManagerUtils.createPDocSearchFormValidationRules = function () {
        return {
            pageNum: new generic_validator_util_1.NumberValidationRule(false, 1, 999999999, 1),
            subtype: new generic_validator_util_1.IdCsvValidationRule(false),
            langkeys: new generic_validator_util_1.IdCsvValidationRule(false),
            profiles: new generic_validator_util_1.IdCsvValidationRule(false),
            fulltext: new generic_validator_util_1.SolrValidationRule(false)
        };
    };
    PDocExportManagerUtils.createPDocSearchForm = function (type, argv) {
        var pageNum = Number.parseInt(argv['pageNum'], 10);
        var subtype = argv['subtype'];
        var langkeys = argv['langkeys'];
        var profiles = argv['profiles'];
        var fulltext = argv['fulltext'];
        var searchForm = new pdoc_searchform_1.PDocSearchForm({
            type: type,
            subtype: subtype,
            langkeys: langkeys,
            profiles: profiles,
            fulltext: fulltext,
            sort: 'forExport',
            pageNum: Number.isInteger(pageNum) ? pageNum : 1
        });
        return Promise.resolve(searchForm);
    };
    return PDocExportManagerUtils;
}());
exports.PDocExportManagerUtils = PDocExportManagerUtils;
//# sourceMappingURL=pdoc-export-manager.utils.js.map