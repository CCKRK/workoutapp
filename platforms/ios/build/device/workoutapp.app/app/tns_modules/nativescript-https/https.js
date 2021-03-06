"use strict";
var types_1 = require("utils/types");
var policies = {
    def: AFSecurityPolicy.defaultPolicy(),
    secured: false,
};
policies.def.allowInvalidCertificates = true;
policies.def.validatesDomainName = false;
function enableSSLPinning(options) {
    if (!policies.secure) {
        policies.secure = AFSecurityPolicy.policyWithPinningMode(1);
        var allowInvalidCertificates = (types_1.isDefined(options.allowInvalidCertificates)) ? options.allowInvalidCertificates : false;
        policies.secure.allowInvalidCertificates = allowInvalidCertificates;
        var validatesDomainName = (types_1.isDefined(options.validatesDomainName)) ? options.validatesDomainName : true;
        policies.secure.validatesDomainName = validatesDomainName;
        var data = NSData.dataWithContentsOfFile(options.certificate);
        policies.secure.pinnedCertificates = NSSet.setWithObject(data);
    }
    policies.secured = true;
    console.log('nativescript-https > Enabled SSL pinning');
}
exports.enableSSLPinning = enableSSLPinning;
function disableSSLPinning() {
    policies.secured = false;
    console.log('nativescript-https > Disabled SSL pinning');
}
exports.disableSSLPinning = disableSSLPinning;
console.info('nativescript-https > Disabled SSL pinning by default');
function AFSuccess(resolve, task, dict) {
    var content = {};
    dict.enumerateKeysAndObjectsUsingBlock(function (k, v) {
        content[k] = v;
    });
    resolve({ task: task, content: content });
}
function AFFailure(resolve, reject, task, error) {
    var data = error.userInfo.valueForKey(AFNetworkingOperationFailingURLResponseDataErrorKey);
    var body = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding);
    var content = {};
    try {
        content = JSON.parse(body.description);
    }
    catch (e) {
        content = error.description;
        if (policies.secured == true) {
            content = 'nativescript-https > Invalid SSL certificate! ' + content;
            return reject(content);
        }
    }
    resolve({ task: task, content: content });
}
function request(opts) {
    return new Promise(function (resolve, reject) {
        try {
            var manager_1 = AFHTTPSessionManager.manager();
            manager_1.requestSerializer = AFJSONRequestSerializer.serializer();
            manager_1.requestSerializer.allowsCellularAccess = true;
            manager_1.securityPolicy = (policies.secured == true) ? policies.secure : policies.def;
            var heads_1 = opts.headers;
            Object.keys(heads_1).forEach(function (key) {
                manager_1.requestSerializer.setValueForHTTPHeaderField(heads_1[key], key);
            });
            if (opts.method == 'GET') {
                manager_1.GETParametersSuccessFailure(opts.url, null, function success(task, dict) {
                    AFSuccess(resolve, task, dict);
                }, function failure(task, error) {
                    AFFailure(resolve, reject, task, error);
                });
            }
            else if (opts.method == 'POST') {
                var cont_1 = JSON.parse(opts.content);
                var dict_1 = NSMutableDictionary.new();
                Object.keys(cont_1).forEach(function (key) {
                    dict_1.setValueForKey(cont_1[key], key);
                });
                manager_1.POSTParametersSuccessFailure(opts.url, dict_1, function success(task, dict) {
                    AFSuccess(resolve, task, dict);
                }, function failure(task, error) {
                    AFFailure(resolve, reject, task, error);
                });
            }
        }
        catch (error) {
            reject(error);
        }
    }).then(function (AFResponse) {
        var response = AFResponse.task.response;
        if (types_1.isNullOrUndefined(response)) {
            return Promise.reject(AFResponse.content);
        }
        var content = AFResponse.content;
        var statusCode = response.statusCode;
        var headers = {};
        var dict = response.allHeaderFields;
        dict.enumerateKeysAndObjectsUsingBlock(function (k, v) {
            headers[k] = v;
        });
        return Promise.resolve({ content: content, statusCode: statusCode, headers: headers });
    });
}
exports.request = request;
//# sourceMappingURL=https.js.map