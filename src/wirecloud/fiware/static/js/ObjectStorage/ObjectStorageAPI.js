/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/* globals MashupPlatform */


(function () {

    "use strict";

    var manager = window.parent.OpenStackManager;

    var merge = function merge(obj1, obj2) {
        if (obj2 != null) {

            for (var key in obj2) {
                obj1[key] = obj2[key];
            }
        }

        return obj1;
    };

    var initHeaders = function initHeaders(options) {
        var headers = {};

        if ('token' in options) {
            headers['X-Auth-Token'] = options.token;
        } else {
            throw new TypeError();
        }

        return headers;
    };

    var process_failure = function process_failure(response) {
        switch (response.status) {
        case 503:
            return this.ERROR.SERVICE_UNAVAILABLE;
        case 401:
            return this.ERROR.UNAUTHORIZED;
        case 0:
            return this.ERROR.CONNECTION_REFUSED;
        default:
            return this.ERROR.UNKNOWN;
        }
    };

    var KeystoneAPI = function KeystoneAPI(url, options) {
        if (typeof url !== 'string') {
            throw new TypeError('url must be a string');
        }

        if (url[url.length - 1] !== '/') {
            url += '/';
        }

        url = url.replace(/\/v\d+(?:\.\d+)?\/$/, '/');

        if (options == null) {
            options = {};
        }

        Object.defineProperty(this, 'url', {value: url});
        this.token = options.token;
        this.use_user_fiware_token = !!options.use_user_fiware_token;
    };

    KeystoneAPI.prototype.v2 = {};
    KeystoneAPI.prototype.v2.TENANTS_ENDPOINT = 'v2.0/tenants';
    KeystoneAPI.prototype.v2.TOKENS_ENDPOINT = 'v2.0/tokens';

    KeystoneAPI.prototype.ERROR = {
        UNKNOWN: 0,
        CONNECTION_REFUSED: 1,
        UNAUTHORIZED: 2,
        NOT_FOUND: 3,
        SERVICE_UNAVAILABLE: 4
    };

    var realGetTenants = function realGetTenants(options) {

        var url, headers;

        url = this.url + this.v2.TENANTS_ENDPOINT;
        headers = initHeaders.call(this, options);
        headers.Accept = "application/json";

        MashupPlatform.http.makeRequest(url, {
            method: 'GET',
            requestHeaders: headers,
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    var response = JSON.parse(transport.responseText);
                    options.onSuccess(response);
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });

    };

    KeystoneAPI.prototype.v2.getTenants = function getTenants(options) {

        options = merge({
            token: this.token,
            use_user_fiware_token: !!this.use_user_fiware_token,
        }, options);

        if (options.use_user_fiware_token ) {
            manager.get_openstack_token_from_idm_token(this.url, function (token) {
                options.token = token;
                options.use_user_fiware_token = false;
                realGetTenants.call(this, options);
            }.bind(this), options.onFailure);
        } else {
            realGetTenants.call(this, options);
        }

    };
    KeystoneAPI.prototype.getTenants = KeystoneAPI.prototype.v2.getTenants;

    var realGetAuthToken = function realGetAuthToken(postBody, headers, options) {
        MashupPlatform.http.makeRequest(this.url + this.v2.TOKENS_ENDPOINT, {
            requestHeaders: headers,
            contentType: "application/json",
            postBody: JSON.stringify(postBody),
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    var response = JSON.parse(transport.responseText);
                    options.onSuccess(response.access.token.id, response);
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    KeystoneAPI.prototype.v2.getAuthToken = function getAuthToken(options) {
        var postBody, headers;

        options = merge({
            token: this.token,
            use_user_fiware_token: !!this.use_user_fiware_token,
        }, options);

        headers = {
            "Accept": "application/json"
        };

        postBody = {
            "auth": {}
        };

        if (typeof options === 'string') {
            postBody.auth.project = options.project;
        } else if (typeof options.tenantId === 'string') {
            postBody.auth.tenantId = options.tenantId;
        } else {
            throw new TypeError();
        }

        if (options.passwordCredentials != null) {
            postBody.auth.passwordCredentials = {
                "username": options.user,
                "password": options.pass
            };
        } else if (typeof options.token === 'string') {
            postBody.auth.token = {
                "id": options.token
            };
        } else if (options.use_user_fiware_token === true) {
            manager.get_openstack_token_from_idm_token(this.url, function (token) {
                postBody.auth.token = {
                    "id": token
                };
                realGetAuthToken.call(this, postBody, headers, options);
            }.bind(this), options.onFailure);
            return;
        } else {
            throw new Error();
        }
        realGetAuthToken.call(this, postBody, headers, options);
    };
    KeystoneAPI.prototype.getAuthToken = KeystoneAPI.prototype.v2.getAuthToken;

    var ObjectStorageAPI = function ObjectStorageAPI(url, options) {
        if (typeof url !== 'string') {
            throw new TypeError('url must be a string');
        }

        if (options == null) {
            options = {};
        }

        if (url[url.length - 1] !== '/') {
            url += '/';
        }

        Object.defineProperty(this, 'url', {value: url});
        this.token = options.token;
    };

    ObjectStorageAPI.prototype.ERROR = {
        UNKNOWN: 0,
        CONNECTION_REFUSED: 1,
        UNAUTHORIZED: 2,
        NOT_FOUND: 3,
        SERVICE_UNAVAILABLE: 4
    };

    ObjectStorageAPI.prototype.getContainerList = function getContainerList(options) {
        var url, headers;

        url = this.url;

        options = merge({
            token: this.token
        }, options);

        headers = initHeaders(options);
        headers.Accept = "application/json";

        MashupPlatform.http.makeRequest(url, {
            method: "GET",
            requestHeaders: headers,
            onSuccess: function (response) {
                var data = JSON.parse(response.responseText);
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(data);
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.createContainer = function createContainer(container, options) {
        var url, headers;

        url = this.url + encodeURIComponent(container);

        options = merge({
            token: this.token
        }, options);

        headers = initHeaders(options);
        headers.Accept = "application/json";

        MashupPlatform.http.makeRequest(url, {
            method: "PUT",
            requestHeaders: headers,
            onSuccess: function (transport) {
                var created = transport.status_code === 204;
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(created);
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.listContainer = function listContainer(container, options) {
        var url, headers;

        url = this.url + encodeURIComponent(container) + '/';

        options = merge({
            token: this.token
        }, options);

        headers = initHeaders(options);
        headers.Accept = "application/json";

        MashupPlatform.http.makeRequest(url, {
            method: "GET",
            requestHeaders: headers,
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(JSON.parse(transport.responseText));
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.deleteContainer = function createContainer(container, options) {
        var url, headers;

        url = this.url + encodeURIComponent(container);

        options = merge({
            token: this.token
        }, options);

        headers = initHeaders(options);
        headers.Accept = "application/json";

        MashupPlatform.http.makeRequest(url, {
            method: "DELETE",
            requestHeaders: headers,
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.getFile = function getFile(container, file_name, options) {
        var url, headers;

        url = this.url + encodeURIComponent(container) + '/' + encodeURIComponent(file_name);

        options = merge({
            token: this.token,
            response_type: "blob"
        }, options);

        if (['text', 'blob'].indexOf(options.response_type) === -1) {
            throw new TypeError('Invalid response_type value');
        }
        headers = initHeaders(options);
        headers.Accept = "*/*";

        MashupPlatform.http.makeRequest(url, {
            method: "GET",
            requestHeaders: headers,
            responseType: options.response_type,
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(transport.response);
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.uploadFile = function uploadFile(container, file, options) {
        var file_name, url, headers;

        // This line doesn't work as widgets/operators run in a separated enviroment (so their Blob/File classes are different that the ones available in the environment where Wirecloud is running)
        //if (!(file instanceof Blob)) {
        if (file == null || !('type' in file)) {
            throw new TypeError('file must be an instance of Blob');
        }

        options = merge({
            token: this.token
        }, options);

        if ('file_name' in options) {
            file_name = options.file_name;
        } else if ('name' in file) {
            file_name = file.name;
        } else {
            throw new TypeError('Missing file name');
        }
        url = this.url + encodeURIComponent(container) + '/' + encodeURIComponent(file_name);

        headers = initHeaders(options);
        headers.Accept = "application/json";

        MashupPlatform.http.makeRequest(url, {
            method: "PUT",
            requestHeaders: headers,
            contentType: file.type,
            postBody: file,
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    ObjectStorageAPI.prototype.deleteFile = function deleteFile(container, file_name, options) {
        var url, headers;

        url = this.url + encodeURIComponent(container) + '/' + encodeURIComponent(file_name);

        options = merge({
            token: this.token
        }, options);

        headers = initHeaders(options);
        headers.Accept = "application/json";

        MashupPlatform.http.makeRequest(url, {
            method: "DELETE",
            requestHeaders: headers,
            onSuccess: function (transport) {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            },
            onFailure: function (response) {
                var reason;

                if (typeof options.onFailure === 'function') {
                    reason = process_failure.call(this, response);
                    options.onFailure(reason);
                }
            }.bind(this),
            onComplete: function (transport) {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    window.KeystoneAPI = KeystoneAPI;
    window.ObjectStorageAPI = ObjectStorageAPI;

})();
