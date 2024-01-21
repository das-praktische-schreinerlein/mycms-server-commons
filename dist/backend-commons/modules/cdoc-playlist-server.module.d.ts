import * as express from 'express';
import { CommonDocRecord } from '@dps/mycms-commons/dist/search-commons/model/records/cdoc-entity-record';
import { CommonDocSearchForm } from '@dps/mycms-commons/dist/search-commons/model/forms/cdoc-searchform';
import { CommonDocSearchResult } from '@dps/mycms-commons/dist/search-commons/model/container/cdoc-searchresult';
import { CommonDocDataService } from '@dps/mycms-commons/dist/search-commons/services/cdoc-data.service';
import { CommonDocPlaylistExporter } from '@dps/mycms-commons/dist/search-commons/services/cdoc-playlist-exporter';
import { CommonBackendConfigType, CommonKeywordMapperConfigType } from './backend.commons';
import { CacheConfig } from '../../server-commons/datacache.module';
export declare abstract class CommonDocPlaylistServerModule<R extends CommonDocRecord, F extends CommonDocSearchForm, S extends CommonDocSearchResult<R, F>, D extends CommonDocDataService<R, F, S>> {
    protected dataService: D;
    protected playlistExporter: CommonDocPlaylistExporter<R, F, S, D>;
    static configurePlaylistServerRoutes(app: express.Application, apiPrefix: string, cdocPlaylistServerModule: CommonDocPlaylistServerModule<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>, CommonDocDataService<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>>, backendConfig: any | CommonBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>): void;
    static configureCsvPlaylistServerRoutes(app: express.Application, apiPrefix: string, cdocPlaylistServerModule: CommonDocPlaylistServerModule<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>, CommonDocDataService<CommonDocRecord, CommonDocSearchForm, CommonDocSearchResult<CommonDocRecord, CommonDocSearchForm>>>, backendConfig: any | CommonBackendConfigType<CommonKeywordMapperConfigType, CacheConfig>): void;
    constructor(dataService: D, playlistExporter: CommonDocPlaylistExporter<R, F, S, D>);
    abstract getApiId(): string;
    getDataService(): D;
    abstract isSearchFormValid(searchForm: CommonDocSearchForm): boolean;
}
