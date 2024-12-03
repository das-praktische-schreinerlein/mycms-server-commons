export interface PdfManagerConfigType {
    nodejsBinaryPath: string;
    webshot2pdfCommandPath: string;
    pdfMergeCommandPath?: string;
    pdfAddPageNumCommandPath?: string;
}
export declare class PdfManager {
    protected backendConfig: PdfManagerConfigType;
    protected nodePath: string;
    protected webshot2pdfCommandPath: string;
    protected pdfMergeCommandPath: string;
    protected pdfAddPageNumCommandPath: string;
    constructor(backendConfig: PdfManagerConfigType);
    webshot2Pdf(url: string, absDestPath: string, width?: number, delay?: number): Promise<string>;
    mergePdfs(destFile: string, bookmarkFile: string, tocFile: string, tocTemplate: string, pdfFiles: string[], trim: boolean): Promise<string>;
    addPageNumToPdf(destFile: string, startingWithNumber: number): Promise<string>;
}
