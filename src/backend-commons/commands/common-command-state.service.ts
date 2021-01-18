import {
    CommonAdminCommandResultState,
    CommonAdminCommandState,
    CommonAdminCommandStateType
} from '@dps/mycms-commons/dist/commons/model/admin-response';

export class CommonCommandStateService {
    protected commandRunStates: {[key: string]: CommonAdminCommandStateType} = {};

    public getAllRunInformation(): Promise<{[key: string]: CommonAdminCommandStateType}> {
        const res: {[key: string]: CommonAdminCommandStateType} = {};
        for (const command of Object.keys(this.commandRunStates)) {
            res[command] = {...this.commandRunStates[command]};
        }

        return Promise.resolve(res);
    };

    public getRunInformation(command: string): Promise<CommonAdminCommandStateType> {
        return Promise.resolve({...this.commandRunStates[command]});
    };

    public isRunning(command: string): Promise<boolean> {
        if (this.commandRunStates[command] && this.commandRunStates[command].state === CommonAdminCommandState.RUNNING) {
            return Promise.resolve(true);
        }

        return Promise.resolve(false);
    };

    public isStartable(command: string): Promise<boolean> {
        return this.isRunning(command).then(running => {
            return Promise.resolve(!running);
        })
    };

    public setCommandStarted(command: string, args: {}): Promise<CommonAdminCommandStateType> {
        const state: CommonAdminCommandStateType = {
            command: command,
            state: CommonAdminCommandState.RUNNING,
            resultState: CommonAdminCommandResultState.RUNNING,
            started: new Date(),
            ended: undefined,
            resultMsg: undefined
        };

        return this.setCommandRunInformation(command, state);
    };

    public setCommandEnded(action: string, args: {}, resultMsg: string, resultState: CommonAdminCommandResultState)
        : Promise<CommonAdminCommandStateType> {
        return this.getRunInformation(action).then(oldState => {
            const state: CommonAdminCommandStateType = {
                ...oldState,
                state: CommonAdminCommandState.AVAILABLE,
                resultState: resultState,
                ended: new Date(),
                resultMsg: resultMsg
            };

            return this.setCommandRunInformation(action, state);
        })
    };

    protected setCommandRunInformation(action: string, state: CommonAdminCommandStateType): Promise<CommonAdminCommandStateType> {
        this.commandRunStates[action] = {...state};

        return Promise.resolve(state);
    };

}

