import * as fs from 'fs';
import {ExportProcessingResult} from '@dps/mycms-commons/dist/search-commons/services/cdoc-export.service';
import {ProcessUtils} from '@dps/mycms-commons/dist/commons/utils/process.utils';
import {ProcessingOptions} from '@dps/mycms-commons/dist/search-commons/services/cdoc-search.service';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {CommonDocDataService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import {CommonDocSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import {CommonDocSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';

export interface PdfManagerConfigType {
    nodejsBinaryPath: string
    webshot2pdfCommandPath: string,
}

export abstract class CommonDocPdfManagerModule<DS extends CommonDocDataService<CommonDocRecord, CommonDocSearchForm,
    CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>> {

    protected dataService: DS;
    protected backendConfig: PdfManagerConfigType;
    protected nodePath: string;
    protected webshot2pdfCommandPath: string;

    constructor(dataService: DS, backendConfig: PdfManagerConfigType) {
        this.dataService = dataService;
        this.backendConfig = backendConfig;

        this.nodePath = this.backendConfig.nodejsBinaryPath;
        this.webshot2pdfCommandPath = this.backendConfig.webshot2pdfCommandPath;
        if (!this.nodePath || !this.webshot2pdfCommandPath) {
            console.error('CommonDocPdfManagerModule missing config - nodejsBinaryPath, webshot2pdfCommandPath',
                this.nodePath, this.webshot2pdfCommandPath);
            throw new Error('CommonDocPdfManagerModule missing config - nodejsBinaryPath, webshot2pdfCommandPath');
        }

        console.log('CommonDocPdfManagerModule starting with - nodejsBinaryPath, webshot2pdfCommandPath',
            this.nodePath, this.webshot2pdfCommandPath);
    }

    public generatePdfs(action: string, generateDir: string, generateName: string, baseUrl: string, queryParams: string,
                        processingOptions: ProcessingOptions, searchForm: CommonDocSearchForm, force: boolean): Promise<any> {
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
                me.generatePdf(mdoc, action, generateDir, baseUrl, queryParams, force).then( generateResult => {
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
            return this.generatePdfResultListFile(generateDir, generateName, generateResults);
        });
    }

    public generatePdf(mdoc: CommonDocRecord, action: string, generateDir: string, baseUrl: string, queryParams: string, force: boolean):
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

            return ProcessUtils.executeCommandAsync(this.nodePath, ['--max-old-space-size=8192',
                    this.webshot2pdfCommandPath,
                    url,
                    absDestPath],
                function (buffer) {
                    if (!buffer) {
                        return;
                    }
                    console.log(buffer.toString(), me.webshot2pdfCommandPath,
                        url,
                        absDestPath);
                },
                function (buffer) {
                    if (!buffer) {
                        return;
                    }
                    console.error(buffer.toString());
                }
            ).then(code => {
                if (code !== 0) {
                    const errMsg = 'FAILED - webshot2pdf url: "' + url + '"' +
                        ' file: "' + absDestPath + '" failed returnCode:' + code;
                    console.warn(errMsg)
                    return reject(errMsg);
                }

                const msg = 'SUCCESS - webshot2pdf url: "' + url + '"' +
                    ' file: "' + absDestPath + '" succeeded returnCode:' + code;
                console.log(msg)

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
                const errMsg = 'FAILED - webshot2pdf url: "' + url + '"' +
                    ' file: "' + absDestPath + '" failed returnCode:' + error;
                console.warn(errMsg)
                return reject(errMsg);
            })
        });
    }

    public exportPdfs(action: string, exportDir: string, exportName: string,
                      processingOptions: ProcessingOptions, searchForm: CommonDocSearchForm, force: boolean): Promise<any> {
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
            return this.generatePdfResultListFile(exportDir, exportName, exportResults);
        });
    }

    protected abstract exportCommonDocRecordPdfFile(mdoc: CommonDocRecord, action: string, exportDir: string, exportName: string,
                                                    processingOptions: ProcessingOptions): Promise<ExportProcessingResult<CommonDocRecord>>;


    protected abstract generatePdfFileName(entity: CommonDocRecord): string;

    protected abstract updatePdfEntity(entity: CommonDocRecord, fileName: string): Promise<CommonDocRecord>;

    protected generateWebShotUrl(action: string, baseUrl: string, mdoc: CommonDocRecord, queryParams: string) {
        return baseUrl + '/' + mdoc.id + '?print&' + queryParams;
    }

    protected generatePdfResultListFile(exportDir: string, exportName: string,
                                        generateResults: ExportProcessingResult<CommonDocRecord>[]): Promise<any> {
        const exportListFile = exportDir + '/' + exportName + '.lst';
        if (fs.existsSync(exportListFile) && !fs.statSync(exportListFile).isFile()) {
            return Promise.reject('exportBaseFileName must be file');
        }

        const fileList = generateResults.map(value => {
            return [value.exportFileEntry, value.record.name,  value.record.type, ''].join('\t')
        }).join('\n')

        fs.writeFileSync(exportListFile, fileList);
        console.log('wrote fileList', exportListFile);

        const exportHtmlFile = exportDir + '/' + exportName + '.html';
        if (fs.existsSync(exportHtmlFile) && !fs.statSync(exportHtmlFile).isFile()) {
            return Promise.reject('exportBaseFileName must be file');
        }

        const htmlFileList = generateResults.map(value => {
            const fileName = value.exportFileEntry;
            const name = value.record.name;
            const rtype = value.record.type;
            return `<div class='bookmark_line bookmark_line_$rtype'><div class='bookmark_file'><a href="$fileName" target="_blank">$fileName</a></div><div class='bookmark_name'>$name</div><div class='bookmark_page'></div></div>`
                .replace(/\$fileName/g, fileName)
                .replace(/\$name/g, name)
                .replace(/\$rtype/g, rtype);
        }).join('\n')

        fs.writeFileSync(exportHtmlFile, htmlFileList);
        console.log('wrote htmlFile', exportHtmlFile);

        return Promise.resolve();
    }

}

