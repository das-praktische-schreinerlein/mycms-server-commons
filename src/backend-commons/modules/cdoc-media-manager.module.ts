import {utils} from 'js-data';
import {BeanUtils} from '@dps/mycms-commons/dist/commons/utils/bean.utils';
import * as readdirp from 'readdirp';
import {MediaManagerModule} from '../../media-commons/modules/media-manager.module';
import * as ffmpeg from 'fluent-ffmpeg';
import * as Promise_serial from 'promise-serial';
import {GenericSearchOptions} from '@dps/mycms-commons/dist/search-commons/services/generic-search.service';
import {CommonDocRecord} from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import {CommonDocSearchForm} from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import {CommonDocSearchResult} from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import {CommonDocDataService} from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import {BaseImageRecordType} from '@dps/mycms-commons/dist/search-commons/model/records/baseimage-record';
import {BaseVideoRecordType} from '@dps/mycms-commons/dist/search-commons/model/records/basevideo-record';
import {
    CommonImageBackendConfigType,
    CommonKeywordMapperConfigType,
    CommonVideoBackendConfigType
} from "./backend.commons";
import {CacheConfig} from "../../server-commons/datacache.module";

export interface FileInfoType {
    created: Date;
    lastModified: Date;
    exifDate: Date;
    name: string;
    dir: string;
    size: number;
    type: string;
}
export type FileSystemDBSyncMatchingType = 'EXIFDATE' | 'FILEDATE' | 'FILENAME' | 'FILEDIRANDNAME' | 'FILESIZE' | 'FILENAMEANDDATE'
    | 'SIMILARITY';
export interface DBFileInfoType extends FileInfoType {
    id: string;
    matching: FileSystemDBSyncMatchingType;
    matchingDetails: string;
    matchingScore: number;
}
export interface FileSystemDBSyncType {
    file: FileInfoType;
    records: DBFileInfoType[];
}

export interface ProcessingOptions {
    ignoreErrors: number;
    parallel: number
}

