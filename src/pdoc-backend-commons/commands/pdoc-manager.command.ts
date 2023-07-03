import * as fs from 'fs';
import {ProcessingOptions} from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import {MediaExportProcessingOptions} from '../../backend-commons/modules/cdoc-mediafile-export.service';
import {CommonAdminCommand} from '../../backend-commons/commands/common-admin.command';
import {
    IdCsvValidationRule,
    KeywordValidationRule,
    NumberValidationRule,
    SimpleConfigFilePathValidationRule,
    SimpleFilePathValidationRule,
    SolrValidationRule,
    ValidationRule
} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import {PDocExportService} from '../modules/pdoc-export.service';
import {PDocServerPlaylistService} from '../modules/pdoc-serverplaylist.service';
import {PDocAdapterResponseMapper} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper';
import {PDocDataServiceModule} from '../modules/pdoc-dataservice.module';
import {utils} from 'js-data';
import {PDocSearchForm} from '@dps/mycms-commons/dist/pdoc-commons/model/forms/pdoc-searchform';
import {ViewerManagerModule} from '../../media-commons/modules/viewer-manager.module';

export class PageManagerCommand extends CommonAdminCommand {
    protected createValidationRules(): {[key: string]: ValidationRule} {
        return {
            action: new KeywordValidationRule(true),
            backend: new SimpleConfigFilePathValidationRule(true),
            exportDir: new SimpleFilePathValidationRule(false),
            exportName: new SimpleFilePathValidationRule(false),
            exportId: new SimpleFilePathValidationRule(false),
            ignoreErrors: new NumberValidationRule(false, 1, 999999999, 10),
            parallel: new NumberValidationRule(false, 1, 99, 10),
            pageNum: new NumberValidationRule(false, 1, 999999999, 1),
            fulltext: new SolrValidationRule(false),
            profiles: new IdCsvValidationRule(false),
            langkeys: new IdCsvValidationRule(false),
            directoryProfile: new KeywordValidationRule(false),
            fileNameProfile: new KeywordValidationRule(false)
        };
    }

    protected definePossibleActions(): string[] {
        return [
            'exportPDocFile', 'exportPDocViewerFile', 'exportPageFile'
        ];
    }

    protected processCommandArgs(argv: {}): Promise<any> {
        const filePathConfigJson = argv['backend'];
        if (filePathConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required backendConfig: "--backend"');
        }

        const action = argv['action'];
        const backendConfig = JSON.parse(fs.readFileSync(filePathConfigJson, {encoding: 'utf8'}));

        const dataService = PDocDataServiceModule.getDataService('pdocSolrReadOnly', backendConfig);
        const viewerManagerModule = new ViewerManagerModule();

        let promise: Promise<any>;
        let searchForm: PDocSearchForm;

        const exportDir = argv['exportDir'];
        const exportName = argv['exportName'];
        const profiles = argv['profiles'];
        const langkeys = argv['langkeys'];
        const exportId = argv['exportId'];

        let type = 'UNKNOWN';
        switch (action) {
            case 'exportPageFile':
            case 'exportPDocFile':
            case 'exportPDocViewerFile':
                type = 'page';
                break;
        }

        switch (action) {
            case 'exportPDocFile':
            case 'exportPDocViewerFile':
                if (exportDir === undefined) {
                    console.error(action + ' missing parameter - usage: --exportDir EXPORTDIR', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportDir EXPORTDIR');
                    return promise;
                }

                if (exportName === undefined) {
                    console.error(action + ' missing parameter - usage: --exportName EXPORTNAME', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportName EXPORTNAME');
                    return promise;
                }

                searchForm = new PDocSearchForm({
                    type: type,
                    profiles: profiles,
                    langkeys: langkeys,
                    sort: 'forExport',
                    perPage: 9999
                });
                promise = dataService.findCurList(searchForm).then(pdocs => {
                    if (action === 'exportPDocViewerFile') {
                        if (exportId === undefined) {
                            console.error(action + ' missing parameter - usage: --exportId EXPORTID', argv);
                            promise = Promise.reject(action + ' missing parameter - usage: --exportId EXPORTID');
                            return promise;
                        }

                        const fileName = exportDir + '/' + exportName + '.js';
                        fs.writeFileSync(fileName,
                            viewerManagerModule.fullJsonToJsTargetContentConverter(
                                JSON.stringify({ pdocs: pdocs}, undefined, ' '),
                                exportId,
                                'importStaticDataPDocsJsonP'
                            )
                        );
                    } else {
                        fs.writeFileSync(exportDir + '/' + exportName + '.json', JSON.stringify({ pdocs: pdocs}, undefined, ' '));
                    }
                });

                break;
            case 'exportPageFile':
                const playlistService = new PDocServerPlaylistService();
                const responseMapper = new PDocAdapterResponseMapper(backendConfig);
                const pdocExportService: PDocExportService =
                    new PDocExportService(backendConfig, dataService, playlistService, responseMapper);

                const processingOptions: ProcessingOptions = {
                    ignoreErrors: Number.parseInt(argv['ignoreErrors'], 10) || 0,
                    parallel: Number.parseInt(argv['parallel'], 10),
                };
                const pageNum = Number.parseInt(argv['pageNum'], 10);
                const fulltext = argv['fulltext'];

                if (exportDir === undefined) {
                    console.error(action + ' missing parameter - usage: --exportDir EXPORTDIR', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportDir EXPORTDIR');
                    return promise;
                }

                if (exportName === undefined) {
                    console.error(action + ' missing parameter - usage: --exportName EXPORTNAME', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportName EXPORTNAME');
                    return promise;
                }

                const directoryProfile = argv['directoryProfile'];
                if (directoryProfile === undefined) {
                    console.error(action + ' missing parameter - usage: --directoryProfile directoryProfile', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --directoryProfile directoryProfile');
                    return promise;
                }

                const fileNameProfile = argv['fileNameProfile'];
                if (fileNameProfile === undefined) {
                    console.error(action + ' missing parameter - usage: --fileNameProfile fileNameProfile', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --fileNameProfile fileNameProfile');
                    return promise;
                }

                processingOptions.parallel = Number.isInteger(processingOptions.parallel) ? processingOptions.parallel : 1;
                searchForm = new PDocSearchForm({
                    type: type,
                    fulltext: fulltext,
                    profiles: profiles,
                    langkeys: langkeys,
                    sort: 'forExport',
                    pageNum: Number.isInteger(pageNum) ? pageNum : 1});
                console.log('START processing: ' + action, searchForm, exportDir, processingOptions);

                promise = pdocExportService.exportMediaFiles(searchForm, <MediaExportProcessingOptions & ProcessingOptions> {
                    ...processingOptions,
                    exportBasePath: exportDir,
                    exportBaseFileName: exportName,
                    directoryProfile: directoryProfile,
                    fileNameProfile: fileNameProfile,
                    jsonBaseElement: 'pdocs'
                });

                break;
            default:
                console.error('unknown action:', argv);
                promise = utils.reject('unknown action');
        }

        return promise;
    }
}
