import * as Promise_serial from 'promise-serial';
import {FileUtils} from '@dps/mycms-commons/dist/commons/utils/file.utils';
import * as fs from 'fs';
import * as path from 'path';
import {ProcessUtils} from '@dps/mycms-commons/dist/commons/utils/process.utils';

export class ViewerManagerModule {

    public inlineDataOnViewerFile(nodePath, inlineCommandPath: string, srcHtmlFile: string, destFile: string): Promise<any> {
        return ProcessUtils.executeCommandAsync(nodePath, ['--max-old-space-size=8192',
                inlineCommandPath,
                srcHtmlFile,
                destFile,
                'inlineexport'],
            function (buffer) {
                if (!buffer) {
                    return;
                }
                console.log(buffer.toString());
            },
            function (buffer) {
                if (!buffer) {
                    return;
                }
                console.error(buffer.toString());
            },
        ).then(code => {
            if (code !== 0) {
                return Promise.reject('inlining ' + srcHtmlFile + ' failed returnCode:' + code);
            }

            return Promise.resolve('inlining ' + srcHtmlFile + ' succeeded returnCode:' + code);
        }).catch(error => {
            return Promise.reject('inlining ' + srcHtmlFile + ' failed error:' + error);
        });
    }

    public generateViewerHtmlFile(srcHtmlFile: string, jsonExportFiles: string[], targetHtmlFile: string, chunkSize: number,
                                  parent: string, htmlConfigConverter: Function,
                                  jsonToJsTargetContentConverter: Function,
                                  htmlInlineFileConverter: Function): Promise<string> {
        const me = this;
        console.log('copy htmlViewer and inline json', srcHtmlFile, targetHtmlFile, jsonExportFiles);
        return FileUtils.copyFile(srcHtmlFile, targetHtmlFile, false, false, true, false)
            .then(() => {
                let html = '';
                try {
                    html = fs.readFileSync(targetHtmlFile, {encoding: 'utf8'});
                } catch (err) {
                    return Promise.reject(err);
                }

                if (htmlConfigConverter) {
                    html = htmlConfigConverter.call(me, html);
                }

                const promises = [];
                for (const jsonExportFile of jsonExportFiles) {
                    const jsonDestDir = path.dirname(jsonExportFile);
                    const jsonBaseFile = path.basename(jsonExportFile).replace(path.extname(jsonExportFile), '');
                    promises.push(
                        function () {
                            return FileUtils.deleteFilesInDirectoryByPattern(jsonDestDir + '/' + jsonBaseFile, '.js')
                                .then(() => {
                                    console.log('split jsonExportFile', jsonExportFile);
                                    return FileUtils.splitJsonFile(jsonExportFile, jsonDestDir + '/' + jsonBaseFile,
                                        '.js',
                                        chunkSize,
                                        parent,
                                        jsonToJsTargetContentConverter)
                                }).then((files) => {
                                    if (htmlInlineFileConverter) {
                                        for (const file of files) {
                                            html = htmlInlineFileConverter.call(me, html, file);
                                        }
                                    }

                                    return Promise.resolve(files);
                                });
                        }
                    );
                }

                return Promise_serial(promises, {parallelize: 1}).then((files) => {
                    try {
                        console.log('write target with inlined files', targetHtmlFile, files);
                        fs.writeFileSync(targetHtmlFile, html);
                    } catch (err) {
                        return Promise.reject(err);
                    }

                    return Promise.resolve(targetHtmlFile);
                }).catch(reason => {
                    return Promise.reject(reason);
                });
            }).catch(reason => {
                return Promise.reject(reason);
            });
    }

    public jsonToJsTargetContentConverter(result: string, jsonPFileName: string, jsonPName): string {
        result = result.replace(/([`\\])/g, '\\$1');

        return `window.${jsonPName} = \`\n`
            + result
            +  `\`\nvar script = document.createElement("script");
script.type='application/json';
script.id = '` + path.basename(jsonPFileName) + `';
var text = document.createTextNode(${jsonPName});
script.appendChild(text);
document.head.appendChild(script);`;
    };

    public htmlConfigConverter(html: string, dataFileConfigName: string): string {
        // removing samples from config
        const regExp = new RegExp(dataFileConfigName + '": \\[.*"tracksBaseUrl', 'g');
        html = html.replace(regExp,
            dataFileConfigName + '": ["assets/staticdata/samples-static.mytbtdocs_videos_export_chunk0.js"], "tracksBaseUrl');
        // configure assets-path
        html = html.replace(/"tracksBaseUrl": .* "videoBaseUrl": "assets\/staticdata\/"/,
            '"tracksBaseUrl": "./tracks/",    "picsBaseUrl": "./",    "videoBaseUrl": "./"');
        html = html.replace(/"audioBaseUrl": .* "videoBaseUrl": "assets\/staticdata\/"/,
            '"audioBaseUrl": "./",    "picsBaseUrl": "./",    "videoBaseUrl": "./"');

        return html
    };

    public htmlInlineFileConverter(html: string, jsonPFilePath: string, dataFileConfigName: string): string {
        const fileName = path.basename(jsonPFilePath);
        html = html.replace(/<\/head>/g,
            '\n  <script inlineexport type="text/javascript" src="' + fileName + '"></script>\n</head>');
        const regExp = new RegExp(dataFileConfigName + '": \\[', 'g');
        html = html.replace(regExp,
            dataFileConfigName + '": ["' + fileName + '", ');

        return html;
    }


}
