import {CommonSqlConnectionConfigType} from "../../backend-commons/modules/backend.commons";

export interface CommonPDocBackendConfigType<S extends CommonSqlConnectionConfigType<any, any>> {
    filePathPDocJson?: string,
    filePathPagesJson?: string,
    filePathThemeFilterJson: string,
    startPDocApi: boolean;
    pdocDataStoreAdapter: string,
    pdocWritable: boolean,
    PDocSqlAdapter: S,
    PDocSolrAdapter: {
        solrCorePDoc: string,
        solrCorePDocReadUsername: string,
        solrCorePDocReadPassword: string
    }
}
