export class ServerLogUtils {
    public static sanitizeLogMsg(msg: any): string {
        if (msg === undefined) {
            return undefined;
        }

        return (msg + '').replace(/[^-A-Za-z0-9äöüßÄÖÜ/+;,:._*]*/gi, '');
    }
}
