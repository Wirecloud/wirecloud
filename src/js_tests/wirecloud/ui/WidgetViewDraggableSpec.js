/*
 *     Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, utils) {

    "use strict";

    describe("WidgetViewDraggable", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.ui.FullDragboardLayout = function () {};
        });

        afterAll(() => {
            // TODO
            delete Wirecloud.ui.FullDragboardLayout;
        });

        describe("new WidgetViewDraggable(widget)", () => {

            it("should require a widget parameter", () => {
                new Wirecloud.ui.WidgetViewDraggable({
                    heading: document.createElement("div")
                });
            });

        });

        describe("canDrag(draggable, context)", () => {

            const test = (editing, volatile, fulldragboard, result) => {
                it("should return " + result, () => {
                    var widget = Object.assign({
                        heading: document.createElement("div"),
                        layout: fulldragboard ? new Wirecloud.ui.FullDragboardLayout() : null,
                        model: {
                            isAllowed: jasmine.createSpy("isAllowed").and.returnValue(true),
                            volatile: volatile
                        },
                        tab: {
                            workspace: {
                                editing: editing
                            }
                        }
                    });
                    var draggable = new Wirecloud.ui.WidgetViewDraggable(widget);

                    expect(draggable.canDrag(null, {widget: widget})).toBe(result);
                });
            };

            test(false, true, false, true);
            test(true, true, false, true);
            test(true, false, false, true);

            test(false, false, false, false);
            test(false, false, true, false);
            test(true, false, true, false);
        });

    });

})(Wirecloud.ui, StyledElements.Utils);
