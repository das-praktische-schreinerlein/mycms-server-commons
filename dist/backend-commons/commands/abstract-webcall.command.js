"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var common_admin_command_1 = require("./common-admin.command");
var Promise_serial = require("promise-serial");
var js_data_1 = require("js-data");
var AbstractWebRequestCommand = /** @class */ (function (_super) {
    __extends(AbstractWebRequestCommand, _super);
    function AbstractWebRequestCommand() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbstractWebRequestCommand.prototype.processCommandArgs = function (argv) {
        var _this = this;
        var webRequests = [];
        return this.configureWebRequestCommandOptions(argv).then(function (webRequestCommandOptions) {
            return _this.configureRequests(webRequestCommandOptions, webRequests);
        }).then(function (webRequestCommandOptions) {
            return _this.executeRequests(webRequestCommandOptions, webRequests);
        });
    };
    AbstractWebRequestCommand.prototype.executeRequests = function (webRequestCommandOptions, webRequests) {
        var me = this;
        var webRequestPromises = [];
        var _loop_1 = function (webRequest) {
            webRequestPromises.push(function () {
                return me.executeRequest(webRequestCommandOptions, webRequest);
            });
        };
        for (var _i = 0, webRequests_1 = webRequests; _i < webRequests_1.length; _i++) {
            var webRequest = webRequests_1[_i];
            _loop_1(webRequest);
        }
        return Promise_serial(webRequestPromises, { parallelize: 1 }).then(function () {
            return js_data_1.utils.resolve('DONE - executed webrequest');
        }).catch(function (reason) {
            return js_data_1.utils.reject(reason);
        });
    };
    ;
    AbstractWebRequestCommand.prototype.executeRequest = function (webRequestCommandOptions, webRequest) {
        console.log('webcommand - execute webrequest', webRequest.method, webRequest.url);
        return axios_1.default.request({
            url: webRequest.url,
            auth: webRequest.auth,
            method: webRequest.method,
            headers: webRequest.headers,
            data: webRequest.data,
            params: webRequest.params
        }).then(function (response) {
            if (response.status !== 200) {
                return Promise.reject('ERROR - cant load url: ' + response.status);
            }
            return Promise.resolve('DONE - url loaded');
        }).catch(function (error) {
            return Promise.reject('ERROR - cant load url: "' + error + '"');
        });
    };
    return AbstractWebRequestCommand;
}(common_admin_command_1.CommonAdminCommand));
exports.AbstractWebRequestCommand = AbstractWebRequestCommand;
//# sourceMappingURL=abstract-webcall.command.js.map