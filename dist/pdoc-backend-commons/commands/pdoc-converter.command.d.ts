import { ValidationRule } from '@dps/mycms-commons/dist/search-commons/model/forms/generic-validator.util';
import { CommonAdminCommand } from '../../backend-commons/commands/common-admin.command';
import { PDocRecord } from '@dps/mycms-commons/dist/pdoc-commons/model/records/pdoc-record';
import { GenericAdapterResponseMapper } from '@dps/mycms-commons/dist/search-commons/services/generic-adapter-response.mapper';
export declare class PDocConverterCommand extends CommonAdminCommand {
    protected createValidationRules(): {
        [key: string]: ValidationRule;
    };
    protected definePossibleActions(): string[];
    protected processCommandArgs(argv: {}): Promise<any>;
    protected migrateLegacyPDocRecord(doc: PDocRecord, profiles: string, langkeys: string): void;
    protected migratePDocRecordToMapperFile(responseMapper: GenericAdapterResponseMapper, doc: PDocRecord): {};
}
