import {AbstractCommand} from './abstract.command';
import {utils} from 'js-data';
import * as os from 'os';
import {MediaManagerModule} from '../../media-commons/modules/media-manager.module';
import {
    CommonImageBackendConfigType,
    CommonKeywordMapperConfigType,
    CommonVideoBackendConfigType
} from "../modules/backend.commons";
import {CacheConfig} from "../../server-commons/datacache.module";

export class CommonMediaManagerCommand implements AbstractCommand {
    constructor (private backendConfig: CommonImageBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>
        & CommonVideoBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>) {}

    public process(argv): Promise<any> {
        const action = argv['action'];
        const importDir = argv['importDir'];
        const outputDir = argv['outputDir'];
        const force = argv['force'];
        const mediaManagerModule = new MediaManagerModule(this.backendConfig.imageMagicAppPath, os.tmpdir());

        let promise: Promise<any>;
        switch (action) {
            case 'convertVideosFromMediaDirToMP4':
                if (importDir === undefined || outputDir === undefined) {
                    console.error(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR [--force true/false]',
                        argv);
                    promise = utils.reject(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR' +
                        ' [--force true/false]');
                    return promise;
                }

                promise = mediaManagerModule.convertVideosFromMediaDirToMP4(importDir, outputDir, !force);
                promise.then(value => {
                    console.log('DONE converted files to mp4', value);
                });

                break;
            case 'scaleVideosFromMediaDirToMP4':
                if (importDir === undefined || outputDir === undefined) {
                    console.error(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR [--force true/false]',
                        argv);
                    promise = utils.reject(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR' +
                        ' [--force true/false]');
                    return promise;
                }

                promise = mediaManagerModule.scaleVideosFromMediaDirToMP4(importDir, outputDir, 600, !force);
                promise.then(value => {
                    console.log('DONE scaled videos', value);
                });

                break;
            case 'generateVideoScreenshotFromMediaDir':
                if (importDir === undefined || outputDir === undefined) {
                    console.error(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR [--force true/false]',
                        argv);
                    promise = utils.reject(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR' +
                        ' [--force true/false]');
                    return promise;
                }

                promise = mediaManagerModule.generateVideoScreenshotFromMediaDir(importDir, outputDir, 200, !force);
                promise.then(value => {
                    console.log('DONE created screenshot for videos', value);
                });

                break;
            case 'generateVideoPreviewFromMediaDir':
                if (importDir === undefined || outputDir === undefined) {
                    console.error(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR [--force true/false]',
                        argv);
                    promise = utils.reject(action + ' missing parameter - usage: --importDir INPUTDIR --outputDir OUTPUTDIR' +
                        ' [--force true/false]');
                    return promise;
                }

                promise = mediaManagerModule.generateVideoPreviewFromMediaDir(importDir, outputDir, 200, !force);
                promise.then(value => {
                    console.log('DONE created screenshot for videos', value);
                });

                break;
            case 'rotateVideo':
                const srcFile = argv['srcFile'];
                const rotate = argv['rotate'];
                if (srcFile === undefined || rotate === undefined) {
                    console.error(action + ' missing parameter - usage: --srcFile SRCFILE --rotate DEGREES', argv);
                    promise = utils.reject(action + ' missing parameter - usage: --srcFile SRCFILE --rotate DEGREES [--force true/false]');
                    return promise;
                }

                promise = mediaManagerModule.rotateVideo(srcFile, rotate);
                promise.then(value => {
                    console.log('DONE rotated videos', value);
                });

                break;
            default:
                console.error('unknown action:', argv);
                promise = utils.reject('unknown action');
        }

        return promise;
    }
}
