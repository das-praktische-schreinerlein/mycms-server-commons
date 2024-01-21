import * as fs from 'fs';
import {ProcessingOptions} from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import {CommonAdminCommand} from '../../backend-commons/commands/common-admin.command';
import {
    HtmlValidationRule,
    KeywordValidationRule,
    SimpleConfigFilePathValidationRule,
    ValidationRule
} from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import {SitemapConfig} from '../../backend-commons/modules/sitemap-generator.module';
import {PDocFileUtils} from '@dps/mycms-commons/dist/pdoc-commons/services/pdoc-file.utils';
import {PDocDataServiceModule} from '../modules/pdoc-dataservice.module';
import {PagePdfManagerModule} from '../modules/pdoc-pdf-manager-module';
import {PDocExportManagerUtils} from '../modules/pdoc-export-manager.utils';
import {CommonPDocBackendConfigType} from '../modules/pdoc-backend.commons';
import {PdfExportProcessingOptions} from '../../backend-commons/modules/cdoc-pdf-manager-module';
import {CommonPdfBackendConfigType} from '../../backend-commons/modules/backend.commons';
import {PdfManager, PdfManagerConfigType} from '../../media-commons/modules/pdf-manager';


export interface PDocPdfBackendConfigType extends
    CommonPdfBackendConfigType,
    PdfManagerConfigType,
    CommonPDocBackendConfigType<any> {
}

export class PDocPdfManagerCommand extends CommonAdminCommand {

    protected createValidationRules(): {[key: string]: ValidationRule} {
        return {
            action: new KeywordValidationRule(true),
            backend: new SimpleConfigFilePathValidationRule(true),
            sitemap: new SimpleConfigFilePathValidationRule(true),
            baseUrl: new HtmlValidationRule(false),
            queryParams: new HtmlValidationRule(false),
            ... PDocExportManagerUtils.createExportValidationRules(),
            ... PDocExportManagerUtils.createPDocSearchFormValidationRules()
        };
    }

    protected definePossibleActions(): string[] {
        return [
            'exportPagePdfs',
            'generateDefaultPagePdfs',
            'generateExternalPagePdfs'];
    }

    protected processCommandArgs(argv: {}): Promise<any> {
        // importDir and outputDir are used in CommonMediaManagerCommand too
        argv['exportDir'] = PDocFileUtils.normalizeCygwinPath(argv['exportDir']);

        const filePathConfigJson = argv['backend'];
        if (filePathConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required backendConfig: "--backend"');
        }

        const filePathSitemapConfigJson = argv['sitemap'];
        if (filePathSitemapConfigJson === undefined) {
            return Promise.reject('ERROR - parameters required sitemapConfig: "--sitemap"');
        }

        const action = argv['action'];
        const backendConfig: PDocPdfBackendConfigType =
            JSON.parse(fs.readFileSync(filePathConfigJson, {encoding: 'utf8'}));
        const sitemapConfig: SitemapConfig = JSON.parse(fs.readFileSync(filePathSitemapConfigJson, {encoding: 'utf8'}));

        // @ts-ignore
        const writable = backendConfig.pdocWritable === true || backendConfig.pdocWritable === 'true';
        const dataService = PDocDataServiceModule.getDataService('pdocSolrReadOnly', backendConfig);
        if (writable) {
            dataService.setWritable(true);
        }

        const pdfManager = new PdfManager(backendConfig);
        const pdfManagerModule = new PagePdfManagerModule(dataService, pdfManager, sitemapConfig);

        let promise: Promise<any>;
        const processingOptions: PdfExportProcessingOptions & ProcessingOptions = {
            ignoreErrors: Number.parseInt(argv['ignoreErrors'], 10) || 0,
            parallel: Number.parseInt(argv['parallel'], 10),
        };
        const force = argv['force'] === true || argv['force'] === 'true';

        const generatePdfsType = this.getGenerateTypeFromAction(action);
        const generateName = generatePdfsType;
        const generateQueryParams = argv['queryParams'] !== undefined
            ? argv['queryParams']
            : '';
        const baseUrl = argv['baseUrl'];

        const exportPdfsType = this.getExportTypeFromAction(action);
        const exportDir = argv['exportDir'];
        const exportName = argv['exportName'];

        switch (action) {
            case 'generateDefaultPagePdfs':
                console.log('DO generate searchform for : ' + action, processingOptions);
                promise = PDocExportManagerUtils.createPDocSearchForm(generatePdfsType, argv).then(searchForm => {
                    console.log('START processing: ' + action, backendConfig.apiRoutePdfsStaticDir, searchForm, processingOptions);
                    return pdfManagerModule.generatePdfs(action,
                        backendConfig.apiRoutePdfsStaticDir, generateName, sitemapConfig.showBaseUrl,
                        generateQueryParams, processingOptions, searchForm, force);
                });

                break;
            case 'generateExternalPagePdfs':
                console.log('DO generate searchform for : ' + action, processingOptions);
                promise = PDocExportManagerUtils.createPDocSearchForm(generatePdfsType, argv).then(searchForm => {
                    console.log('START processing: ' + action, exportDir, searchForm, processingOptions);
                    return pdfManagerModule.generatePdfs(action, exportDir, exportName, baseUrl, generateQueryParams,
                        processingOptions, searchForm, force);
                });
                break;
            case 'exportPagePdfs':
                console.log('DO generate searchform for : ' + action, processingOptions);
                promise = PDocExportManagerUtils.createPDocSearchForm(exportPdfsType, argv).then(searchForm => {
                    console.log('START processing: ' + action, exportDir , searchForm, processingOptions);
                    return pdfManagerModule.exportPdfs(action, exportDir, exportName, processingOptions, searchForm, force);
                });

                break;
        }

        return promise;
    }

    protected getGenerateTypeFromAction(action: string) {
        return 'page';
    }

    protected getExportTypeFromAction(action: string) {
        return 'page';
    }

}
