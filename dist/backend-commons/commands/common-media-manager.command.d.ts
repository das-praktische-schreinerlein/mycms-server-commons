import { AbstractCommand } from './abstract.command';
export declare class CommonMediaManagerCommand implements AbstractCommand {
    private backendConfig;
    constructor(backendConfig: {});
    process(argv: any): Promise<any>;
}