export abstract class CommonDocMediaManagerModule<R extends CommonDocRecord, F extends CommonDocSearchForm,
    S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>> {
    protected readonly dataService: D;
    protected readonly backendConfig: CommonImageBackendConfigType<CommonKeywordMapperConfigType, CacheConfig> & CommonVideoBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>;
    protected readonly mediaManager: MediaManagerModule;

    public static mapDBResultOnFileInfoType(dbResult: any, records: DBFileInfoType[]): void {
        for (let i = 0; i <= dbResult.length; i++) {
            if (dbResult[i] !== undefined) {
                const entry: DBFileInfoType = {
                    dir: undefined,
                    exifDate: undefined,
                    id: undefined,
                    created: undefined,
                    lastModified: undefined,
                    matching: undefined,
                    matchingDetails: undefined,
                    matchingScore: undefined,
                    name: undefined,
                    size: undefined,
                    type: undefined
                };
                for (const key in dbResult[i]) {
                    if (dbResult[i].hasOwnProperty(key)) {
                        entry[key] = dbResult[i][key];
                    }
                }
                records.push(entry);
            }
        }
    }

    protected constructor(backendConfig: CommonImageBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>
        & CommonVideoBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>, dataService: D,
                          mediaManager: MediaManagerModule) {
        this.dataService = dataService;
        this.backendConfig = backendConfig;
        this.mediaManager = mediaManager;
    }

    public abstract readMetadataForCommonDocRecord(tdoc: R): Promise<{}>;

    public abstract updateDateOfCommonDocRecord(tdoc: R, date: Date): Promise<{}>;

    public abstract scaleCommonDocRecordMediaWidth(tdoc: R, width: number): Promise<{}>;

    public abstract findCommonDocRecordsForFileInfo(baseDir: string, fileInfo: FileInfoType,
                                                    additionalMappings: {[key: string]: FileSystemDBSyncType}): Promise<DBFileInfoType[]>;


    public getFileExtensionToTypeMappings(): {} {
        return {
            'jpg': 'IMAGE',
            'jpeg': 'IMAGE',
            'JPG': 'IMAGE',
            'JPEG': 'IMAGE',
            'MP4': 'VIDEO',
            'mp4': 'VIDEO'
        };
    }
    public readAndUpdateMediaDates(searchForm: F, processingOptions: ProcessingOptions): Promise<{}> {
        const me = this;
        const callback = function(tdoc: R): Promise<{}>[] {
            return [me.readAndUpdateDateFromCommonDocRecord(tdoc)];
        };

        return this.batchProcessSearchResult(searchForm, callback, {
            loadDetailsMode: undefined,
            loadTrack: false,
            showFacets: false,
            showForm: false
        }, processingOptions);
    }

    public scaleImagesToDefaultWidth(searchForm: F, processingOptions: ProcessingOptions): Promise<{}> {
        const me = this;
        const callback = function(tdoc: R): Promise<{}>[] {
            return [me.scaleCommonDocRecordMediaWidth(tdoc, 100),
                me.scaleCommonDocRecordMediaWidth(tdoc, 300),
                me.scaleCommonDocRecordMediaWidth(tdoc, 600)];
        };

        return this.batchProcessSearchResult(searchForm, callback, {
            loadDetailsMode: undefined,
            loadTrack: false,
            showFacets: false,
            showForm: false
        }, processingOptions);
    }

    public readAndUpdateDateFromCommonDocRecord(tdoc: R): Promise<{}> {
        const me = this;
        return this.readMetadataForCommonDocRecord(tdoc).then(value => {
            // Exif-dates are not in UTC they are in localtimezone
            if (value === undefined || value === null) {
                console.warn('no exif found for ' + tdoc.id + ' details:' + tdoc);
                return utils.resolve({});
            }

            let creationDate = BeanUtils.getValue(value, 'exif.DateTimeOriginal');
            if (creationDate === undefined || creationDate === null) {
                creationDate = new Date(BeanUtils.getValue(value, 'format.tags.creation_time'));
            }

            if (creationDate === undefined || creationDate === null) {
                console.warn('no exif.DateTimeOriginal or format.tags.creation_time found for ' + tdoc.id +
                    ' details:' + tdoc + ' exif:' + creationDate);
                return utils.resolve({});
            }

            const myDate = new Date();
            myDate.setHours(creationDate.getUTCHours(), creationDate.getUTCMinutes(), creationDate.getUTCSeconds(),
                creationDate.getUTCMilliseconds());
            myDate.setFullYear(creationDate.getUTCFullYear(), creationDate.getUTCMonth(), creationDate.getUTCDate());

            return me.updateDateOfCommonDocRecord(tdoc, myDate);
        });
    }

    public findCorrespondingCommonDocRecordsForMedia(baseDir: string, additionalMappings: {[key: string]: FileSystemDBSyncType}):
        Promise<FileSystemDBSyncType[]> {
        const me = this;
        const mediaTypes = this.getFileExtensionToTypeMappings();
        const fileExtensions = [];
        // tslint:disable-next-line:forin
        for (const mediaType in mediaTypes) {
            fileExtensions.push('*.' + mediaType);
        }
        const settings = {
            root: baseDir,
            entryType: 'files',
            // Filter files with js and json extension
            fileFilter: fileExtensions,
            // Filter by directory
            directoryFilter: [ '!.git', '!*modules' ],
            // Work with files up to 1 subdirectory deep
            depth: 10
        };

        const entries: FileSystemDBSyncType[] = [];

        return new Promise<FileSystemDBSyncType[]>((resolve, reject) => {
            readdirp(settings, function fileCallBack(fileRes) {
                const path = fileRes['path'].replace(/\\/g, '/');
                const file = fileRes['name'].replace(/\\/g, '/');
                const dir = fileRes['parentDir'].replace(/\\/g, '/');
                const cdate = fileRes['stat']['ctime'];
                const mdate = fileRes['stat']['mtime'];
                const size = fileRes['stat']['size'];
                const extension = file.split('.').splice(-1);
                const type = mediaTypes[extension];
                if (type === undefined) {
                    console.warn('SKIP file - unknown extension', path);
                    return;
                }

                const fileInfo: FileInfoType = {
                    dir: dir,
                    created: cdate,
                    lastModified: mdate,
                    exifDate: undefined,
                    name: file,
                    size: size,
                    type: type
                };
                const records: DBFileInfoType[] = [];
                entries.push({file: fileInfo, records: records});
            }, function allCallBack(errors) {
                if (errors) {
                    errors.forEach(function (err) {
                        return reject(err);
                    });
                }
                resolve(entries);
            });
        }).then(fileSystemCommonDocSyncEntries => {
            const promises = fileSystemCommonDocSyncEntries.map(fileSystemCommonDocSyncEntry => {
                return function () {
                    return me.findCommonDocRecordsForFileInfo(baseDir, fileSystemCommonDocSyncEntry.file, additionalMappings)
                        .then(records => {
                            if (records !== undefined) {
                                fileSystemCommonDocSyncEntry.records = records;
                            }
                            return utils.resolve(true);
                        }).catch(function onError(error) {
                            return utils.reject(error);
                        });
                };
            });
            const results = Promise_serial(promises, {parallelize: 1});

            return results.then(() => {
                return utils.resolve(fileSystemCommonDocSyncEntries);
            }).catch(errors => {
                return utils.reject(errors);
            });
        });
    }

    public readExifForCommonDocImageRecord(tdocImage: BaseImageRecordType): Promise<{}> {
        return this.mediaManager.readExifForImage(this.backendConfig.apiRoutePicturesStaticDir + '/'
            + (this.backendConfig.apiRouteStoredPicturesResolutionPrefix || '') + 'full/' +  tdocImage.fileName);
    }

    public readMetadataForCommonDocVideoRecord(tdocVideo: BaseVideoRecordType): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            ffmpeg.ffprobe(this.backendConfig.apiRouteVideosStaticDir + '/'
                + (this.backendConfig.apiRouteStoredVideosResolutionPrefix || '') + 'full/' +  tdocVideo.fileName,
                function(err, metadata) {
                    if (err) {
                        reject('error while reading video-metadata: ' + err);
                    }

                    resolve(metadata);
                });
        });
    }

    public scaleCommonDocImageRecord(tdocImage: BaseImageRecordType, width: number): Promise<{}> {
        return this.mediaManager.scaleImage(this.backendConfig.apiRoutePicturesStaticDir + '/'
            + (this.backendConfig.apiRouteStoredPicturesResolutionPrefix || '') + 'full/' +  tdocImage.fileName,
            this.backendConfig.apiRoutePicturesStaticDir + '/'
            + (this.backendConfig.apiRouteStoredPicturesResolutionPrefix || '') + 'x' + width + '/' +  tdocImage.fileName,
            width);
    }

    protected batchProcessSearchResult(searchForm: F, cb: (tdoc: R) => Promise<{}>[], opts: GenericSearchOptions,
                                       processingOptions: ProcessingOptions): Promise<{}> {
        searchForm.perPage = processingOptions.parallel;
        searchForm.pageNum = Number.isInteger(searchForm.pageNum) ? searchForm.pageNum : 1;

        const me = this;
        const startTime = (new Date()).getTime();
        let errorCount = 0;
        const readNextPage = function(): Promise<any> {
            const startTime2 = (new Date()).getTime();
            return me.dataService.search(searchForm, opts).then(
                function searchDone(searchResult: S) {
                    let promises: Promise<any>[] = [];
                    for (const tdoc of searchResult.currentRecords) {
                        promises = promises.concat(cb(tdoc));
                    }

                    const processResults = function(): Promise<any> {
                        const durWhole = ((new Date()).getTime() - startTime + 1) / 1000 ;
                        const dur = ((new Date()).getTime() - startTime2 + 1) / 1000;
                        const alreadyDone = searchForm.pageNum * searchForm.perPage;
                        const performance = searchResult.currentRecords.length / dur;
                        const performanceWhole = alreadyDone / durWhole;
                        console.log('DONE processed page ' +
                            searchForm.pageNum +
                            ' [' + ((searchForm.pageNum - 1) * searchForm.perPage + 1) +
                            '-' + alreadyDone + ']' +
                            ' / ' + Math.round(searchResult.recordCount / searchForm.perPage + 1) +
                            ' [' + searchResult.recordCount + ']' +
                            ' in ' + Math.round(dur + 1) + ' (' + Math.round(durWhole + 1) + ') s' +
                            ' with ' + Math.round(performance + 1) + ' ('  + Math.round(performanceWhole + 1) + ') per s' +
                            ' approximately ' + Math.round(((searchResult.recordCount - alreadyDone) / performance + 1) / 60) + 'min left'
                        );
                        searchForm.pageNum++;

                        if (searchForm.pageNum < (searchResult.recordCount / searchForm.perPage + 1)) {
                            return readNextPage();
                        } else {
                            return utils.resolve('WELL DONE');
                        }
                    };

                    return Promise.all(promises).then(() => {
                        return processResults();
                    }).catch(reason => {
                        errorCount = errorCount + 1;
                        if (processingOptions.ignoreErrors > errorCount) {
                            console.warn('SKIP ERROR: ' + errorCount + ' of possible ' + processingOptions.ignoreErrors, reason);
                            return processResults();
                        }

                        console.error('UNSKIPPABLE ERROR: ' + errorCount + ' of possible ' + processingOptions.ignoreErrors, reason);
                        return utils.reject(reason);
                    });
                }
            ).catch(function searchError(error) {
                console.error('error thrown: ', error);
                return utils.reject(error);
            });
        };

        return readNextPage();
    }
}
