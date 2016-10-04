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
 
/* jshint jasmine:true */
/* globals StyledElements */
 
 
(function (ns) {
 
    "use strict";
 
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
                // Provide a default instance of Select for testing
                engine = new ns.KeywordSuggestion();
            });
 
            it("should append normal endpoints", function () {
                var endpoint = new Wirecloud.ui.WiringEditor.Endpoint("source",
                    {
                        id: "widget/19/condition-list",
                        friendcode: "list",
                        name: "",
                        description: "",
                        label: ""
                    },
                    {
                        id: "CoNWeT/jenkins-project-build-list/0.1.9",
                        type: "widget"
                    }
                );
                expect(engine.appendEndpoint(endpoint)).toBe(engine);
                expect(engine.endpoints.source.list.length).toBe(1);
            });
        });
    });
 
})(Wirecloud.wiring);
