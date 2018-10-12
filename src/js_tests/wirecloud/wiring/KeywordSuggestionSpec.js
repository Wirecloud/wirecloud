/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (ns, utils) {

    "use strict";

    var equals = function equals(other) {
        if (other.missing) {
            return false;
        }
        return this.id === other.id;
    };

    var SourceEndpoint = function (options) {
        Object.assign(this, options);
    };
    utils.inherit(SourceEndpoint, Wirecloud.wiring.SourceEndpoint);

    var TargetEndpoint = function (options) {
        Object.assign(this, options);
    };
    utils.inherit(TargetEndpoint, Wirecloud.wiring.TargetEndpoint);

    var BASIC_INPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new TargetEndpoint({
            id: "widget/19/condition-list",
            friendcodeList: ["list"],
            name: "condition-list",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals
        }
    );

    var BASIC_OUTPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new SourceEndpoint({
            id: "widget/19/condition-list",
            friendcodeList: ["list"],
            name: "condition-list",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals
        }
    );

    var EXTRA_INPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new TargetEndpoint({
            id: "widget/22/other-endpoint",
            friendcodeList: ["other"],
            name: "other-endpoint",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals
        }
    );

    var EXTRA_OUTPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new SourceEndpoint({
            id: "widget/22/other-endpoint",
            friendcodeList: ["other"],
            name: "other-endpoint",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals
        }
    );

    var MISSING_INPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new TargetEndpoint({
            id: "widget/20/condition-list",
            friendcodeList: ["list"],
            name: "condition-list",
            description: "",
            label: "",
            missing: true
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals
        }
    );

    var MISSING_OUTPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new SourceEndpoint({
            id: "widget/20/condition-list",
            friendcodeList: ["list"],
            name: "condition-list",
            description: "",
            label: "",
            missing: true
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals

        }
    );

    var OPERATOR_INPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new TargetEndpoint({
            id: "operator/1/list",
            friendcodeList: ["list"],
            name: "list",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/example-1/1.0",
            type: "operator",
            equals: equals
        }
    );

    var OPERATOR_OUTPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new SourceEndpoint({
            id: "operator/1/list",
            friendcodeList: ["list"],
            name: "list",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/example-1/1.0",
            type: "operator",
            equals: equals
        }
    );

    var WIDGET_INPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new TargetEndpoint({
            id: "widget/21/other-endpoint",
            friendcodeList: ["list"],
            name: "other-endpoint",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals
        }
    );

    var WIDGET_OUTPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new SourceEndpoint({
            id: "widget/21/other-outputendpoint",
            friendcodeList: ["list"],
            name: "other-outputendpoint",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals
        }
    );

    var FRIENDCODES_OUTPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new SourceEndpoint({
            id: "operator/1/query",
            friendcodeList: ["query", "string"],
            name: "query",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/example-1/1.0",
            type: "operator",
            equals: equals
        }
    );

    var FRIENDCODES_INPUT_ENDPOINT = new Wirecloud.ui.WiringEditor.Endpoint(
        new TargetEndpoint({
            id: "widget/21/keywords",
            friendcodeList: ["keywords", "query", "input-text"],
            name: "keywords",
            description: "",
            label: ""
        }),
        {
            id: "CoNWeT/jenkins-project-build-list/0.1.9",
            type: "widget",
            equals: equals
        }
    );


    describe("KeywordSuggestion", function () {

        describe("new KeywordSuggestion([options])", function () {

            it("can be created without passing any option", function () {
                var element = new ns.KeywordSuggestion();
                expect(element).not.toEqual(null);
            });

        });

        describe("appendEndpoint()", function () {
            var engine;

            beforeEach(function () {
                // Provide a clean instance for each test
                engine = new ns.KeywordSuggestion();
            });

            it("should append normal input endpoints", function () {
                expect(engine.appendEndpoint(BASIC_INPUT_ENDPOINT)).toBe(engine);
            });

            it("should append normal output endpoints", function () {
                expect(engine.appendEndpoint(BASIC_OUTPUT_ENDPOINT)).toBe(engine);
            });

            it("should ignore missing input endpoints", function () {
                expect(engine.appendEndpoint(MISSING_INPUT_ENDPOINT)).toBe(engine);
            });

            it("should ignore missing output endpoints", function () {
                expect(engine.appendEndpoint(MISSING_OUTPUT_ENDPOINT)).toBe(engine);
            });
        });

        describe("removeEndpoint(endpoint)", function () {
            var engine;

            beforeEach(function () {
                // Provide a clean instance for each test
                engine = new ns.KeywordSuggestion();
            });

            it("should remove input endpoints", function () {
                // Prepare the engine
                engine.appendEndpoint(BASIC_INPUT_ENDPOINT);

                // Remove the endpoint
                expect(engine.removeEndpoint(BASIC_INPUT_ENDPOINT)).toBe(engine);
            });

            it("should remove output endpoints", function () {
                // Prepare the engine
                engine.appendEndpoint(BASIC_OUTPUT_ENDPOINT);

                // Remove the endpoint
                expect(engine.removeEndpoint(BASIC_OUTPUT_ENDPOINT)).toBe(engine);
            });

            it("should not affect other endpoints", function () {
                // Prepare the engine
                engine
                    .appendEndpoint(BASIC_OUTPUT_ENDPOINT)
                    .appendEndpoint(WIDGET_OUTPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_INPUT_ENDPOINT);

                // Remove the endpoint
                expect(engine.removeEndpoint(BASIC_OUTPUT_ENDPOINT)).toBe(engine);

                // Check other endpoints are not affected
                var callback = jasmine.createSpy('callback');

                expect(engine.forEachSuggestion(OPERATOR_INPUT_ENDPOINT, callback)).toBe(engine);
                expect(callback.calls.count()).toBe(1);
                expect(callback.calls.argsFor(0)).toEqual([WIDGET_OUTPUT_ENDPOINT]);
            });

            it("should ignore missing input endpoints", function () {
                expect(engine.removeEndpoint(MISSING_INPUT_ENDPOINT)).toBe(engine);
            });

            it("should ignore missing output endpoints", function () {
                expect(engine.removeEndpoint(MISSING_INPUT_ENDPOINT)).toBe(engine);
            });
        });

        describe("forEachSuggestion(endpoint, callback)", function () {
            var engine;

            beforeEach(function () {
                // Provide a clean instance for each test
                engine = new ns.KeywordSuggestion();
            });

            it("should do nothing if there are no endpoints to suggest (when querying form a valid input endpoint)", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine.appendEndpoint(OPERATOR_INPUT_ENDPOINT);

                expect(engine.forEachSuggestion(OPERATOR_INPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(0);
            });

            it("should do nothing if there are no endpoints to suggest (when querying form a valid output endpoint)", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine.appendEndpoint(OPERATOR_OUTPUT_ENDPOINT);

                expect(engine.forEachSuggestion(OPERATOR_OUTPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(0);
            });

            it("should ignore non-matching input endpoints", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(EXTRA_INPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_OUTPUT_ENDPOINT);

                expect(engine.forEachSuggestion(OPERATOR_OUTPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(0);
            });

            it("should ignore non-matching output endpoints", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(EXTRA_OUTPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_INPUT_ENDPOINT);

                expect(engine.forEachSuggestion(OPERATOR_INPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(0);
            });

            it("should find input endpoints", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(BASIC_INPUT_ENDPOINT)
                    .appendEndpoint(WIDGET_INPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_OUTPUT_ENDPOINT);

                expect(engine.forEachSuggestion(OPERATOR_OUTPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(2);
                expect(callback.calls.argsFor(0)).toEqual([BASIC_INPUT_ENDPOINT]);
                expect(callback.calls.argsFor(1)).toEqual([WIDGET_INPUT_ENDPOINT]);
            });

            it("should find output endpoints", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(BASIC_OUTPUT_ENDPOINT)
                    .appendEndpoint(WIDGET_OUTPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_INPUT_ENDPOINT);

                expect(engine.forEachSuggestion(OPERATOR_INPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(2);
                expect(callback.calls.argsFor(0)).toEqual([BASIC_OUTPUT_ENDPOINT]);
                expect(callback.calls.argsFor(1)).toEqual([WIDGET_OUTPUT_ENDPOINT]);
            });

            it("should ignore endpoints of the same component (when querying form a valid input endpoint)", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(BASIC_OUTPUT_ENDPOINT)
                    .appendEndpoint(BASIC_INPUT_ENDPOINT);

                expect(engine.forEachSuggestion(BASIC_INPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toEqual(0);
            });

            it("should ignore endpoints of the same component (when querying form a valid output endpoint)", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(BASIC_OUTPUT_ENDPOINT)
                    .appendEndpoint(BASIC_INPUT_ENDPOINT);

                expect(engine.forEachSuggestion(BASIC_OUTPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toEqual(0);
            });

            it("should do nothing when the endpoint parameter is a missing input endpoint", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(MISSING_INPUT_ENDPOINT)
                    .appendEndpoint(BASIC_INPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_OUTPUT_ENDPOINT);

                // The engine should suggest nothing for the missing endpoint
                expect(engine.forEachSuggestion(MISSING_INPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(0);
            });

            it("should do nothing when the endpoint parameter is a missing output endpoint", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(MISSING_OUTPUT_ENDPOINT)
                    .appendEndpoint(BASIC_OUTPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_INPUT_ENDPOINT);

                // The engine should suggest nothing for the missing endpoint
                expect(engine.forEachSuggestion(MISSING_OUTPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(0);
            });

            it("should ignore missing endpoints (when querying from a valid input endpoint)", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(MISSING_OUTPUT_ENDPOINT)
                    .appendEndpoint(BASIC_OUTPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_INPUT_ENDPOINT);

                expect(engine.forEachSuggestion(OPERATOR_INPUT_ENDPOINT, callback)).toBe(engine);

                // The engine should not suggest the missing endpoint
                expect(callback.calls.count()).toBe(1);
                expect(callback.calls.argsFor(0)).toEqual([BASIC_OUTPUT_ENDPOINT]);
            });

            it("should ignore missing endpoints (when querying from a valid output endpoint)", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(MISSING_INPUT_ENDPOINT)
                    .appendEndpoint(BASIC_INPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_OUTPUT_ENDPOINT);

                expect(engine.forEachSuggestion(OPERATOR_OUTPUT_ENDPOINT, callback)).toBe(engine);

                // The engine should not suggest endpoint1 as it is missing
                expect(callback.calls.count()).toBe(1);
                expect(callback.calls.argsFor(0)).toEqual([BASIC_INPUT_ENDPOINT]);
            });

            it("should find input endpoints using friendcode list", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(FRIENDCODES_INPUT_ENDPOINT)
                    .appendEndpoint(FRIENDCODES_OUTPUT_ENDPOINT);

                expect(engine.forEachSuggestion(FRIENDCODES_OUTPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(1);
                expect(callback.calls.argsFor(0)).toEqual([FRIENDCODES_INPUT_ENDPOINT]);
            });

            it("should find output endpoints using friendcode list", function () {
                var callback = jasmine.createSpy('callback');

                // Prepare the engine
                engine
                    .appendEndpoint(FRIENDCODES_INPUT_ENDPOINT)
                    .appendEndpoint(FRIENDCODES_OUTPUT_ENDPOINT);

                expect(engine.forEachSuggestion(FRIENDCODES_INPUT_ENDPOINT, callback)).toBe(engine);

                expect(callback.calls.count()).toBe(1);
                expect(callback.calls.argsFor(0)).toEqual([FRIENDCODES_OUTPUT_ENDPOINT]);
            });
        });

        describe("empty()", function () {
            var engine;

            beforeEach(function () {
                // Provide a clean instance for each test
                engine = new ns.KeywordSuggestion();
            });

            it("should do nothing when the status is already empty", function () {
                expect(engine.empty()).toBe(engine);
            });

            it("should clear registered endpoints", function () {
                // Prepare the engine
                engine
                    .appendEndpoint(BASIC_INPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_INPUT_ENDPOINT)
                    .appendEndpoint(WIDGET_INPUT_ENDPOINT)
                    .appendEndpoint(BASIC_OUTPUT_ENDPOINT)
                    .appendEndpoint(OPERATOR_OUTPUT_ENDPOINT)
                    .appendEndpoint(WIDGET_OUTPUT_ENDPOINT);

                // Clear the engine
                expect(engine.empty()).toBe(engine);

                // Check endpoints are not suggested
                var callback = jasmine.createSpy('callback');

                expect(engine.forEachSuggestion(OPERATOR_INPUT_ENDPOINT, callback)).toBe(engine);
                expect(callback.calls.count()).toBe(0);
            });
        });
    });

})(Wirecloud.wiring, Wirecloud.Utils);
