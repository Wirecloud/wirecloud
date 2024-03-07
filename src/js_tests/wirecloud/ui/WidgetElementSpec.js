/*
 *     Copyright (c) 2024 Future Internet Consulting and Development Solutions S.L.
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

(function () {

    'use strict';

    describe("WidgetElement", function () {

        const TEST_CODE = '<base href="test"><script src="/test2.js"></script><body>test<a href="test1"></a><img srcset="test1.jpg 320w"/></body>';
        const EXPECTED_RESULT = '<script src="http://example.wirecloud.com/test2.js"></script><body>test<a href="http://example.wirecloud.com/test/test1"></a><img srcset="http://example.wirecloud.com/test/test1.jpg 320w"></body>';

        it("should have a shadowDOM after being added to the DOM", function () {
            const unloadSpy = jasmine.createSpy('unload');

            const widget = document.createElement('wirecloud-widget');
            document.body.appendChild(widget);

            expect(widget.hasShadowDOM).toBe(true);
            expect(widget.shadowRoot).not.toBeNull();

            widget.addEventListener('unload', unloadSpy);
            document.body.removeChild(widget);
            expect(unloadSpy).toHaveBeenCalled();
        });

        it("should load the widget code", function () {
            const widget = document.createElement('wirecloud-widget');
            document.body.appendChild(widget);

            expect(widget.loadedURL).toBe("");

            let headerVal = "test";

            // Replace XMLHttpRequest with a mock object
            const xmlhttp = {
                open: jasmine.createSpy('open'),
                send: jasmine.createSpy('send'),
                readyState: 0,
                status: 400,
                responseText: TEST_CODE,
                onreadystatechange: null,
                getResponseHeader: (header) => {
                    if (header === 'Content-Type') {
                        return headerVal;
                    }
                }
            };

            const originalXMLHttpRequest = window.XMLHttpRequest;
            window.XMLHttpRequest = function () {
                return xmlhttp;
            };

            widget.load('http://example.wirecloud.com/test/widget.html');

            window.XMLHttpRequest = originalXMLHttpRequest;

            expect(xmlhttp.open).toHaveBeenCalledWith('GET', 'http://example.wirecloud.com/test/widget.html', true);
            expect(xmlhttp.send).toHaveBeenCalled();
            expect(() => xmlhttp.onreadystatechange()).not.toThrow();

            xmlhttp.readyState = XMLHttpRequest.DONE;
            expect(() => xmlhttp.onreadystatechange()).toThrow();

            xmlhttp.status = 200;
            expect(() => xmlhttp.onreadystatechange()).toThrow();
            expect(widget.shadowRoot.innerHTML).toBe("");

            headerVal = "text/html";
            xmlhttp.onreadystatechange();

            expect(widget.loadedURL).toBe("http://example.wirecloud.com/test/widget.html");
            expect(widget.shadowRoot.innerHTML).toBe(EXPECTED_RESULT);

            document.body.removeChild(widget);
        });

        it("should handle unloading without loading", function () {
            const widget = document.createElement('wirecloud-widget');
            widget._unload();
            document.body.appendChild(widget);
            document.body.removeChild(widget);
            document.body.appendChild(widget);
            document.body.removeChild(widget);

            expect(widget.loadedURL).toBe("");
            expect(widget.shadowRoot).not.toBeNull();
        });

    });

})();