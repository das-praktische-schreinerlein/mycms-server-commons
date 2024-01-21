import {ProcessUtils} from '@dps/mycms-commons/dist/commons/utils/process.utils';

export interface PdfManagerConfigType {
    nodejsBinaryPath: string
    webshot2pdfCommandPath: string,
    pdfMergeCommandPath?: string,
    pdfAddPageNumCommandPath?: string
}

export class PdfManager {

    protected backendConfig: PdfManagerConfigType;
    protected nodePath: string;
    protected webshot2pdfCommandPath: string;
    protected pdfMergeCommandPath: string;
    protected pdfAddPageNumCommandPath: string;

    constructor(backendConfig: PdfManagerConfigType) {
        this.backendConfig = backendConfig;

        this.nodePath = this.backendConfig.nodejsBinaryPath;
        this.webshot2pdfCommandPath = this.backendConfig.webshot2pdfCommandPath;
        if (!this.nodePath || !this.webshot2pdfCommandPath) {
            console.error('PdfManagerModule missing config - nodejsBinaryPath, webshot2pdfCommandPath',
                this.nodePath, this.webshot2pdfCommandPath);
            throw new Error('PdfManagerModule missing config - nodejsBinaryPath, webshot2pdfCommandPath');
        }

        this.pdfMergeCommandPath = this.backendConfig.pdfMergeCommandPath;
        this.pdfAddPageNumCommandPath = this.backendConfig.pdfAddPageNumCommandPath;

        console.log('PdfManagerModule starting with - nodejsBinaryPath, webshot2pdfCommandPath' +
            ', pdfMergeCommandPath, pdfAddPageNumCommandPath',
            this.nodePath, this.webshot2pdfCommandPath, this.pdfMergeCommandPath, this.pdfAddPageNumCommandPath);
    }

    public webshot2Pdf(url: string, absDestPath: string): Promise<string> {
        const me = this;

        return new Promise<any>((resolve, reject) => {
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

                return resolve(absDestPath);
            }).catch(error => {
                const errMsg = 'FAILED - webshot2pdf url: "' + url + '"' +
                    ' file: "' + absDestPath + '" failed returnCode:' + error;
                console.warn(errMsg)
                return reject(errMsg);
            })
        });
    }

    public mergePdfs(destFile: string, bookmarkFile: string, tocFile: string, tocTemplate: string, pdfFiles: string[], trim: boolean): Promise<string> {
        const me = this;

        if (!this.nodePath || !this.pdfMergeCommandPath) {
            console.error('PdfManagerModule missing config - nodejsBinaryPath, pdfMergeCommandPath',
                this.nodePath, this.pdfMergeCommandPath);
            throw new Error('PdfManagerModule missing config - nodejsBinaryPath, pdfMergeCommandPath');
        }

        let commandArgs = ['--max-old-space-size=8192',
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
        } else {
            commandArgs = commandArgs.concat(pdfFiles);
        }

        return new Promise<any>((resolve, reject) => {
            return ProcessUtils.executeCommandAsync(this.nodePath, commandArgs,
                function (buffer) {
                    if (!buffer) {
                        return;
                    }
                    console.log(buffer.toString(), me.webshot2pdfCommandPath, pdfFiles);
                },
                function (buffer) {
                    if (!buffer) {
                        return;
                    }
                    console.error(buffer.toString());
                }
            ).then(code => {
                if (code !== 0) {
                    const errMsg = 'FAILED - pdfMerge destFile: "' + destFile + ' files: "' + pdfFiles + '" failed returnCode:' + code;
                    console.warn(errMsg)
                    return reject(errMsg);
                }

                const msg = 'SUCCESS - pdfMerge destFile: "' + destFile + ' files: "' + pdfFiles + '" succeeded returnCode:' + code;
                console.log(msg)

                return resolve(destFile);
            }).catch(error => {
                const errMsg = 'FAILED - pdfMerge destFile: "' + destFile + ' files: "' + pdfFiles + '" failed returnCode:' + error;
                console.warn(errMsg)
                return reject(errMsg);
            })
        });
    }

    public addPageNumToPdf(destFile: string, startingWithNumber: number): Promise<string> {
        const me = this;

        if (!this.nodePath || !this.pdfAddPageNumCommandPath) {
            console.error('PdfManagerModule missing config - nodejsBinaryPath, pdfAddPageNumCommandPath',
                this.nodePath, this.pdfAddPageNumCommandPath);
            throw new Error('PdfManagerModule missing config - nodejsBinaryPath, pdfAddPageNumCommandPath');
        }

        return new Promise<any>((resolve, reject) => {
            return ProcessUtils.executeCommandAsync(this.nodePath, ['--max-old-space-size=8192',
                    this.pdfAddPageNumCommandPath,
                    destFile,
                    startingWithNumber + ''
                ],
                function (buffer) {
                    if (!buffer) {
                        return;
                    }
                    console.log(buffer.toString(), me.webshot2pdfCommandPath, destFile);
                },
                function (buffer) {
                    if (!buffer) {
                        return;
                    }
                    console.error(buffer.toString());
                }
            ).then(code => {
                if (code !== 0) {
                    const errMsg = 'FAILED - addPageNumToPdf destFile: "' + destFile + '" failed returnCode:' + code;
                    console.warn(errMsg)
                    return reject(errMsg);
                }

                const msg = 'SUCCESS - addPageNumToPdf destFile: "' + destFile + '" succeeded returnCode:' + code;
                console.log(msg)

                return resolve(destFile);
            }).catch(error => {
                const errMsg = 'FAILED - addPageNumToPdf destFile:"' + destFile + '" failed returnCode:' + error;
                console.warn(errMsg)
                return reject(errMsg);
            })
        });
    }

}

