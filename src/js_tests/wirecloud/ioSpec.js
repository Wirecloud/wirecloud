/*
 *     Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals Wirecloud */


(function () {

    "use strict";

    describe("io module", function () {

        beforeAll(function () {
            window.XMLHttpRequest = function XMLHttpRequest() {
                this.abort = jasmine.createSpy('abort');
                this.addEventListener = jasmine.createSpy('addEventListener');
                this.open = jasmine.createSpy('open');
                this.send = jasmine.createSpy('send');
                this.setRequestHeader = jasmine.createSpy('setRequestHeader');

                this.upload = {
                    addEventListener: jasmine.createSpy('addEventListener')
                };
            };
        });

        describe("buildProxyURL(url, options)", function () {

            it("should work with normal urls", function () {
                var original = "http://server:1234/path?q=1";
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?q=1";

                expect(Wirecloud.io.buildProxyURL(original)).toBe(expected);
            });

            it("should work with normal URL instances", function () {
                var original = new URL("http://server:1234/path?q=1");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?q=1";

                expect(Wirecloud.io.buildProxyURL(original)).toBe(expected);
            });

            it("should do nothing when using the supportAccessControl option", function () {
                var original = "http://server:1234/path?q=1";

                expect(Wirecloud.io.buildProxyURL(original, {supportsAccessControl: true}))
                    .toBe(original);
            });

            it("should do nothing when using the supportAccessControl option (using URL instances)", function () {
                var original = new URL("http://server:1234/path?q=1");

                expect(Wirecloud.io.buildProxyURL(original, {supportsAccessControl: true}))
                    .toBe(original.toString());
            });

            it("should ignore the supportAccessControl option if using the forceProxy option", function () {
                var original = "http://server:1234/path?q=1";
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?q=1";

                expect(Wirecloud.io.buildProxyURL(original, {
                    supportsAccessControl: true,
                    forceProxy: true
                })).toBe(expected);
            });

            it("should ignore the supportAccessControl option if using the forceProxy option (using URL instances)", function () {
                var original = new URL("http://server:1234/path?q=1");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?q=1";

                expect(Wirecloud.io.buildProxyURL(original, {
                    supportsAccessControl: true,
                    forceProxy: true
                })).toBe(expected);
            });

            it("should do nothing when using data urls and the forceProxy option", function () {
                var original = "data:text/html,lots%20of%20text...<p><a%20name%3D\"bottom\">bottom</a>?arg=val";

                expect(Wirecloud.io.buildProxyURL(original, {
                    forceProxy: true
                })).toBe(original);
            });

            it("should do nothing when using data urls and the forceProxy option (using URL instances)", function () {
                var original = new URL("data:text/html,lots%20of%20text...<p><a%20name%3D\"bottom\">bottom</a>?arg=val");

                expect(Wirecloud.io.buildProxyURL(original, {
                    forceProxy: true
                })).toBe(original.toString());
            });

            it("should do nothing when using blob urls and the forceProxy option", function () {
                var original = "blob:d3958f5c-0777-0845-9dcf-2cb28783acaf";

                expect(Wirecloud.io.buildProxyURL(original, {
                    forceProxy: true
                })).toBe(original);
            });

            it("should do nothing when using blob urls and the forceProxy option (using URL instances)", function () {
                var original = new URL("blob:d3958f5c-0777-0845-9dcf-2cb28783acaf");

                expect(Wirecloud.io.buildProxyURL(original, {
                    forceProxy: true
                })).toBe(original.toString());
            });

            it("should support the parameters option (using URL instances)", function () {
                var original = new URL("http://server:1234/path");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?e=1&b=c";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                })).toBe(expected);
            });

            it("should support passing an empty parameters option (using URL instances)", function () {
                var original = new URL("http://server:1234/path");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {}
                })).toBe(expected);
            });

            it("should ignore parameters with a undefined value (using URL instances)", function () {
                var original = new URL("http://server:1234/path");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?e=1&b=c";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        e: 1,
                        b: "c",
                        c: undefined
                    }
                })).toBe(expected);
            });

            it("should treat null parameters as empty parameters (using URL instances)", function () {
                var original = new URL("http://server:1234/path");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?e=1&b=c&c=";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        e: 1,
                        b: "c",
                        c: null
                    }
                })).toBe(expected);
            });

            it("should support the parameters option (empty string, using URL instances)", function () {
                var original = new URL("http://server:1234/path");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: " "
                })).toBe(expected);
            });

            it("should support the parameters option (string, using URL instances)", function () {
                var original = new URL("http://server:1234/path");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?e=1&b=c";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: "e=1&b=c"
                })).toBe(expected);
            });

            it("should support the parameters option (passing parameters in the initial url and using URL instances)", function () {
                var original = new URL("http://server:1234/path?q=1");
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?q=1&e=1&b=c";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                })).toBe(expected);
            });

            it("should ignore the parameters option if the method is POST and postBody is null", function () {
                var original = "http://server:1234/path";
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'POST',
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                })).toBe(expected);
            });

            it("should ignore the parameters option when using data URL instances", function () {
                var original = new URL("data:text/html,lots of text...<p><a name%3D\"bottom\">bottom</a>?arg=val");

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                })).toBe(original.toString());
            });

            it("should ignore the parameters option when using blob URL instances", function () {
                var original = new URL("blob:d3958f5c-0777-0845-9dcf-2cb28783acaf");

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                })).toBe(original.toString());
            });

            it("should maintain the hash part for proxied URLs", function () {
                var original = "http://server:1234/path?q=1#id";
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?q=1#id";

                expect(Wirecloud.io.buildProxyURL(original)).toBe(expected);
            });

            it("should maintain the hash part for proxied URLs when providing parameters", function () {
                var original = "http://server:1234/path#id";
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?q=1#id";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        q: 1
                    }
                })).toBe(expected);
            });

            it("should maintain the \"hash\" part when using blob URLs", function () {
                // In fact, blob urls don't support hashes. This test checks
                // buildProxyURL don't process data as a hash component
                var original = "blob:d3958f5c-0777-0845-9dcf-2cb28783acaf#id";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET'
                })).toBe(original);
            });

            it("should maintain the \"hash\" part when using blob URLs and providing parameters", function () {
                // In fact, blob urls don't support hashes. This test checks
                // buildProxyURL don't process data as a hash component
                var original = "blob:d3958f5c-0777-0845-9dcf-2cb28783acaf#id";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                })).toBe(original);
            });

            it("should maintain the \"hash\" part when using data URLs", function () {
                // In fact, data urls don't support hashes. This test checks
                // buildProxyURL don't process data as a hash component
                var original = "data:text/html,lots%20of%20text...<p><a%20name%3D\"bottom\">bottom</a>?arg=val#id";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET'
                })).toBe(original);
            });

            it("should maintain the \"hash\" part when using data URLs and providing parameters", function () {
                // In fact, data urls don't support hashes. This test checks
                // buildProxyURL don't process data as a hash component
                var original = "data:text/html,lots%20of%20text...<p><a%20name%3D\"bottom\">bottom</a>?arg=val#id";

                expect(Wirecloud.io.buildProxyURL(original, {
                    method: 'GET',
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                })).toBe(original);
            });
        });

        describe("makeRequest(url, options)", function () {

            it("should work with normal urls", function () {
                var original = "http://server:1234/path?q=1";
                var expected = "https://wirecloud.example.com/cdp/http/server:1234/path?q=1";

                var request = Wirecloud.io.makeRequest(original);
                expect(request.url).toBe(expected);
                expect(request.progress).toBe(0);
            });

            it("should ignore null headers", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    requestHeaders: {
                        empty: null
                    }
                });
                expect(request.transport.setRequestHeader).not.toHaveBeenCalledWith("empty", jasmine.anything());
            });

            it("should ignore undefined headers", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    requestHeaders: {
                        empty: undefined
                    }
                });
                expect(request.transport.setRequestHeader).not.toHaveBeenCalledWith("empty", jasmine.anything());
            });

            it("should convert the contentType option into a header", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    contentType: "application/json"
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json");
            });

            it("should convert the contentType and the encoding options into a header", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    contentType: "application/json",
                    encoding: "ISO-8859-1"
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json; charset=ISO-8859-1");
            });

            it("should serialize the parameters option inside the request body", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                expect(request.transport.send).toHaveBeenCalledWith("e=1&b=c");
            });

            it("should add parameters to the url if the request body is not empty", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    postBody: "{}",
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                });
                expect(request.url).toBe("https://wirecloud.example.com/cdp/http/server:1234/path?e=1&b=c");
                expect(request.transport.send).toHaveBeenCalledWith("{}");
            });

            it("should take into account the contentType option when using the parameters option", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    contentType: "application/custom",
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/custom; charset=UTF-8");
                expect(request.transport.send).toHaveBeenCalledWith("e=1&b=c");
            });

            it("should take into account the encoding option when using the parameters option", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    encoding: "ISO-8859-1",
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded; charset=ISO-8859-1");
                expect(request.transport.send).toHaveBeenCalledWith("e=1&b=c");
            });

            it("should support the withCredentials option", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    supportsAccessControl: true,
                    withCredentials: true
                });
                expect(request.transport.withCredentials).toBeTruthy();
            });

            it("should ignore the withCredentials option if the supportsAccessControl option is not used", function () {
                var url = "http://server:1234/path";

                var request = Wirecloud.io.makeRequest(url, {
                    withCredentials: true
                });
                expect(request.transport.withCredentials).toBeFalsy();
            });

            it("should support the onUploadProgress listener", function () {
                var url = "http://server:1234/path";
                var listener = function () {};

                var request = Wirecloud.io.makeRequest(url, {
                    onUploadProgress: listener
                });
                expect(request.transport.upload.addEventListener)
                    .toHaveBeenCalledWith("progress", listener, false);
            });

            it("should support the onProgress listener", function () {
                var url = "http://server:1234/path";
                var listener = function () {};

                var request = Wirecloud.io.makeRequest(url, {
                    onProgress: listener
                });
                expect(request.transport.addEventListener)
                    .toHaveBeenCalledWith("progress", listener, false);
            });

            it("should allow to abort requests", function () {
                var url = "http://server:1234/path?q=1";

                var request = Wirecloud.io.makeRequest(url);

                expect(request.abort()).toBe(request);
                expect(request.transport.abort).toHaveBeenCalled();

                request.transport.addEventListener.calls.argsFor(0)[1]({
                    stopPropagation: jasmine.createSpy("stopPropagation"),
                    preventDefault: jasmine.createSpy("preventDefault")
                });
            });

            it("should call onComplete on request abort", function (done) {
                const url = "http://server:1234/path?q=1";

                const request = Wirecloud.io.makeRequest(url, {
                    onComplete: function (response) {
                        expect(response.request).toBe(request);
                        expect(request.progress).toBe(0);
                        expect(request.status).toBe("aborted");
                        done();
                    }
                });

                expect(request.abort()).toBe(request);
                expect(request.transport.abort).toHaveBeenCalled();

                // Simulate abort event on the transport instance
                findListener(request.transport.addEventListener, "abort")({
                    stopPropagation: jasmine.createSpy("stopPropagation"),
                    preventDefault: jasmine.createSpy("preventDefault")
                });
            });

            it("should call onException if an exception is raised on the onComplete listener (while handling request abort)", function (done) {
                const url = "http://server:1234/path?q=1";
                let oncomplete_response;
                let exception;

                const request = Wirecloud.io.makeRequest(url, {
                    onComplete: function (response) {
                        oncomplete_response = response;
                        expect(response.request).toBe(request);
                        exception = new Error();
                        throw exception;
                    },
                    onException: function (response, e) {
                        expect(response).toBe(oncomplete_response);
                        expect(e).toBe(exception);
                        done();
                    }
                });

                expect(request.abort()).toBe(request);
                expect(request.transport.abort).toHaveBeenCalled();

                // Simulate abort event on the transport instance
                findListener(request.transport.addEventListener, "abort")({
                    stopPropagation: jasmine.createSpy("stopPropagation"),
                    preventDefault: jasmine.createSpy("preventDefault")
                });
            });

            it("throw TypeError exceptions for invalid handlers", function () {
                var listener = function () {};
                spyOn(listener, "bind");
                var context = {};

                Wirecloud.io.makeRequest("http://server:1234/path?q=1", {
                    context: context,
                    onSuccess: listener
                });

                expect(listener.bind).toHaveBeenCalledWith(context);
            });

            describe("throw TypeError exceptions for invalid handlers", function () {
                var test = function test(handler) {
                    expect(function () {
                        var options = {};
                        options[handler] = "a";
                        Wirecloud.io.makeRequest("http://server:1234/path?q=1", options);
                    }).toThrowError(TypeError);
                };

                it("onSuccess", test.bind(null, "onSuccess"));
                it("onComplete", test.bind(null, "onComplete"));
                it("onFailure", test.bind(null, "onFailure"));
                it("onException", test.bind(null, "onException"));
                it("onUploadProgress", test.bind(null, "onUploadProgress"));
                it("onXXX", test.bind(null, "on200"));

                it("using the context option", function () {
                    expect(function () {
                        var options = {
                            context: {},
                            onSuccess: "a"
                        };
                        Wirecloud.io.makeRequest("http://server:1234/path?q=1", options);
                    }).toThrowError(TypeError);
                });
            });

            describe("should call the configured listeners", function () {
                var test = function test(listener, status, sexception, cexception, done) {
                    var content = "Hello world!";
                    var statusText = "status text for " + status;
                    var sresponse = null;
                    var other_listeners = [];

                    var slistener = function (response) {
                        sresponse = response;
                        expect(response.status).toBe(status);
                        expect(response.statusText).toBe(statusText);
                        expect(response.responseText).toBe(content);
                        if (sexception) {
                            sexception = new Error();
                            throw sexception;
                        }
                    };

                    var clistener = function (response) {
                        if (listener != null) {
                            // These lines also test, implicitly, that the main
                            // listener (onSuccess, onFailure, onXXX) was called
                            // before the onComplete listener
                            expect(sresponse).not.toBe(null);
                            expect(sresponse).toBe(response);
                        }
                        expect(response.status).toBe(status);
                        expect(response.statusText).toBe(statusText);
                        expect(response.responseText).toBe(content);
                        other_listeners.forEach(function (listener) {
                            expect(listener).not.toHaveBeenCalled();
                        });
                        if (sexception) {
                            expect(listeners.onException).toHaveBeenCalledWith(response, sexception);
                        }
                        if (cexception) {
                            setTimeout(function () {
                                expect(listeners.onException).toHaveBeenCalledWith(response, cexception);
                                done();
                            }, 0);
                            cexception = new Error();
                            throw cexception;
                        } else {
                            done();
                        }
                    };

                    var listeners = {
                        onComplete: clistener
                    };
                    if (listener) {
                        listeners[listener] = slistener;
                    }
                    if (sexception || cexception) {
                        listeners.onException = jasmine.createSpy("onException");
                    }

                    // Add other listeners to be able to check they were not called
                    var lnames = ["onUploadProgress", "onException", "on504"];
                    if (listener != null) {
                        lnames = lnames.concat(["onSuccess", "onFailure"]);
                    }
                    lnames.forEach(function (lname) {
                        if (!(lname in listeners)) {
                            listeners[lname] = jasmine.createSpy(lname);
                            other_listeners[lname] = listeners[lname];
                        }
                    });

                    var request = Wirecloud.io.makeRequest("http://server:1234/path?q=1", listeners);

                    endRequest(request, status, statusText, {
                        responseText: content
                    });
                };

                it("onSuccess + onComplete (200)", test.bind(null, "onSuccess", 200, false, false));
                it("onSuccess + onException(onSuccess) + onComplete (200)", test.bind(null, "onSuccess", 200, true, false));
                it("onSuccess + onException(onSuccess) + onComplete + onException(onComplete) (200)", test.bind(null, "onSuccess", 200, true, true));
                it("onSuccess + onComplete (299)", test.bind(null, "onSuccess", 200, false, false));
                it("onComplete (200)", test.bind(null, null, 200, false, false));
                it("onComplete + onException (200)", test.bind(null, null, 200, false, true));
                it("onFailure + onComplete (400)", test.bind(null, "onFailure", 400, false, false));
                it("onFailure + onException(onFailure) + onComplete (400)", test.bind(null, "onFailure", 400, true, false));
                it("onSuccess + onException(onFailure) + onComplete + onException(onComplete) (400)", test.bind(null, "onFailure", 400, true, true));
                it("onFailure + onComplete (500)", test.bind(null, "onFailure", 500, false, false));
                it("onComplete (500)", test.bind(null, null, 500, false, false));
                it("onComplete + onException (500)", test.bind(null, null, 500, false, true));
                it("on500 + onComplete (500)", test.bind(null, "on500", 500, false, false));
                it("on500 + onException(on500) + onComplete (500)", test.bind(null, "on500", 500, true, false));
                it("on500 + onException(on500) + onComplete + onException(onComplete) (500)", test.bind(null, "on500", 500, true, true));
                it("on204 + onComplete (204)", test.bind(null, "on204", 204, false, false));
            });

            it("should provide a getHeader method on responses", function (done) {
                var listener = function (response) {
                    var headervalue = "value";
                    request.transport.getResponseHeader = jasmine.createSpy("getResponseHeader").and.returnValue(headervalue);

                    expect(response.getHeader("Location")).toBe(headervalue);

                    expect(response.transport.getResponseHeader).toHaveBeenCalledWith("Location");
                    done();
                };

                var request = Wirecloud.io.makeRequest("http://server:1234/path?q=1", {
                    onComplete: listener
                });

                endRequest(request, 200, "OK");
            });

            it("should provide a getHeader method on responses (status: 0)", function (done) {
                var listener = function (response) {
                    request.transport.getResponseHeader = jasmine.createSpy("getResponseHeader").and.throwError();

                    expect(response.getHeader("Location")).toBe(null);

                    expect(response.transport.getResponseHeader).toHaveBeenCalledWith("Location");
                    done();
                };

                var request = Wirecloud.io.makeRequest("http://server:1234/path?q=1", {
                    onComplete: listener
                });

                endRequest(request, 0, "");
            });

            it("should provide a getAllResponseHeaders method on responses", function (done) {
                var listener = function (response) {
                    var headervalue = "value";
                    request.transport.getAllResponseHeaders = jasmine.createSpy("getAllResponseHeaders").and.returnValue(headervalue);

                    expect(response.getAllResponseHeaders()).toBe(headervalue);

                    expect(response.transport.getAllResponseHeaders).toHaveBeenCalledWith();
                    done();
                };

                var request = Wirecloud.io.makeRequest("http://server:1234/path?q=1", {
                    onSuccess: listener
                });

                endRequest(request, 200, "OK");
            });

            it("should support the responseType option", function () {
                var url = "http://server:1234/path";
                var listener = function (response) {
                    expect("responseText" in response).toBeFalsy();
                    expect("responseXML" in response).toBeFalsy();
                };

                var request = Wirecloud.io.makeRequest(url, {
                    responseType: "json",
                    onSuccess: listener
                });

                expect(request.transport.responseType).toBe("json");
                endRequest(request, 200, "OK");
            });


        });

    });

    var endRequest = function endRequest(request, status, statusText, extra) {
        var key;

        request.transport.readyState = 4;
        request.transport.status = status;
        request.transport.statusText = statusText;
        if (extra != null) {
            for (key in extra) {
                request.transport[key] = extra[key];
            }
        }
        findListener(request.transport.addEventListener, status === 0 ? 'load' : 'error')();
    };

    var findListener = function findListener(spy, name) {
        var result = null;
        spy.calls.allArgs().some(function (args) {
            if (args[0] === name) {
                result = args[1];
                return true;
            }
        });
        return result;
    };

})();
