"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process_utils_1 = require("@dps/mycms-commons/dist/commons/utils/process.utils");
var PdfManager = /** @class */ (function () {
    function PdfManager(backendConfig) {
        this.backendConfig = backendConfig;
        this.nodePath = this.backendConfig.nodejsBinaryPath;
        this.webshot2pdfCommandPath = this.backendConfig.webshot2pdfCommandPath;
        if (!this.nodePath || !this.webshot2pdfCommandPath) {
            console.error('PdfManagerModule missing config - nodejsBinaryPath, webshot2pdfCommandPath', this.nodePath, this.webshot2pdfCommandPath);
            throw new Error('PdfManagerModule missing config - nodejsBinaryPath, webshot2pdfCommandPath');
        }
        this.pdfMergeCommandPath = this.backendConfig.pdfMergeCommandPath;
        this.pdfAddPageNumCommandPath = this.backendConfig.pdfAddPageNumCommandPath;
        console.log('PdfManagerModule starting with - nodejsBinaryPath, webshot2pdfCommandPath' +
            ', pdfMergeCommandPath, pdfAddPageNumCommandPath', this.nodePath, this.webshot2pdfCommandPath, this.pdfMergeCommandPath, this.pdfAddPageNumCommandPath);
    }
    PdfManager.prototype.webshot2Pdf = function (url, absDestPath) {
        var _this = this;
        var me = this;
        return new Promise(function (resolve, reject) {
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
                return resolve(absDestPath);
            }).catch(function (error) {
                var errMsg = 'FAILED - webshot2pdf url: "' + url + '"' +
                    ' file: "' + absDestPath + '" failed returnCode:' + error;
                console.warn(errMsg);
                return reject(errMsg);
            });
        });
    };
    PdfManager.prototype.mergePdfs = function (destFile, bookmarkFile, tocFile, tocTemplate, pdfFiles, trim) {
        var _this = this;
        var me = this;
        if (!this.nodePath || !this.pdfMergeCommandPath) {
            console.error('PdfManagerModule missing config - nodejsBinaryPath, pdfMergeCommandPath', this.nodePath, this.pdfMergeCommandPath);
            throw new Error('PdfManagerModule missing config - nodejsBinaryPath, pdfMergeCommandPath');
        }
        var commandArgs = ['--max-old-space-size=8192',
            this.pdfMergeCommandPath,
            destFile
        ];
        if (trim) {
            commandArgs = commandArgs.concat(['--trim']); // trim empty pages
        }
        if (tocTemplate !== undefined && tocTemplate.length > 0) {
            commandArgs = commandArgs.concat(['--toctemplate', tocTemplate]);
        }
        if (tocFile !== undefined && tocFile.length > 0) {
            commandArgs = commandArgs.concat(['--tocfile', tocFile]);
        }
        if (bookmarkFile !== undefined && bookmarkFile.length > 0) {
            commandArgs = commandArgs.concat(['--bookmarkfile', bookmarkFile]);
        }
        else {
            commandArgs = commandArgs.concat(pdfFiles);
        }
        return new Promise(function (resolve, reject) {
            return process_utils_1.ProcessUtils.executeCommandAsync(_this.nodePath, commandArgs, function (buffer) {
                if (!buffer) {
                    return;
                }
                console.log(buffer.toString(), me.webshot2pdfCommandPath, pdfFiles);
            }, function (buffer) {
                if (!buffer) {
                    return;
                }
                console.error(buffer.toString());
            }).then(function (code) {
                if (code !== 0) {
                    var errMsg = 'FAILED - pdfMerge destFile: "' + destFile + ' files: "' + pdfFiles + '" failed returnCode:' + code;
                    console.warn(errMsg);
                    return reject(errMsg);
                }
                var msg = 'SUCCESS - pdfMerge destFile: "' + destFile + ' files: "' + pdfFiles + '" succeeded returnCode:' + code;
                console.log(msg);
                return resolve(destFile);
            }).catch(function (error) {
                var errMsg = 'FAILED - pdfMerge destFile: "' + destFile + ' files: "' + pdfFiles + '" failed returnCode:' + error;
                console.warn(errMsg);
                return reject(errMsg);
            });
        });
    };
    PdfManager.prototype.addPageNumToPdf = function (destFile, startingWithNumber) {
        var _this = this;
        var me = this;
        if (!this.nodePath || !this.pdfAddPageNumCommandPath) {
            console.error('PdfManagerModule missing config - nodejsBinaryPath, pdfAddPageNumCommandPath', this.nodePath, this.pdfAddPageNumCommandPath);
            throw new Error('PdfManagerModule missing config - nodejsBinaryPath, pdfAddPageNumCommandPath');
        }
        return new Promise(function (resolve, reject) {
            return process_utils_1.ProcessUtils.executeCommandAsync(_this.nodePath, ['--max-old-space-size=8192',
                _this.pdfAddPageNumCommandPath,
                destFile,
                startingWithNumber + ''
            ], function (buffer) {
                if (!buffer) {
                    return;
                }
                console.log(buffer.toString(), me.webshot2pdfCommandPath, destFile);
            }, function (buffer) {
                if (!buffer) {
                    return;
                }
                console.error(buffer.toString());
            }).then(function (code) {
                if (code !== 0) {
                    var errMsg = 'FAILED - addPageNumToPdf destFile: "' + destFile + '" failed returnCode:' + code;
                    console.warn(errMsg);
                    return reject(errMsg);
                }
                var msg = 'SUCCESS - addPageNumToPdf destFile: "' + destFile + '" succeeded returnCode:' + code;
                console.log(msg);
                return resolve(destFile);
            }).catch(function (error) {
                var errMsg = 'FAILED - addPageNumToPdf destFile:"' + destFile + '" failed returnCode:' + error;
                console.warn(errMsg);
                return reject(errMsg);
            });
        });
    };
    return PdfManager;
}());
exports.PdfManager = PdfManager;
//# sourceMappingURL=pdf-manager.js.map