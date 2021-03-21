/*
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

/* globals StyledElements, Wirecloud */


(function (ns, utils) {

    "use strict";

    describe("WidgetViewMenuItems", () => {

        describe("new WidgetViewMenuItems(widget)", () => {

            it("works", () => {
                const widget = {};

                const item = new ns.WidgetViewMenuItems(widget);

                expect(item.widget).toBe(widget);
            });

        });

        describe("build()", () => {

            const createwidgetmock = function createwidgetmock(options) {
                options = options || {};
                options.layout = options.layout != null ? options.layout : 0;

                return {
                    layout: options.layout,
                    model: {
                        hasPreferences: jasmine.createSpy("hasPreferences").and.returnValue(true),
                        isAllowed: jasmine.createSpy("isAllowed").and.returnValue(true),
                        meta: {
                            doc: "a"
                        }
                    },
                    position: {
                        anchor: options.anchor || "top-left",
                        relx: !!options.relx,
                        rely: !!options.rely,
                        x: 0,
                        y: 0
                    },
                    setPosition: jasmine.createSpy('setPosition'),
                    setShape: jasmine.createSpy('setShape'),
                    shape: {
                        relwidth: !!options.relwidth,
                        relheight: !!options.relheight,
                        width: 1,
                        height: 1
                    },
                    tab: {
                        dragboard: {
                            baseLayout: 0,
                            freeLayout: 1,
                            leftLayout: 2,
                            rightLayout: 3,
                            fulldragboardLayout: 4
                        }
                    }
                };
            };

            it("manages widgets on base layouts", () => {
                const widget = createwidgetmock({layout: 0});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                expect(items.some((item) => {return item.title === "Placement";})).toBe(false);
                expect(items.some((item) => {return item.title === "Extract from grid";})).toBe(true);
                expect(items.some((item) => {return item.title === "Move to the left sidebar";})).toBe(true);
                expect(items.some((item) => {return item.title === "Move to the right sidebar";})).toBe(true);
            });

            it("manages widgets on free layouts", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                expect(items.some((item) => {return item.title === "Placement";})).toBe(true);
                expect(items.some((item) => {return item.title === "Extract from grid";})).toBe(false);
                expect(items.some((item) => {return item.title === "Move to the left sidebar";})).toBe(true);
                expect(items.some((item) => {return item.title === "Move to the right sidebar";})).toBe(true);
            });

            it("manages widgets on full dragboard", () => {
                const widget = createwidgetmock({layout: 4});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                expect(items.some((item) => {return item.title === "Placement";})).toBe(false);
                expect(items.some((item) => {return item.title === "Extract from grid";})).toBe(false);
                expect(items.some((item) => {return item.title === "Move to the left sidebar";})).toBe(false);
                expect(items.some((item) => {return item.title === "Move to the right sidebar";})).toBe(false);
            });

            it("manages widgets on left layouts", () => {
                const widget = createwidgetmock({layout: 2});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                expect(items.some((item) => {return item.title === "Placement";})).toBe(false);
                expect(items.some((item) => {return item.title === "Extract from grid";})).toBe(true);
                expect(items.some((item) => {return item.title === "Move to the left sidebar";})).toBe(false);
                expect(items.some((item) => {return item.title === "Move to the right sidebar";})).toBe(true);
            });

            it("manages widgets on right layouts", () => {
                const widget = createwidgetmock({layout: 3});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                expect(items.some((item) => {return item.title === "Placement";})).toBe(false);
                expect(items.some((item) => {return item.title === "Extract from grid";})).toBe(true);
                expect(items.some((item) => {return item.title === "Move to the left sidebar";})).toBe(true);
                expect(items.some((item) => {return item.title === "Move to the right sidebar";})).toBe(false);
            });

            it("handles Rename", () => {
                const widget = createwidgetmock({layout: 0});
                widget.titleelement = {
                    enableEdition: jasmine.createSpy("enableEdition")
                };
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Rename";});

                element.run();

                expect(widget.titleelement.enableEdition).toHaveBeenCalledWith();
            });

            it("handles Reload", () => {
                const widget = createwidgetmock({layout: 0});
                widget.reload = jasmine.createSpy("reload");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Reload";});

                element.run();

                expect(widget.reload).toHaveBeenCalledWith();
            });

            it("handles Upgrade/Downgrade", () => {
                const widget = createwidgetmock({layout: 0});
                widget.reload = jasmine.createSpy("reload");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);
                ns.UpgradeWindowMenu = jasmine.createSpy("UpgradeWindowMenu").and.callFake(function () {this.show = jasmine.createSpy("show");});

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Upgrade/Downgrade";});

                element.run();
            });

            it("handles Logs option", () => {
                const widget = createwidgetmock({layout: 0});
                widget.showLogs = jasmine.createSpy("showLogs");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Logs";});

                element.run();

                expect(widget.showLogs).toHaveBeenCalledWith();
            });

            it("handles Settings option", () => {
                const widget = createwidgetmock({layout: 0});
                widget.showSettings = jasmine.createSpy("showSettings");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Settings";});

                element.run();

                expect(widget.showSettings).toHaveBeenCalledWith();
            });

            it("handles User's manual option", () => {
                const widget = createwidgetmock({layout: 0});
                Wirecloud.UserInterfaceManager.views.myresources = {
                    createUserCommand: jasmine.createSpy("createUserCommand").and.returnValue(() => {})
                };
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "User's Manual";});

                element.run();

                expect(Wirecloud.UserInterfaceManager.views.myresources.createUserCommand).toHaveBeenCalled();
            });

            it("handles Full Dragboard option", () => {
                const widget = createwidgetmock({layout: 0});
                widget.setFullDragboardMode = jasmine.createSpy("setFullDragboardMode");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Full Dragboard";});

                element.run();

                expect(widget.setFullDragboardMode).toHaveBeenCalled();
            });

            it("handles Extract from grid options", () => {
                const widget = createwidgetmock({layout: 0});
                widget.moveToLayout = jasmine.createSpy("moveToLayout");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Extract from grid";});

                element.run();
            });

            it("handles Snap to grid options", () => {
                const widget = createwidgetmock({layout: 1});
                widget.moveToLayout = jasmine.createSpy("moveToLayout");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Snap to grid";});

                element.run();
            });

            it("handles Move to the left sidebar option", () => {
                const widget = createwidgetmock({layout: 0});
                widget.moveToLayout = jasmine.createSpy("moveToLayout");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Move to the left sidebar";});

                element.run();
            });

            it("handles Move to the right sidebar option", () => {
                const widget = createwidgetmock({layout: 0});
                widget.moveToLayout = jasmine.createSpy("moveToLayout");
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                expect(items).toEqual(jasmine.any(Array));
                const element = items.find((item) => {return item.title === "Move to the right sidebar";});

                element.run();
            });

            it("handles switching into relative horizontal placement", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({}),
                    dragboard: {
                        leftMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getColumnOffset: jasmine.createSpy("getColumnOffset").and.returnValue(0)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Relative x";});

                element.run();
            });

            it("handles switching into absolute horizontal placement", () => {
                const widget = createwidgetmock({layout: 1, relx: true});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({}),
                    dragboard: {
                        leftMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getColumnOffset: jasmine.createSpy("getColumnOffset").and.returnValue(0)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Fixed x";});

                element.run();
            });

            it("handles switching into absolute horizontal placement (right alignment)", () => {
                const widget = createwidgetmock({layout: 1, relx: true, anchor: "top-right"});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({}),
                    dragboard: {
                        leftMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getColumnOffset: jasmine.createSpy("getColumnOffset").and.returnValue(0)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Fixed x";});

                element.run();
            });

            it("handles switching into relative vertical placement", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getRowOffset: jasmine.createSpy("getRowOffset").and.returnValue(0)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Relative y";});

                element.run();
            });

            it("handles switching into absolute vertical placement", () => {
                const widget = createwidgetmock({layout: 1, rely: true});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getRowOffset: jasmine.createSpy("getRowOffset").and.returnValue(0)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Fixed y";});

                element.run();
            });

            it("handles switching into absolute vertical placement (bottom alignment)", () => {
                const widget = createwidgetmock({layout: 1, rely: true, anchor: "bottom-left"});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getRowOffset: jasmine.createSpy("getRowOffset").and.returnValue(0)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Fixed y";});

                element.run();
            });

            it("handles switching into relative widths", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptWidth: jasmine.createSpy("adaptWidth").and.returnValue({}),
                    dragboard: {
                        leftMargin: 1,
                        update: jasmine.createSpy("update")
                    }
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Relative width";});

                element.run();
            });

            it("handles switching into absolute widths", () => {
                const widget = createwidgetmock({layout: 1, relwidth: true});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptWidth: jasmine.createSpy("adaptWidth").and.returnValue({}),
                    getWidthInPixels: jasmine.createSpy("getWidthInPixels").and.returnValue(3),
                    dragboard: {
                        leftMargin: 1,
                        update: jasmine.createSpy("update")
                    }
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Fixed width";});

                element.run();
            });

            it("handles switching into relative heights", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    }
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Relative height";});

                element.run();
            });

            it("handles switching into absolute heights", () => {
                const widget = createwidgetmock({layout: 1, relheight: true});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getHeightInPixels: jasmine.createSpy("getHeightInPixels").and.returnValue(3)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const element = submenu._items.find((item) => {return item.title === "Fixed height";});

                element.run();
            });

            it("handles enabling left alignment", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getHeightInPixels: jasmine.createSpy("getHeightInPixels").and.returnValue(3)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const submenu2 = submenu._items.find((item) => {return item.title === "Horizontal Align";});
                const element = submenu2._items.find((item) => {return item.title === "Left";});

                element.run();
            });

            it("handles enabling center alignment", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getHeightInPixels: jasmine.createSpy("getHeightInPixels").and.returnValue(3)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const submenu2 = submenu._items.find((item) => {return item.title === "Horizontal Align";});
                const element = submenu2._items.find((item) => {return item.title === "Center";});

                element.run();
            });

            it("handles enabling right alignment", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getHeightInPixels: jasmine.createSpy("getHeightInPixels").and.returnValue(3)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const submenu2 = submenu._items.find((item) => {return item.title === "Horizontal Align";});
                const element = submenu2._items.find((item) => {return item.title === "Right";});

                element.run();
            });

            it("handles enabling top alignment", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getHeightInPixels: jasmine.createSpy("getHeightInPixels").and.returnValue(3)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const submenu2 = submenu._items.find((item) => {return item.title === "Vertical Align";});
                const element = submenu2._items.find((item) => {return item.title === "Top";});

                element.run();
            });

            it("handles enabling bottom alignment", () => {
                const widget = createwidgetmock({layout: 1});
                const item = new ns.WidgetViewMenuItems(widget);
                spyOn(Wirecloud.LocalCatalogue, 'hasAlternativeVersion').and.returnValue(true);

                const items = item.build();
                widget.layout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({}),
                    dragboard: {
                        topMargin: 1,
                        update: jasmine.createSpy("update")
                    },
                    getHeightInPixels: jasmine.createSpy("getHeightInPixels").and.returnValue(3)
                };
                expect(items).toEqual(jasmine.any(Array));
                const submenu = items.find((item) => {return item.title === "Placement";});
                const submenu2 = submenu._items.find((item) => {return item.title === "Vertical Align";});
                const element = submenu2._items.find((item) => {return item.title === "Bottom";});

                element.run();
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
