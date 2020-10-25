import { FacetCacheUsageConfigurations } from '@dps/mycms-commons/dist/search-commons/services/sql-query.builder';
import { FacetCacheConfiguration } from '@dps/mycms-commons/dist/facetcache-commons/model/facetcache.configuration';
import { CacheConfig } from '../../server-commons/datacache.module';
export interface CommonKeywordMapperConfigType {
    allowedKeywordPatterns: string[];
    replaceKeywordPatterns: string[];
}
export interface CommonSqlConnectionConfigType<FU extends FacetCacheUsageConfigurations, FC extends FacetCacheConfiguration> {
    client: 'sqlite3' | 'mysql';
    connection: {
        host: string;
        user: string;
        password: string;
        database: string;
        port: string;
        filename?: string;
    };
    facetCacheUsage: FU;
    facetCacheConfig: FC;
}
export interface CommonBackendConfigType<K extends CommonKeywordMapperConfigType, C extends CacheConfig> {
    filePathPDocJson: string;
    filePathThemeFilterJson: string;
    apiAnonymizeMedia: boolean;
    playlistExportMaxM3uRecordAllowed: number;
    imageMagicAppPath: string;
    mapperConfig: K;
    cacheConfig: C;
    port: number;
    corsOrigin: boolean;
}
export interface CommonImageBackendConfigType<K extends CommonKeywordMapperConfigType, C extends CacheConfig> extends CommonBackendConfigType<K, C> {
    apiImageServerEnabled: boolean;
    apiRoutePictures: string;
    apiRoutePicturesStaticDir: string;
    apiRoutePicturesStaticEnabled: boolean;
    apiRouteStoredPictures: string;
    apiRouteStoredPicturesResolutionPrefix: string;
    playlistExportImageBaseUrl: string;
    playlistExportUseImageAssetStoreUrls: boolean;
    playlistExportUseVideoAssetStoreUrls: boolean;
    proxyPicturesRouteToUrl: string;
    imageMagicAppPath: string;
}
export interface CommonAudioBackendConfigType<K extends CommonKeywordMapperConfigType, C extends CacheConfig> extends CommonBackendConfigType<K, C> {
    apiAudioServerEnabled: boolean;
    apiRouteAudios: string;
    apiRouteAudiosStaticDir: string;
    apiRouteAudiosStaticEnabled: boolean;
    apiRouteStoredAudios: string;
    apiRouteStoredAudiosResolutionPrefix: string;
    playlistExportAudioBaseUrl: string;
    playlistExportUseAudioAssetStoreUrls: boolean;
    proxyAudiosRouteToUrl: string;
    imageMagicAppPath: string;
}
export interface CommonVideoBackendConfigType<K extends CommonKeywordMapperConfigType, C extends CacheConfig> extends CommonBackendConfigType<K, C> {
    apiVideoServerEnabled: boolean;
    apiRouteVideos: string;
    apiRouteVideosStaticDir: string;
    apiRouteVideosStaticEnabled: boolean;
    apiRouteStoredVideos: string;
    apiRouteStoredVideosResolutionPrefix: string;
    playlistExportVideoBaseUrl: string;
    playlistExportUseVideoAssetStoreUrls: boolean;
    proxyVideosRouteToUrl: string;
}
