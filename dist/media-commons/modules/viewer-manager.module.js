"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise_serial = require("promise-serial");
var file_utils_1 = require("@dps/mycms-commons/dist/commons/utils/file.utils");
var fs = require("fs");
var path = require("path");
var process_utils_1 = require("@dps/mycms-commons/dist/commons/utils/process.utils");
var ViewerManagerModule = /** @class */ (function () {
    function ViewerManagerModule() {
    }
    ViewerManagerModule.prototype.inlineDataOnViewerFile = function (nodePath, inlineCommandPath, srcHtmlFile, destFile) {
        return process_utils_1.ProcessUtils.executeCommandAsync(nodePath, ['--max-old-space-size=8192',
            inlineCommandPath,
            srcHtmlFile,
            destFile,
            'inlineexport'], function (buffer) {
            if (!buffer) {
                return;
            }
            console.log(buffer.toString());
        }, function (buffer) {
            if (!buffer) {
                return;
            }
            console.error(buffer.toString());
        }).then(function (code) {
            if (code !== 0) {
                return Promise.reject('inlining ' + srcHtmlFile + ' failed returnCode:' + code);
            }
            return Promise.resolve('inlining ' + srcHtmlFile + ' succeeded returnCode:' + code);
        }).catch(function (error) {
            return Promise.reject('inlining ' + srcHtmlFile + ' failed error:' + error);
        });
    };
    ViewerManagerModule.prototype.generateViewerHtmlFile = function (srcHtmlFile, jsonExportFiles, targetHtmlFile, chunkSize, parent, htmlConfigConverter, jsonToJsTargetContentConverter, htmlInlineFileConverter) {
        var me = this;
        console.log('copy htmlViewer and inline json', srcHtmlFile, targetHtmlFile, jsonExportFiles);
        return file_utils_1.FileUtils.copyFile(srcHtmlFile, targetHtmlFile, false, false, true, false)
            .then(function () {
            var html = '';
            try {
                html = fs.readFileSync(targetHtmlFile, { encoding: 'utf8' });
            }
            catch (err) {
                return Promise.reject(err);
            }
            if (htmlConfigConverter) {
                html = htmlConfigConverter.call(me, html);
            }
            var promises = [];
            var _loop_1 = function (jsonExportFile) {
                var jsonDestDir = path.dirname(jsonExportFile);
                var jsonBaseFile = path.basename(jsonExportFile).replace(path.extname(jsonExportFile), '');
                promises.push(function () {
                    return file_utils_1.FileUtils.deleteFilesInDirectoryByPattern(jsonDestDir + '/' + jsonBaseFile, '.js')
                        .then(function () {
                        console.log('split jsonExportFile', jsonExportFile);
                        return file_utils_1.FileUtils.splitJsonFile(jsonExportFile, jsonDestDir + '/' + jsonBaseFile, '.js', chunkSize, parent, jsonToJsTargetContentConverter);
                    }).then(function (files) {
                        if (htmlInlineFileConverter) {
                            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                                var file = files_1[_i];
                                html = htmlInlineFileConverter.call(me, html, file);
                            }
                        }
                        return Promise.resolve(files);
                    });
                });
            };
            for (var _i = 0, jsonExportFiles_1 = jsonExportFiles; _i < jsonExportFiles_1.length; _i++) {
                var jsonExportFile = jsonExportFiles_1[_i];
                _loop_1(jsonExportFile);
            }
            return Promise_serial(promises, { parallelize: 1 }).then(function (files) {
                try {
                    console.log('write target with inlined files', targetHtmlFile, files);
                    fs.writeFileSync(targetHtmlFile, html);
                }
                catch (err) {
                    return Promise.reject(err);
                }
                return Promise.resolve(targetHtmlFile);
            }).catch(function (reason) {
                return Promise.reject(reason);
            });
        }).catch(function (reason) {
            return Promise.reject(reason);
        });
    };
    ViewerManagerModule.prototype.fullJsonToJsTargetContentConverter = function (result, jsonPFileName, jsonPName) {
        result = result.replace(/([`\\])/g, '\\$1');
        return "window." + jsonPName + " = `\n"
            + result
            + "`;\nvar script = document.createElement(\"script\");\nscript.type='application/json';\nscript.id = '" + jsonPFileName + ("';\nvar text = document.createTextNode(" + jsonPName + ");\nscript.appendChild(text);\ndocument.head.appendChild(script);");
    };
    ;
    ViewerManagerModule.prototype.jsonToJsTargetContentConverter = function (result, jsonPFileName, jsonPName) {
        return this.fullJsonToJsTargetContentConverter(result, path.basename(jsonPFileName), jsonPName);
    };
    ;
    ViewerManagerModule.prototype.htmlConfigConverter = function (html, dataFileConfigName) {
        // removing samples from config
        var regExp = new RegExp(dataFileConfigName + '": \\[.*"tracksBaseUrl', 'g');
        html = html.replace(regExp, dataFileConfigName + '": ["assets/staticdata/samples-static.mytbtdocs_videos_export_chunk0.js"], "tracksBaseUrl');
        // configure assets-path
        html = html.replace(/"tracksBaseUrl": .* "videoBaseUrl": "assets\/staticdata\/"/, '"tracksBaseUrl": "./tracks/",    "picsBaseUrl": "./",    "videoBaseUrl": "./"');
        html = html.replace(/"audioBaseUrl": .* "videoBaseUrl": "assets\/staticdata\/"/, '"audioBaseUrl": "./",    "picsBaseUrl": "./",    "videoBaseUrl": "./"');
        return html;
    };
    ;
    ViewerManagerModule.prototype.htmlInlineFileConverter = function (html, jsonPFilePath, dataFileConfigName) {
        var fileName = path.basename(jsonPFilePath);
        html = html.replace(/<\/head>/g, '\n  <script inlineexport type="text/javascript" src="' + fileName + '"></script>\n</head>');
        var regExp = new RegExp(dataFileConfigName + '": \\[', 'g');
        html = html.replace(regExp, dataFileConfigName + '": ["' + fileName + '", ');
        return html;
    };
    return ViewerManagerModule;
}());
exports.ViewerManagerModule = ViewerManagerModule;
//# sourceMappingURL=viewer-manager.module.js.map