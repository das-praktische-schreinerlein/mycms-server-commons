"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var js_data_1 = require("js-data");
var os = require("os");
var media_manager_module_1 = require("../../media-commons/modules/media-manager.module");
var CommonMediaManagerCommand = /** @class */ (function () {
    function CommonMediaManagerCommand(backendConfig) {
        this.backendConfig = backendConfig;
    }
    CommonMediaManagerCommand.prototype.process = function (argv) {
        var action = argv['action'];
        var importDir = argv['importDir'];
        var outputDir = argv['outputDir'];
        var force = argv['force'];
        var mediaManagerModule = new media_manager_module_1.MediaManagerModule(this.backendConfig.imageMagicAppPath, os.tmpdir());
        var promise;
        switch (action) {
            case 'convertVideosFromMediaDirToMP4':
                if (importDir === undefined || outputDir === undefined) {
                    console.error(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR [--force true/false]', argv);
                    promise = js_data_1.utils.reject(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR' +
                        ' [--force true/false]');
                    return promise;
                }
                promise = mediaManagerModule.convertVideosFromMediaDirToMP4(importDir, outputDir, !force);
                promise.then(function (value) {
                    console.log('DONE converted files to mp4', value);
                });
                break;
            case 'scaleVideosFromMediaDirToMP4':
                if (importDir === undefined || outputDir === undefined) {
                    console.error(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR [--force true/false]', argv);
                    promise = js_data_1.utils.reject(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR' +
                        ' [--force true/false]');
                    return promise;
                }
                promise = mediaManagerModule.scaleVideosFromMediaDirToMP4(importDir, outputDir, 600, !force);
                promise.then(function (value) {
                    console.log('DONE scaled videos', value);
                });
                break;
            case 'generateVideoScreenshotFromMediaDir':
                if (importDir === undefined || outputDir === undefined) {
                    console.error(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR [--force true/false]', argv);
                    promise = js_data_1.utils.reject(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR' +
                        ' [--force true/false]');
                    return promise;
                }
                promise = mediaManagerModule.generateVideoScreenshotFromMediaDir(importDir, outputDir, 200, !force);
                promise.then(function (value) {
                    console.log('DONE created screenshot for videos', value);
                });
                break;
            case 'generateVideoPreviewFromMediaDir':
                if (importDir === undefined || outputDir === undefined) {
                    console.error(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR [--force true/false]', argv);
                    promise = js_data_1.utils.reject(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR' +
                        ' [--force true/false]');
                    return promise;
                }
                promise = mediaManagerModule.generateVideoPreviewFromMediaDir(importDir, outputDir, 200, !force);
                promise.then(function (value) {
                    console.log('DONE created screenshot for videos', value);
                });
                break;
            case 'rotateVideo':
                var srcFile = argv['srcFile'];
                var rotate = argv['rotate'];
                if (srcFile === undefined || rotate === undefined) {
                    console.error(action + ' missing parameter - usage: --srcFile SRCFILE --rotate DEGREES', argv);
                    promise = js_data_1.utils.reject(action + ' missing parameter - usage: --srcFile SRCFILE --rotate DEGREES [--force true/false]');
                    return promise;
                }
                promise = mediaManagerModule.rotateVideo(srcFile, rotate);
                promise.then(function (value) {
                    console.log('DONE rotated videos', value);
                });
                break;
            default:
                console.error('unknown action:', argv);
                promise = js_data_1.utils.reject('unknown action');
        }
        return promise;
    };
    return CommonMediaManagerCommand;
}());
exports.CommonMediaManagerCommand = CommonMediaManagerCommand;
//# sourceMappingURL=common-media-manager.command.js.map