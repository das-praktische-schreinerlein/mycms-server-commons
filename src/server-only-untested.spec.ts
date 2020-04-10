// import untested service for code-coverage
import {ServerLogUtils} from "./server-commons/serverlog.utils";

for (const a in [
    ServerLogUtils
]) {
    console.log('import unused modules for codecoverage');
}

describe('Dummy-Test', () => {
    it('should be true', () => {
        expect(true).toBeTruthy();
    });
});
