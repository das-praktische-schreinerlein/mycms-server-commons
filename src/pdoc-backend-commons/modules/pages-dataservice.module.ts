import {StaticPagesDataStore} from '@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.store';
import {SearchParameterUtils} from '@dps/mycms-commons/dist/search-commons/services/searchparameter.utils';
import {StaticPagesDataService} from '@dps/mycms-commons/dist/pdoc-commons/services/staticpages-data.service';
import {PDocInMemoryAdapter} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-inmemory.adapter';
import {PDocRecord} from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import {PDocFileUtils} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-file.utils';
import * as fs from 'fs';
import * as htmlToText from 'html-to-text';
import {CommonPDocBackendConfigType} from './pdoc-backend.commons';
import {
    GenericAdapterResponseMapper
} from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
import {PDocAdapterResponseMapper} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-adapter-response.mapper';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {Mapper} from 'js-data';
import {MarkdownService} from '@dps/mycms-commons/dist/markdown-commons/markdown.service';

export class PagesDataserviceModule {
    private static dataServices = new Map<string, StaticPagesDataService>();

    public static getDataService(profile: string, backendConfig: CommonPDocBackendConfigType<any>,
                                 locale: string, markdownService: MarkdownService): StaticPagesDataService {
        if (!this.dataServices.has(profile)) {
            this.dataServices.set(profile, PagesDataserviceModule.createDataService(backendConfig, locale, markdownService));
        }

        return this.dataServices.get(profile);
    }

    private static createDataService(backendConfig: CommonPDocBackendConfigType<any>, locale: string,
                                     markdownService: MarkdownService): StaticPagesDataService {
        if (!backendConfig.filePathPagesJson) {
            if (backendConfig.filePathPDocJson) {
                return this.createLegacyDataService(backendConfig, locale, markdownService);
            }

            throw new Error('for PagesDataserviceModule no filePathPagesJson OR filePathPDocJson is configured');
        }

        // configure store
        const dataStore: StaticPagesDataStore = new StaticPagesDataStore(new SearchParameterUtils());
        const responseMapper: GenericAdapterResponseMapper = new PDocAdapterResponseMapper(backendConfig);
        const dataService: StaticPagesDataService = new StaticPagesDataService(dataStore);
        const mapper: Mapper = dataService.getMapper(dataService.getBaseMapperName());

        const fileName = backendConfig.filePathPagesJson.replace('.pdocsexport.json', '-' + locale + '.pdocsexport.json');
        const recordSrcs = PDocFileUtils.parseRecordSourceFromJson(fs.readFileSync(fileName, { encoding: 'utf8' }));
        const docs = [];
        for (const docSrc of recordSrcs) {
            const doc: CommonDocRecord = <CommonDocRecord>responseMapper.mapResponseDocument(mapper, docSrc, {});
            PagesDataserviceModule.remapRecord(markdownService, doc);

            docs.push(doc);
        }

        dataService.setWritable(true);
        dataService.addMany(docs).then(function doneAddMany(records: PDocRecord[]) {
                console.log('loaded pdocs from assets', records);
            },
            function errorCreate(reason: any) {
                console.warn('loading pdocs failed:', reason);
            }
        );
        dataService.setWritable(false);

        // configure dummy-adapter
        const options = {};
        const adapter = new PDocInMemoryAdapter(options);
        dataStore.setAdapter('inmemory', adapter, '', {});

        return dataService;
    }

    private static createLegacyDataService(backendConfig: CommonPDocBackendConfigType<any>, locale: string,
                                           markdownService: MarkdownService): StaticPagesDataService {
        // configure store
        const dataStore: StaticPagesDataStore = new StaticPagesDataStore(new SearchParameterUtils());
        const dataService: StaticPagesDataService = new StaticPagesDataService(dataStore);

        const fileName = backendConfig.filePathPDocJson.replace('.json', '-' + locale + '.json');
        const docs: any[] = JSON.parse(fs.readFileSync(fileName, { encoding: 'utf8' })).pdocs;
        for (const doc of docs) {
            PagesDataserviceModule.remapRecord(markdownService, doc);
        }

        dataService.setWritable(true);
        dataService.addMany(docs).then(function doneAddMany(records: PDocRecord[]) {
                console.log('loaded pdocs from assets', records);
            },
            function errorCreate(reason: any) {
                console.warn('loading pdocs failed:', reason);
            }
        );
        dataService.setWritable(false);

        // configure dummy-adapter
        const options = {};
        const adapter = new PDocInMemoryAdapter(options);
        dataStore.setAdapter('inmemory', adapter, '', {});

        return dataService;
    }

    private static remapRecord(markdownService: MarkdownService, doc: CommonDocRecord): void {
        if (!doc['descHtml']) {
            doc['descHtml'] = markdownService.renderMarkdown(doc['descMd']);
        }
        if (!doc['descTxt']) {
            doc['descTxt'] = htmlToText.fromString(doc['descHtml'], {
                wordwrap: 80
            });
        }
    }
}
