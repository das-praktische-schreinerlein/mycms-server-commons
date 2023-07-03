import * as fs from 'fs';
import {
    IdCsvValidationRule,
    SimpleConfigFilePathValidationRule,
    SimpleFilePathValidationRule,
    ValidationRule,
    WhiteListValidationRule
} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import {CommonAdminCommand} from '../../backend-commons/commands/common-admin.command';
import {DateUtils} from '@dps/mycms-commons/dist/commons/utils/date.utils';
import {FileUtils} from '@dps/mycms-commons/dist/commons/utils/file.utils';
import {PDocFileUtils} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-file.utils';
import {PDocRecord} from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import {StringUtils} from '@dps/mycms-commons/dist/commons/utils/string.utils';
import {
    GenericAdapterResponseMapper
} from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
import {PDocAdapterResponseMapper} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper';
import {ViewerManagerModule} from '../../media-commons/modules/viewer-manager.module';

export class PDocConverterCommand extends CommonAdminCommand {
    protected createValidationRules(): {[key: string]: ValidationRule} {
        return {
            backend: new SimpleConfigFilePathValidationRule(true),
            srcFile: new SimpleFilePathValidationRule(true),
            file: new SimpleFilePathValidationRule(true),
            exportId: new SimpleFilePathValidationRule(false),
            renameFileIfExists: new WhiteListValidationRule(false, [true, false, 'true', 'false'], false),
            profiles: new IdCsvValidationRule(false),
            langkeys: new IdCsvValidationRule(false)
        };
    }

    protected definePossibleActions(): string[] {
        return ['extractPDocViewerFile', 'createPDocViewerFile', 'migrateLegacyPDocFile', 'migratePDocFileToMapperFile'];
    }

    protected processCommandArgs(argv: {}): Promise<any> {
        const filePathConfigJson = argv['backend'];
        if (filePathConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required backendConfig: "--backend"');
        }

        const backendConfig = JSON.parse(fs.readFileSync(filePathConfigJson, {encoding: 'utf8'}));
        const viewerManagerModule = new ViewerManagerModule();
        const responseMapper: GenericAdapterResponseMapper = new PDocAdapterResponseMapper(backendConfig);

        const action = argv['action'];
        const exportId = argv['exportId'];

        let promise: Promise<any>;
        const dataFileName = PDocFileUtils.normalizeCygwinPath(argv['file']);
        if (dataFileName === undefined) {
            return Promise.reject('option --file expected');
        }

        const srcFile = PDocFileUtils.normalizeCygwinPath(argv['srcFile']);
        if (srcFile === undefined) {
            console.error(srcFile + ' missing parameter - usage: --srcFile SRCFILE', argv);
            return Promise.reject(srcFile + ' missing parameter - usage: --srcFile SRCFILE');
        }

        const renameFileIfExists = !!argv['renameFileIfExists'];
        let fileCheckPromise: Promise<any>;
        if (fs.existsSync(dataFileName)) {
            if (!renameFileIfExists) {
                return Promise.reject('exportfile already exists');
            }

            const newFile = dataFileName + '.' + DateUtils.formatToFileNameDate(new Date(), '', '-', '') + '-migration.MOVED';
            fileCheckPromise = FileUtils.moveFile(dataFileName, newFile, false);
        } else {
            fileCheckPromise = Promise.resolve();
        }

        switch (action) {
            case 'extractPDocViewerFile':
                const src = fs.readFileSync(srcFile, { encoding: 'utf8' });
                const matcher = src.match(/`\s*(\{.*})\s*`\s*;/s);

                if (!matcher || matcher.length !== 2) {
                    promise = Promise.reject('cant extract json');
                    return promise;
                }

                const jsonSrc = matcher[1].replace(/\\\\/g, '\\');
                promise = fileCheckPromise.then(() => {
                    fs.writeFileSync(dataFileName, jsonSrc);
                }).catch(reason => {
                    return Promise.reject('exportfile already exists and cant be renamed: ' + reason);
                })

                break;
            case 'createPDocViewerFile':
                if (exportId === undefined) {
                    console.error(action + ' missing parameter - usage: --exportId EXPORTID', argv);
                    promise = Promise.reject(action + ' missing parameter - usage: --exportId EXPORTID');
                    return promise;
                }

                const pdocs: PDocRecord[] = JSON.parse(fs.readFileSync(srcFile, { encoding: 'utf8' })).pdocs;
                promise = fileCheckPromise.then(() => {
                    fs.writeFileSync(dataFileName,
                        viewerManagerModule.fullJsonToJsTargetContentConverter(
                            JSON.stringify({ pdocs: pdocs}, undefined, ' '),
                            exportId,
                            'importStaticDataPDocsJsonP'
                        )
                    );
                }).catch(reason => {
                    return Promise.reject('exportfile already exists and cant be renamed: ' + reason);
                })

                break;
            case 'migratePDocFileToMapperFile':
                const srcRecords: PDocRecord[] = JSON.parse(fs.readFileSync(srcFile, { encoding: 'utf8' })).pdocs;
                const resultValues = [];
                for (const doc of srcRecords) {
                    resultValues.push(this.migratePDocRecordToMapperFile(responseMapper, doc));
                }

                promise = fileCheckPromise.then(() => {
                    fs.writeFileSync(dataFileName, JSON.stringify({ pdocs: resultValues}, undefined, ' '));
                }).catch(reason => {
                    return Promise.reject('exportfile already exists and cant be renamed: ' + reason);
                })

                break;
            case 'migrateLegacyPDocFile':
                const profiles = argv['profiles'];
                if (profiles === undefined || profiles.length < 2) {
                    return Promise.reject('option --profiles expected');
                }

                const langkeys = argv['langkeys'];
                if (langkeys === undefined || langkeys.length < 2) {
                    return Promise.reject('option --langkeys expected');
                }

                const docs: PDocRecord[] = JSON.parse(fs.readFileSync(srcFile, { encoding: 'utf8' })).pdocs;
                for (const doc of docs) {
                    this.migrateLegacyPDocRecord(doc, profiles, langkeys);
                }

                promise = fileCheckPromise.then(() => {
                    fs.writeFileSync(dataFileName, JSON.stringify({ pdocs: docs}, undefined, ' '));
                }).catch(reason => {
                    return Promise.reject('exportfile already exists and cant be renamed: ' + reason);
                })

                break;
            default:
                console.error('unknown action:', argv);
                return Promise.reject('unknown action');
        }

        return promise;
    }

    protected migrateLegacyPDocRecord(doc: PDocRecord, profiles: string, langkeys: string) {
        const flags = doc.flags
            ? doc.flags.split(',')
            : [];
        for (const flag of [
            'flgShowSearch',
            'flgShowNews',
            'flgShowTopTen',
            'flgShowAdminArea',
            'flgShowDashboard',
            'flgShowStatisticBoard']) {
            if (doc[flag] === true || doc[flag] === 'true') {
                flags.push(flag.replace('flg', 'flg_'));
            }
        }

        doc.flags = StringUtils.uniqueKeywords(flags.join(','))
            .join(',');

        doc.profiles = profiles;
        doc.langkeys = langkeys;

        doc.subtype = doc.type;
        doc.type = 'PAGE';

        if (!doc.key) {
            doc.key = doc.id;
        }
    }

    protected migratePDocRecordToMapperFile(responseMapper: GenericAdapterResponseMapper, doc: PDocRecord): {} {
        if (!doc.key) {
            doc.key = doc.id;
        }

        return responseMapper.mapToAdapterDocument({}, doc);
    }
}
