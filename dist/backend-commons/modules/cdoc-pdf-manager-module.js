"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var process_utils_1 = require("@dps/mycms-commons/dist/commons/utils/process.utils");
var CommonDocPdfManagerModule = /** @class */ (function () {
    function CommonDocPdfManagerModule(dataService, backendConfig) {
        this.dataService = dataService;
        this.backendConfig = backendConfig;
        this.nodePath = this.backendConfig.nodejsBinaryPath;
        this.webshot2pdfCommandPath = this.backendConfig.webshot2pdfCommandPath;
        if (!this.nodePath || !this.webshot2pdfCommandPath) {
            console.error('CommonDocPdfManagerModule missing config - nodejsBinaryPath, webshot2pdfCommandPath', this.nodePath, this.webshot2pdfCommandPath);
            throw new Error('CommonDocPdfManagerModule missing config - nodejsBinaryPath, webshot2pdfCommandPath');
        }
        console.log('CommonDocPdfManagerModule starting with - nodejsBinaryPath, webshot2pdfCommandPath', this.nodePath, this.webshot2pdfCommandPath);
    }
    CommonDocPdfManagerModule.prototype.generatePdfs = function (action, generateDir, generateName, baseUrl, queryParams, processingOptions, searchForm, force) {
        var _this = this;
        var me = this;
        if (baseUrl === undefined || baseUrl === '') {
            console.error(action + ' missing parameter baseUrl');
            return Promise.reject(action + ' missing parameter baseUrl');
        }
        if (generateDir === undefined) {
            console.error(action + ' missing parameter generateDir');
            return Promise.reject(action + ' missing parameter generateDir');
        }
        if (generateName === undefined) {
            console.error(action + ' missing parameter generateName');
            return Promise.reject(action + ' missing parameter generateName');
        }
        if (!fs.existsSync(generateDir)) {
            return Promise.reject('apiRoutePdfsStaticDir not exists: ' + generateDir);
        }
        if (!fs.lstatSync(generateDir).isDirectory()) {
            return Promise.reject('apiRoutePdfsStaticDir is no directory: ' + generateDir);
        }
        processingOptions.parallel = Number.isInteger(processingOptions.parallel) ? processingOptions.parallel : 1;
        var generateResults = [];
        var generateCallback = function (mdoc) {
            return [
                me.generatePdf(mdoc, action, generateDir, baseUrl, queryParams, force).then(function (generateResult) {
                    generateResults.push(generateResult);
                    return Promise.resolve(generateResult);
                })
            ];
        };
        return this.dataService.batchProcessSearchResult(searchForm, generateCallback, {
            loadDetailsMode: undefined,
            loadTrack: false,
            showFacets: false,
            showForm: false
        }, processingOptions).then(function () {
            return _this.generatePdfResultListFile(generateDir, generateName, generateResults);
        });
    };
    CommonDocPdfManagerModule.prototype.generatePdf = function (mdoc, action, generateDir, baseUrl, queryParams, force) {
        var _this = this;
        var me = this;
        var url = this.generateWebShotUrl(action, baseUrl, mdoc, queryParams);
        var fileName = mdoc['pdfFile'] !== undefined && mdoc['pdfFile'].length > 5
            ? mdoc['pdfFile']
            : this.generatePdfFileName(mdoc);
        var relDestPath = mdoc.type
            + '/'
            + fileName;
        var absDestPath = generateDir
            + '/'
            + relDestPath;
        var generateResult;
        return new Promise(function (resolve, reject) {
            if (!force && fs.existsSync(absDestPath)) {
                var msg = 'SKIPPED - webshot2pdf url: "' + url + '" file: "' + absDestPath + '" file already exists';
                console.log(msg);
                generateResult = {
                    record: mdoc,
                    exportFileEntry: relDestPath,
                    externalRecordFieldMappings: undefined,
                    mediaFileMappings: undefined
                };
                if (mdoc['pdfFile'] !== fileName) {
                    return _this.updatePdfEntity(mdoc, fileName).then(function () {
                        resolve(generateResult);
                    }).catch(function (err) {
                        reject(err);
                    });
                }
                return resolve(generateResult);
            }
            return process_utils_1.ProcessUtils.executeCommandAsync(_this.nodePath, ['--max-old-space-size=8192',
                _this.webshot2pdfCommandPath,
                url,
                absDestPath], function (buffer) {
                if (!buffer) {
                    return;
                }
                console.log(buffer.toString(), me.webshot2pdfCommandPath, url, absDestPath);
            }, function (buffer) {
                if (!buffer) {
                    return;
                }
                console.error(buffer.toString());
            }).then(function (code) {
                if (code !== 0) {
                    var errMsg = 'FAILED - webshot2pdf url: "' + url + '"' +
                        ' file: "' + absDestPath + '" failed returnCode:' + code;
                    console.warn(errMsg);
                    return reject(errMsg);
                }
                var msg = 'SUCCESS - webshot2pdf url: "' + url + '"' +
                    ' file: "' + absDestPath + '" succeeded returnCode:' + code;
                console.log(msg);
                generateResult = {
                    record: mdoc,
                    exportFileEntry: relDestPath,
                    externalRecordFieldMappings: undefined,
                    mediaFileMappings: undefined
                };
                if (mdoc['pdfFile'] !== fileName) {
                    return me.updatePdfEntity(mdoc, fileName).then(function () {
                        resolve(generateResult);
                    }).catch(function (err) {
                        reject(err);
                    });
                }
                return resolve(generateResult);
            }).catch(function (error) {
                var errMsg = 'FAILED - webshot2pdf url: "' + url + '"' +
                    ' file: "' + absDestPath + '" failed returnCode:' + error;
                console.warn(errMsg);
                return reject(errMsg);
            });
        });
    };
    CommonDocPdfManagerModule.prototype.exportPdfs = function (action, exportDir, exportName, processingOptions, searchForm, force) {
        var _this = this;
        var me = this;
        if (exportDir === undefined) {
            console.error(action + ' missing parameter exportDir');
            return Promise.reject(action + ' missing parameter exportDir');
        }
        if (exportName === undefined) {
            console.error(action + ' missing parameter exportName');
            return Promise.reject(action + ' missing parameter exportName');
        }
        if (!fs.existsSync(exportDir)) {
            return Promise.reject('exportDir not exists');
        }
        if (!fs.lstatSync(exportDir).isDirectory()) {
            return Promise.reject('exportBasePath is no directory');
        }
        processingOptions.parallel = Number.isInteger(processingOptions.parallel) ? processingOptions.parallel : 1;
        var exportResults = [];
        var exportCallback = function (mdoc) {
            return [
                me.exportCommonDocRecordPdfFile(mdoc, action, exportDir, exportName, processingOptions)
            ];
        };
        return this.dataService.batchProcessSearchResult(searchForm, exportCallback, {
            loadDetailsMode: 'full',
            loadTrack: false,
            showFacets: false,
            showForm: false
        }, processingOptions).then(function () {
            return _this.generatePdfResultListFile(exportDir, exportName, exportResults);
        });
    };
    CommonDocPdfManagerModule.prototype.generateWebShotUrl = function (action, baseUrl, mdoc, queryParams) {
        return baseUrl + '/' + mdoc.id + '?print&' + queryParams;
    };
    CommonDocPdfManagerModule.prototype.generatePdfResultListFile = function (exportDir, exportName, generateResults) {
        var exportListFile = exportDir + '/' + exportName + '.lst';
        if (fs.existsSync(exportListFile) && !fs.statSync(exportListFile).isFile()) {
            return Promise.reject('exportBaseFileName must be file');
        }
        var fileList = generateResults.map(function (value) {
            return [value.exportFileEntry, value.record.name, value.record.type, ''].join('\t');
        }).join('\n');
        fs.writeFileSync(exportListFile, fileList);
        console.log('wrote fileList', exportListFile);
        var exportHtmlFile = exportDir + '/' + exportName + '.html';
        if (fs.existsSync(exportHtmlFile) && !fs.statSync(exportHtmlFile).isFile()) {
            return Promise.reject('exportBaseFileName must be file');
        }
        var htmlFileList = generateResults.map(function (value) {
            var fileName = value.exportFileEntry;
            var name = value.record.name;
            var rtype = value.record.type;
            return "<div class='bookmark_line bookmark_line_$rtype'><div class='bookmark_file'><a href=\"$fileName\" target=\"_blank\">$fileName</a></div><div class='bookmark_name'>$name</div><div class='bookmark_page'></div></div>"
                .replace(/\$fileName/g, fileName)
                .replace(/\$name/g, name)
                .replace(/\$rtype/g, rtype);
        }).join('\n');
        fs.writeFileSync(exportHtmlFile, htmlFileList);
        console.log('wrote htmlFile', exportHtmlFile);
        return Promise.resolve();
    };
    return CommonDocPdfManagerModule;
}());
exports.CommonDocPdfManagerModule = CommonDocPdfManagerModule;
//# sourceMappingURL=cdoc-pdf-manager-module.js.map