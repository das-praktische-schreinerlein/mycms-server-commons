import { CommonAdminCommandResultState, CommonAdminCommandStateType } from '@dps/mycms-commons/dist/commons/model/admin-response';
export declare class CommonCommandStateService {
    protected availableCommands: string[];
    protected commandRunStates: {
        [key: string]: CommonAdminCommandStateType;
    };
    constructor(availableCommands: string[]);
    getAllRunInformation(): Promise<{
        [key: string]: CommonAdminCommandStateType;
    }>;
    getRunInformation(command: string): Promise<CommonAdminCommandStateType>;
    isRunning(command: string): Promise<boolean>;
    isStartable(command: string): Promise<boolean>;
    setCommandStarted(command: string, args: {}): Promise<CommonAdminCommandStateType>;
    setCommandEnded(action: string, args: {}, resultMsg: string, resultState: CommonAdminCommandResultState): Promise<CommonAdminCommandStateType>;
    protected setCommandRunInformation(action: string, state: CommonAdminCommandStateType): Promise<CommonAdminCommandStateType>;
}
