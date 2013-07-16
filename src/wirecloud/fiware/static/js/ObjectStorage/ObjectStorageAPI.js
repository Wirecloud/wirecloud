/*global MashupPlatform*/

(function () {

    "use strict";

    var ObjectStorageAPI = function ObjectStorageAPI(url) {
        Object.defineProperty(this, 'url', {value: url});
    };

    ObjectStorageAPI.prototype.getAuthToken = function getAuthToken(account_data, options) {

        if (options == null) {
            options = {};
        }

        var postBody = {
            "auth": {
                "project": account_data.PROJECT,
                "passwordCredentials": {
                    "username": account_data.USER,
                    "password": account_data.PASS
                },
                "tenantId": account_data.TENANT_ID
            }
        };

        MashupPlatform.http.makeRequest(account_data.TOKEN_REQUEST_URL, {
            requestHeaders: {"Accept": "application/json"},
            contentType: "application/json",
            postBody: JSON.stringify(postBody),
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    var response = JSON.parse(transport.responseText);
                    options.onSuccess(response.access.token.id);
                }
            },
            onFailure: function (transport) {
                if (typeof options.onFailure === 'function') {
                    options.onFailure();
                }
            },
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.listContainer = function listContainer(container, token, options) {

        var url = this.url + encodeURIComponent(container);

        if (options == null) {
            options = {};
        }

        MashupPlatform.http.makeRequest(url, {
            method: "GET",
            requestHeaders: {
                "Accept": "application/json",
                "X-Auth-Token": token
            },
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(JSON.parse(transport.responseText));
                }
            },
            onFailure: function (transport) {
                if (typeof options.onFailure === 'function') {
                    options.onFailure();
                }
            },
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.getFile = function getFile(container, file_name, token, options) {

        var url = this.url + encodeURIComponent(container) + '/' + encodeURIComponent(file_name);

        if (options == null) {
            options = {};
        }

        MashupPlatform.http.makeRequest(url, {
            method: "GET",
            requestHeaders: {
                "X-Auth-Token": token
            },
            responseType: "blob",
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(transport.response);
                }
            },
            onFailure: function (transport) {
                if (typeof options.onFailure === 'function') {
                    options.onFailure();
                }
            },
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.uploadFile = function uploadFile(container, file, token, options) {

        if (!(file instanceof File)) {
            throw new TypeError('file must be an instance of File');
        }

        if (options == null) {
            options = {};
        }
        var file_name = file.name;
        var url = this.url + encodeURIComponent(container) + '/' + encodeURIComponent(file_name);

        MashupPlatform.http.makeRequest(url, {
            method: "GET",
            requestHeaders: {"X-Auth-Token": token},
            contentType: file.type,
            postBody: file,
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            },
            onFailure: function (transport) {
                if (typeof options.onFailure === 'function') {
                    options.onFailure();
                }
            },
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.deleteFile = function deleteFile(container, file_name, token, options) {
        var url = this.url + encodeURIComponent(container) + '/' + encodeURIComponent(file_name);

        if (options == null) {
            options = {};
        }

        MashupPlatform.http.makeRequest(url, {
            method: "DELETE",
            requestHeaders: {"X-Auth-Token": token},
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            },
            onFailure: function (transport) {
                if (typeof options.onFailure === 'function') {
                    options.onFailure();
                }
            },
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };
    window.ObjectStorageAPI = ObjectStorageAPI;

})();
