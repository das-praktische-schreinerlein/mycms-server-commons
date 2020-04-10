const SpecReporter = require('jasmine-spec-reporter').SpecReporter;
const StacktraceOption = require('jasmine-spec-reporter/built/configuration').StacktraceOption;


jasmine.getEnv().clearReporters();               // remove default reporter logs
const configuration = {
    spec: {
        displayPending: true,
        displayDuration: true,
        displayErrorMessages: true,
        displaySuccessful: true,
        displayFailed: true,
        displayStacktrace: StacktraceOption.PRETTY,
    },
    summary: {
        displayDuration: false,

    }
};
jasmine.getEnv().addReporter(new SpecReporter(configuration));
