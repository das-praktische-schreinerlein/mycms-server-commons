import * as fs from 'fs';
import {ExportProcessingResult} from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import {ProcessingOptions} from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {CommonDocDataService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import {CommonDocSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import {CommonDocSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import {PdfManager} from '../../media-commons/modules/pdf-manager';

export interface PdfExportProcessingOptions {
    generateMergedPdf?: boolean;
    addPageNumsStartingWith?: number;
    tocTemplate?: string;
    trimEmptyPages?: boolean;
}

export abstract class CommonDocPdfManagerModule<DS extends CommonDocDataService<CommonDocRecord, CommonDocSearchForm,
    CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>> {

    protected dataService: DS;
    protected pdfManager: PdfManager;

    constructor(dataService: DS, pdfManager: PdfManager) {
        this.dataService = dataService;
        this.pdfManager = pdfManager;
    }

    public generatePdfs(action: string, generateDir: string, generateName: string, baseUrl: string, queryParams: string,
                        processingOptions: PdfExportProcessingOptions & ProcessingOptions, searchForm: CommonDocSearchForm,
                        force: boolean): Promise<any> {
        const me = this;

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
        const generateResults: ExportProcessingResult<CommonDocRecord>[] = [];

        const generateCallback = function (mdoc: CommonDocRecord): Promise<{}>[] {
            return [
                me.generatePdf(mdoc, action, generateDir, baseUrl, queryParams,
                    processingOptions, force).then( generateResult => {
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
        }, processingOptions).then(() => {
            return this.generatePdfResultListFile(generateDir, generateName, generateResults, processingOptions);
        });
    }

    public generatePdf(mdoc: CommonDocRecord, action: string, generateDir: string, baseUrl: string, queryParams: string,
                       processingOptions: PdfExportProcessingOptions & ProcessingOptions, force: boolean):
        Promise<ExportProcessingResult<CommonDocRecord>> {
        const me = this;

        const url = this.generateWebShotUrl(action, baseUrl, mdoc, queryParams);
        const fileName = mdoc['pdfFile'] !== undefined && mdoc['pdfFile'].length > 5
            ? mdoc['pdfFile']
            : this.generatePdfFileName(mdoc);
        const relDestPath = mdoc.type
            + '/'
            + fileName;
        const absDestPath = generateDir
            + '/'
            + relDestPath;
        let generateResult: ExportProcessingResult<CommonDocRecord>;

        return new Promise<any>((resolve, reject) => {
            if (!force && fs.existsSync(absDestPath)) {
                const msg = 'SKIPPED - webshot2pdf url: "' + url + '" file: "' + absDestPath + '" file already exists';
                console.log(msg)

                generateResult = {
                    record: mdoc,
                    exportFileEntry: relDestPath,
                    externalRecordFieldMappings: undefined,
                    mediaFileMappings: undefined
                };

                if (mdoc['pdfFile'] !== fileName) {
                    return this.updatePdfEntity(mdoc, fileName).then(() => {
                        resolve(generateResult);
                    }).catch(err => {
                        reject(err);
                    });
                }

                return resolve(generateResult);
            }

            return me.pdfManager.webshot2Pdf(url, absDestPath).then(code => {
                generateResult = {
                    record: mdoc,
                    exportFileEntry: relDestPath,
                    externalRecordFieldMappings: undefined,
                    mediaFileMappings: undefined
                };

                if (mdoc['pdfFile'] !== fileName) {
                    return me.updatePdfEntity(mdoc, fileName).then(() => {
                        resolve(generateResult);
                    }).catch(err => {
                        reject(err);
                    });
                }

                return resolve(generateResult);
            }).catch(error => {
                const errMsg = 'FAILED - generatePdf url: "' + url + '"' +
                    ' file: "' + absDestPath + '" failed returnCode:' + error;
                console.warn(errMsg)
                return reject(errMsg);
            })
        });
    }

    public exportPdfs(action: string, exportDir: string, exportName: string,
                      processingOptions: PdfExportProcessingOptions & ProcessingOptions, searchForm: CommonDocSearchForm,
                      force: boolean): Promise<any> {
        const me = this;

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
        const exportResults: ExportProcessingResult<CommonDocRecord>[] = [];
        const exportCallback = function (mdoc: CommonDocRecord): Promise<{}>[] {
            return [
                me.exportCommonDocRecordPdfFile(mdoc, action, exportDir, exportName, processingOptions)
            ];
        };

        return this.dataService.batchProcessSearchResult(searchForm, exportCallback, {
            loadDetailsMode: 'full',
            loadTrack: false,
            showFacets: false,
            showForm: false
        }, processingOptions).then(() => {
            return this.generatePdfResultListFile(exportDir, exportName, exportResults, processingOptions);
        });
    }

    protected abstract exportCommonDocRecordPdfFile(mdoc: CommonDocRecord, action: string, exportDir: string, exportName: string,
                                                    processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>>;


    protected abstract generatePdfFileName(entity: CommonDocRecord): string;

    protected abstract updatePdfEntity(entity: CommonDocRecord, fileName: string): Promise<CommonDocRecord>;

    protected generateWebShotUrl(action: string, baseUrl: string, mdoc: CommonDocRecord, queryParams: string) {
        return baseUrl + '/' + mdoc.id + '?print&' + queryParams;
    }

    protected generatePdfResultListFile(exportDir: string, exportName: string,
                                        generateResults: ExportProcessingResult<CommonDocRecord>[],
                                        processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>[]> {
        return this.generatePdfResultListLstFile(exportDir, exportName, generateResults, processingOptions).then(() => {
            return this.generatePdfResultListHtmlFile(exportDir, exportName, generateResults, processingOptions);
        }).then(() => {
            if (processingOptions.generateMergedPdf) {
                return this.generatePdfResultListPdfFile(exportDir, exportName, generateResults, processingOptions);
            }

            return Promise.resolve(generateResults);
        })
    }

    protected generatePdfResultListLstFile(exportDir: string, exportName: string,
                                           generateResults: ExportProcessingResult<CommonDocRecord>[],
                                           processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>[]> {
        const exportListFile = exportDir + '/' + exportName + '-toc.lst';
        if (fs.existsSync(exportListFile) && !fs.statSync(exportListFile).isFile()) {
            return Promise.reject('exportBaseFileName must be file');
        }

        const fileList = generateResults.map(value => {
            return [value.exportFileEntry, value.record.name,  value.record.type, ''].join('\t')
        }).join('\n');

        fs.writeFileSync(exportListFile, fileList);
        console.log('wrote fileList', exportListFile);

        return Promise.resolve(generateResults);
    }

    protected generatePdfResultListHtmlFile(exportDir: string, exportName: string,
                                            generateResults: ExportProcessingResult<CommonDocRecord>[],
                                            processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>[]> {
        const exportHtmlFile = exportDir + '/' + exportName + '-toc.html';
        if (fs.existsSync(exportHtmlFile) && !fs.statSync(exportHtmlFile).isFile()) {
            return Promise.reject('exportBaseFileName must be file');
        }

        let htmlFileList = generateResults.map(value => {
            const fileName = value.exportFileEntry;
            const name = value.record.name;
            const rtype = value.record.type;
            return `<div class='bookmark_line bookmark_line_$rtype'><div class='bookmark_file'><a href="$fileName" target="_blank">$fileName</a></div><div class='bookmark_name'>$name</div><div class='bookmark_page'></div></div>`
                .replace(/\$fileName/g, fileName)
                .replace(/\$name/g, name)
                .replace(/\$rtype/g, rtype);
        }).join('\n');

        if (processingOptions.tocTemplate) {
            try {
                const html = fs.readFileSync(processingOptions.tocTemplate, {encoding: 'utf8'});
                htmlFileList = html.replace('{{TOC}}', htmlFileList);
            } catch (err) {
                return Promise.reject('error while reading tocTemplate: ' + err);
            }
        }

        fs.writeFileSync(exportHtmlFile, htmlFileList);
        console.log('wrote htmlFile', exportHtmlFile);

        return Promise.resolve(generateResults);
    }

    protected generatePdfResultListPdfFile(exportDir: string, exportName: string,
                                           generateResults: ExportProcessingResult<CommonDocRecord>[],
                                           processingOptions: PdfExportProcessingOptions & ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>[]> {
        const exportPdfFile = exportDir + '/' + exportName + '.pdf';
        if (fs.existsSync(exportPdfFile) && !fs.statSync(exportPdfFile).isFile()) {
            return Promise.reject('exportBaseFileName must be file');
        }

        const pdfFiles = generateResults.map(value => {
            return value.exportFileEntry});

        return this.pdfManager.mergePdfs(exportPdfFile,
            exportDir + '/' + exportName + '-toc.lst',
            exportDir + '/' + exportName + '-toc.html',
            processingOptions.tocTemplate,
            pdfFiles,
            processingOptions.trimEmptyPages).then((exportedPdfFile) => {
            if (processingOptions.addPageNumsStartingWith > 0) {
                return this.pdfManager.addPageNumToPdf(exportedPdfFile, processingOptions.addPageNumsStartingWith || 1);
            }

            return Promise.resolve(exportedPdfFile);
        }).then((exportedPdfFile) => {
            console.log('wrote pdfFile', exportedPdfFile);
            return Promise.resolve(generateResults);
        });
    }
}

