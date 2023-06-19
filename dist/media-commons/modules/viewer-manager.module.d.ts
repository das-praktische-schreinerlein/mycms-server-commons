export declare class ViewerManagerModule {
    inlineDataOnViewerFile(nodePath: any, inlineCommandPath: string, srcHtmlFile: string, destFile: string, inlineProfile?: string): Promise<any>;
    generateViewerHtmlFile(srcHtmlFile: string, jsonExportFiles: string[], targetHtmlFile: string, chunkSize: number, parent: string, htmlConfigConverter: Function, jsonToJsTargetContentConverter: Function, htmlInlineFileConverter: Function): Promise<string>;
    fullJsonToJsTargetContentConverter(result: string, jsonPFileName: string, jsonPName: any): string;
    jsonToJsTargetContentConverter(result: string, jsonPFileName: string, jsonPName: any): string;
    htmlConfigConverter(html: string, dataFileConfigName: string): string;
    htmlInlineFileConverter(html: string, jsonPFilePath: string, dataFileConfigName: string): string;
}
