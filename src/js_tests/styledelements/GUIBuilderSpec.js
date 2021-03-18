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

/* globals StyledElements */


(function () {

    "use strict";

    describe("GUI Builder", function () {

        let dom = null;

        beforeEach(function () {
            dom = document.createElement('div');
            document.body.appendChild(dom);
        });

        afterEach(function () {
            if (dom != null) {
                dom.remove();
                dom = null;
            }
        });

        it("can be created without passing any option", function () {

            const builder = new StyledElements.GUIBuilder();
            expect(builder).not.toEqual(null);

        });

        it("should throw TypeError exceptions when passing an invalid type for the document argument", function () {
            const builder = new StyledElements.GUIBuilder();
            expect(function () {builder.parse(5);}).toThrow(jasmine.any(TypeError));
        });

        it("should support basic html templates", function () {

            const builder = new StyledElements.GUIBuilder();
            const html = 'text at the start <div>text</div> text in the middle <div><div class="nested">nested text</div></div>text at the ending';
            const result = builder.parse(builder.DEFAULT_OPENING + html + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(5);

        });

        const check_final_element = function check_final_element(element, label, rendered_value) {
            if (label.indexOf('text') !== -1) {
                expect(element.nodeType).toBe(Node.TEXT_NODE);
                expect(element.textContent).toBe(rendered_value);
            } else if (label.indexOf('styled elements')) {
                if (element instanceof StyledElements.StyledElement) {
                    element = element.get();
                }

                expect(element.nodeType).toBe(Node.ELEMENT_NODE);

                // Remove xhtml namespace
                let outerHTML = element.outerHTML.replace(' xmlns="http://www.w3.org/1999/xhtml"', '');

                // Work around chrome and firefox using a different order for attributes
                outerHTML = outerHTML.replace(' tabindex="0"', '');

                expect(outerHTML).toBe(rendered_value);
            }
        };

        const check_template_context_type = function check_template_context_text(label, value, rendered_value, rendered_value_options) {
            if (label.indexOf('null') !== -1) {
                rendered_value = '';
                rendered_value_options = '';
            } else {
                rendered_value = rendered_value != null ? rendered_value : value;
            }

            it("should support " + label + " context (as root node)", function () {

                const builder = new StyledElements.GUIBuilder();
                const html = '<t:test/>';
                const context = {
                    test: value
                };
                const result = builder.parse(builder.DEFAULT_OPENING + html + builder.DEFAULT_CLOSING, context);
                expect(result.elements.length).toBe(1);
                if (label.indexOf('styled elements') !== -1) {
                    expect(result.elements[0]).toEqual(jasmine.any(StyledElements.StyledElement));
                }
                check_final_element(result.elements[0], label, rendered_value);

            });

            it("should support " + label + " context (as nested child)", function () {

                const builder = new StyledElements.GUIBuilder();
                const html = '<div><t:test/></div>';
                const context = {
                    test: value
                };
                const result = builder.parse(builder.DEFAULT_OPENING + html + builder.DEFAULT_CLOSING, context);
                expect(result.elements.length).toBe(1);
                expect(result.elements[0].nodeType).toBe(Node.ELEMENT_NODE);
                const child = result.elements[0].childNodes[0];
                check_final_element(child, label, rendered_value);

            });

            it("should support " + label + " context (as component child)", function () {

                const builder = new StyledElements.GUIBuilder();
                const html = '<s:borderlayout><s:northcontainer><t:test/></s:northcontainer></s:borderlayout>';
                const context = {
                    test: value
                };
                const result = builder.parse(builder.DEFAULT_OPENING + html + builder.DEFAULT_CLOSING, context);
                expect(result.elements.length).toBe(1);
                const child = result.elements[0].north.wrapperElement.childNodes[0];
                check_final_element(child, label, rendered_value);

            });

            if (label.indexOf('function') !== -1) {
                it("should support " + label + " context (passing options)", function () {

                    const builder = new StyledElements.GUIBuilder();
                    const html = '<t:test>{"class": "my-class"}</t:test>';
                    const context = {
                        test: value
                    };
                    const result = builder.parse(builder.DEFAULT_OPENING + html + builder.DEFAULT_CLOSING, context);
                    expect(result.elements.length).toBe(1);
                    const child = result.elements[0];
                    check_final_element(child, label, rendered_value_options);
                });

                it("should ignore malformed json options", function () {
                    const builder = new StyledElements.GUIBuilder();
                    const html = '<t:test>{"class" = "my-class"}</t:test>';
                    const context = {
                        test: value
                    };
                    const result = builder.parse(builder.DEFAULT_OPENING + html + builder.DEFAULT_CLOSING, context);
                    expect(result.elements.length).toBe(1);
                    const child = result.elements[0];
                    check_final_element(child, label, rendered_value);
                });


                it("should support " + label + " context (passing options as attributes)", function () {

                    const builder = new StyledElements.GUIBuilder();
                    const html = '<t:test class="my-class"/>';
                    const context = {
                        test: value
                    };
                    const result = builder.parse(builder.DEFAULT_OPENING + html + builder.DEFAULT_CLOSING, context);
                    expect(result.elements.length).toBe(1);
                    const child = result.elements[0];
                    check_final_element(child, label, rendered_value_options);

                });

                it("should support " + label + " context (passing options as attributes and as body)", function () {

                    const builder = new StyledElements.GUIBuilder();
                    const html = '<t:test class="my-class">{"class": "other-class"}</t:test>';
                    const context = {
                        test: value
                    };
                    const result = builder.parse(builder.DEFAULT_OPENING + html + builder.DEFAULT_CLOSING, context);
                    expect(result.elements.length).toBe(1);
                    const child = result.elements[0];
                    check_final_element(child, label, rendered_value_options);

                });
            }

            if (label.indexOf('null') !== -1) {
                label = 'text';
            }
        };

        check_template_context_type("null values", null);
        check_template_context_type("normal text", "hello world!!");
        check_template_context_type("text with especial chars", "a < 5 & b > 4");
        check_template_context_type("function returning elements",
            function (options) {
                const element = document.createElement('div');
                element.textContent = 'a';
                if (options != null && 'class' in options) {
                    element.className = options.class;
                }
                return element;
            },
            '<div>a</div>',
            '<div class="my-class">a</div>'
        );
        check_template_context_type("function returning styled elements",
            function (options) {
                const element = new StyledElements.Button({text: 'a'});
                if (options != null && 'class' in options) {
                    element.addClassName(options.class);
                }
                return element;
            },
            '<div class="se-btn"><span>a</span></div>',
            '<div class="se-btn my-class"><span>a</span></div>'
        );
        check_template_context_type("function returning null", function (options) {return null;});

        it("should allow to create borderlayout elements", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<s:borderlayout><s:northcontainer><s:options>{"class": "my-class"}</s:options></s:northcontainer></s:borderlayout>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0]).toEqual(jasmine.any(StyledElements.BorderLayout));
            expect(result.elements[0].north.hasClassName('my-class')).toBeTruthy();
        });

        it("should allow to create horizontallayout elements", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<s:horizontallayout><s:westcontainer><s:options>{"class": "my-class"}</s:options></s:westcontainer></s:horizontallayout>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0]).toEqual(jasmine.any(StyledElements.HorizontalLayout));
            expect(result.elements[0].west.hasClassName('my-class')).toBeTruthy();
        });

        it("should allow to create verticallayout elements", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<s:verticallayout><s:southcontainer><s:options>{"class": "my-class"}</s:options></s:southcontainer></s:verticallayout>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0]).toEqual(jasmine.any(StyledElements.VerticalLayout));
            expect(result.elements[0].south.hasClassName('my-class')).toBeTruthy();
        });

        it("should allow to create button elements", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<s:button>Save</s:button>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0]).toEqual(jasmine.any(StyledElements.Button));
        });

        it("should allow to create button elements passing options", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<s:button><s:options>{"state": "primary"}</s:options>Save</s:button>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0]).toEqual(jasmine.any(StyledElements.Button));
            expect(result.elements[0].state).toBe('primary');
        });

        it("should allow to create select elements", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<s:select/>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0]).toEqual(jasmine.any(StyledElements.Select));
        });

        it("should allow to create select elements passing options", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<s:select><s:options>{"class": "my-class"}</s:options></s:select>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0]).toEqual(jasmine.any(StyledElements.Select));
            expect(result.elements[0].hasClassName('my-class')).toBeTruthy();
        });

        it("should allow to create select elements passing options as attributes", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<s:select class="my-class"/>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0]).toEqual(jasmine.any(StyledElements.Select));
            expect(result.elements[0].hasClassName('my-class')).toBeTruthy();
        });

        it("should allow to create button elements (on nested elements)", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<div><s:button>Save</s:button></div>';
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0].nodeType).toBe(Node.ELEMENT_NODE);
            // Remove xhtml namespace
            const outerHTML = result.elements[0].outerHTML.replace(' xmlns="http://www.w3.org/1999/xhtml"', '');
            expect(outerHTML).toBe('<div><div class="se-btn" tabindex="0"><span>Save</span></div></div>');
        });

        it("should allow to nest template elements with function context and json option", function () {
            const builder = new StyledElements.GUIBuilder();
            const template = '<div><t:usermenu plain="true"><t:avatar/><span><t:username/></span><t:test>{"class": "fa fa-caret-down"}</t:test></t:usermenu></div>';
            const context = {
                avatar: document.createElement('img'),
                username: "John Doe",
                usermenu: (options) => {
                    this.user_button = new StyledElements.PopupButton(options);
                    return this.user_button;
                },
                test: (options) => {
                    const testDiv = document.createElement('div');
                    testDiv.innerHTML = 'a';
                    if (options != null && 'class' in options) {
                        testDiv.className = options.class;
                    }
                    return testDiv;
                }
            };
            const result = builder.parse(builder.DEFAULT_OPENING + template + builder.DEFAULT_CLOSING, context);
            expect(result.elements.length).toBe(1);
            expect(result.elements[0].nodeType).toBe(Node.ELEMENT_NODE);
            expect(result.elements[0].childNodes.length).toBe(1);
            expect(result.elements[0].childNodes[0].nodeType).toBe(Node.ELEMENT_NODE);
            expect(result.elements[0].childNodes[0].childNodes.length).toBe(3);
            // Remove xhtml namespace
            let outerHTML = result.elements[0].outerHTML.replace(' xmlns="http://www.w3.org/1999/xhtml"', '');
            // "Normalize" empty tags to work with different HTML engines (Firefox 45 vs Firefox 60)
            outerHTML = outerHTML.replace(/ \/>/g, "/>");
            expect(outerHTML).toBe('<div><div class="se-btn plain" tabindex="0"><img/><span>John Doe</span><div class="fa fa-caret-down">a</div></div></div>');
        });
    });

})();
