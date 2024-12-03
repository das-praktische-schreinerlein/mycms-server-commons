"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CommonDocPdfResultListDecorator = /** @class */ (function () {
    function CommonDocPdfResultListDecorator() {
    }
    CommonDocPdfResultListDecorator.prototype.generatePdfResultListLstEntry = function (generateResult) {
        var fileName = generateResult.exportFileEntry;
        var name = generateResult.record.name;
        var rtype = generateResult.record.type;
        return [fileName, name, rtype, ''].join('\t');
    };
    CommonDocPdfResultListDecorator.prototype.generatePdfResultListHtmlEntry = function (generateResult) {
        var fileName = generateResult.exportFileEntry;
        var name = generateResult.record.name;
        var rtype = generateResult.record.type;
        return "<div class='bookmark_line bookmark_line_$rtype'><div class='bookmark_file'><a href=\"$fileName\" target=\"_blank\">$fileName</a></div><div class='bookmark_name'><a href=\"$fileName\" target=\"_blank\">$name</a></div><div class='bookmark_page'></div></div>"
            .replace(/\$fileName/g, fileName)
            .replace(/\$name/g, name)
            .replace(/\$rtype/g, rtype);
    };
    return CommonDocPdfResultListDecorator;
}());
exports.CommonDocPdfResultListDecorator = CommonDocPdfResultListDecorator;
//# sourceMappingURL=cdoc-pdf-resultlist-decorator.js.map