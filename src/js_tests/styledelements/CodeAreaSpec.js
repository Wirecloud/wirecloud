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

/* globals StyledElements */

(function (se) {

    "use strict";

    describe("CodeArea", () => {

        describe("new CodeArea([options])", () => {

            afterEach(() => {
                if (window.monaco != null) {
                    delete window.monaco;
                }
            });

            it("is a class constructor", () => {
                expect(() => {
                    se.CodeArea();  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("is a TextArea when monaco is not present", () => {
                const codeArea = new se.CodeArea();
                expect(codeArea instanceof se.TextArea).toBe(true);
            });

            it("is a CodeArea when monaco is present", () => {
                const model = {
                    onDidChangeContent: jasmine.createSpy('onDidChangeContent')
                };

                const editor = {
                    onMouseDown: jasmine.createSpy('onMouseDown'),
                    getModel: jasmine.createSpy('getModel').and.returnValue(model),
                    onDidFocusEditorWidget: jasmine.createSpy('onDidFocusEditorWidget'),
                    onDidBlurEditorWidget: jasmine.createSpy('onDidBlurEditorWidget')
                };

                window.monaco = {
                    editor: {
                        create: jasmine.createSpy('monaco.editor.create').and.returnValue(editor)
                    }
                };

                new se.__Testing__CodeArea();
                expect(window.monaco.editor.create).toHaveBeenCalled();
                expect(editor.onMouseDown).toHaveBeenCalled();
                expect(editor.onDidFocusEditorWidget).toHaveBeenCalled();
                expect(editor.onDidBlurEditorWidget).toHaveBeenCalled();
                expect(model.onDidChangeContent).toHaveBeenCalled();
            });

            it("creates a monaco editor with the given options", () => {
                const model = {
                    onDidChangeContent: jasmine.createSpy('onDidChangeContent')
                };

                const editor = {
                    onMouseDown: jasmine.createSpy('onMouseDown'),
                    getModel: jasmine.createSpy('getModel').and.returnValue(model),
                    onDidFocusEditorWidget: jasmine.createSpy('onDidFocusEditorWidget'),
                    onDidBlurEditorWidget: jasmine.createSpy('onDidBlurEditorWidget')
                };

                window.monaco = {
                    editor: {
                        create: jasmine.createSpy('monaco.editor.create').and.returnValue(editor)
                    }
                };

                new se.__Testing__CodeArea({
                    initialValue: 'initialValue',
                    class: 'test-class',
                    language: 'test-language',
                    name: 'test-name'
                });

                expect(window.monaco.editor.create).toHaveBeenCalledWith(jasmine.any(HTMLElement), {
                    value: 'initialValue',
                    language: 'test-language',
                    minimap: { enabled: false },
                    automaticLayout: true
                });

                const wrapperElement = window.monaco.editor.create.calls.mostRecent().args[0];
                expect(wrapperElement.className).toBe('se-code-area test-class');
                expect(wrapperElement.getAttribute('name')).toBe('test-name');
            });

        });

        describe("actions and events", () => {

            it("dispatches a change event", () => {
                let inputCallback;

                const model = {
                    onDidChangeContent: (callback) => {
                        inputCallback = callback;
                    }
                };

                const editor = {
                    onMouseDown: jasmine.createSpy('onMouseDown'),
                    getModel: jasmine.createSpy('getModel').and.returnValue(model),
                    onDidFocusEditorWidget: jasmine.createSpy('onDidFocusEditorWidget'),
                    onDidBlurEditorWidget: jasmine.createSpy('onDidBlurEditorWidget')
                };

                window.monaco = {
                    editor: {
                        create: jasmine.createSpy('monaco.editor.create').and.returnValue(editor)
                    }
                };

                const codeArea = new se.__Testing__CodeArea();
                const changeCallback = jasmine.createSpy('changeCallback');
                codeArea.addEventListener('change', changeCallback);

                inputCallback();
                expect(changeCallback).toHaveBeenCalled();
            });

            it("dispatches a change event on input", () => {
                const model = {
                    onDidChangeContent: jasmine.createSpy('onDidChangeContent')
                };

                const editor = {
                    onMouseDown: jasmine.createSpy('onMouseDown'),
                    getModel: jasmine.createSpy('getModel').and.returnValue(model),
                    onDidFocusEditorWidget: jasmine.createSpy('onDidFocusEditorWidget'),
                    onDidBlurEditorWidget: jasmine.createSpy('onDidBlurEditorWidget'),
                    getValue: jasmine.createSpy('getValue').and.returnValue('value'),
                    setValue: jasmine.createSpy('setValue')
                };

                window.monaco = {
                    editor: {
                        create: jasmine.createSpy('monaco.editor.create').and.returnValue(editor)
                    }
                };

                const codeArea = new se.__Testing__CodeArea();
                expect(codeArea.getValue()).toBe('value');
                codeArea.setValue('newValue');
                expect(editor.setValue).toHaveBeenCalledWith('newValue');
            });

            it("enabled and disables the editor", () => {
                const model = {
                    onDidChangeContent: jasmine.createSpy('onDidChangeContent')
                };

                const editor = {
                    onMouseDown: jasmine.createSpy('onMouseDown'),
                    getModel: jasmine.createSpy('getModel').and.returnValue(model),
                    onDidFocusEditorWidget: jasmine.createSpy('onDidFocusEditorWidget'),
                    onDidBlurEditorWidget: jasmine.createSpy('onDidBlurEditorWidget'),
                    updateOptions: jasmine.createSpy('updateOptions')
                };

                window.monaco = {
                    editor: {
                        create: jasmine.createSpy('monaco.editor.create').and.returnValue(editor)
                    }
                };

                const codeArea = new se.__Testing__CodeArea();
                codeArea.enable();
                expect(editor.updateOptions).toHaveBeenCalledWith({ readOnly: false });
                codeArea.disable();
                expect(editor.updateOptions).toHaveBeenCalledWith({ readOnly: true });
            });

            it("focuses and blurs the editor", () => {
                const model = {
                    onDidChangeContent: jasmine.createSpy('onDidChangeContent')
                };

                const editor = {
                    onMouseDown: jasmine.createSpy('onMouseDown'),
                    getModel: jasmine.createSpy('getModel').and.returnValue(model),
                    onDidFocusEditorWidget: jasmine.createSpy('onDidFocusEditorWidget'),
                    onDidBlurEditorWidget: jasmine.createSpy('onDidBlurEditorWidget'),
                    focus: jasmine.createSpy('focus'),
                    hasWidgetFocus: false
                };

                window.monaco = {
                    editor: {
                        create: jasmine.createSpy('monaco.editor.create').and.returnValue(editor)
                    }
                };

                const codeArea = new se.__Testing__CodeArea();
                codeArea.wrapperElement.blur = jasmine.createSpy('blur');

                codeArea.focus();
                expect(editor.focus).toHaveBeenCalled();
                codeArea.blur();

                expect(codeArea.wrapperElement.blur).not.toHaveBeenCalled();

                editor.hasWidgetFocus = true;
                expect(codeArea.blur.bind(codeArea)).not.toThrow();
            });

            it("selects the editor content", () => {
                const model = {
                    onDidChangeContent: jasmine.createSpy('onDidChangeContent'),
                    getFullModelRange: jasmine.createSpy('getFullModelRange').and.returnValue('fullModelRange')
                };

                const editor = {
                    onMouseDown: jasmine.createSpy('onMouseDown'),
                    getModel: jasmine.createSpy('getModel').and.returnValue(model),
                    onDidFocusEditorWidget: jasmine.createSpy('onDidFocusEditorWidget'),
                    onDidBlurEditorWidget: jasmine.createSpy('onDidBlurEditorWidget'),
                    setSelection: jasmine.createSpy('setSelection')
                };

                window.monaco = {
                    editor: {
                        create: jasmine.createSpy('monaco.editor.create').and.returnValue(editor)
                    }
                };

                const codeArea = new se.__Testing__CodeArea();
                codeArea.select();
                expect(model.getFullModelRange).toHaveBeenCalled();
                expect(editor.setSelection).toHaveBeenCalledWith('fullModelRange');
            });

            it("destroys the editor", () => {
                const model = {
                    onDidChangeContent: jasmine.createSpy('onDidChangeContent')
                };

                const editor = {
                    onMouseDown: jasmine.createSpy('onMouseDown'),
                    getModel: jasmine.createSpy('getModel').and.returnValue(model),
                    onDidFocusEditorWidget: jasmine.createSpy('onDidFocusEditorWidget'),
                    onDidBlurEditorWidget: jasmine.createSpy('onDidBlurEditorWidget'),
                    dispose: jasmine.createSpy('dispose')
                };

                window.monaco = {
                    editor: {
                        create: jasmine.createSpy('monaco.editor.create').and.returnValue(editor)
                    }
                };

                const codeArea = new se.__Testing__CodeArea();
                codeArea.wrapperElement.removeEventListener = jasmine.createSpy('removeEventListener');
                codeArea.destroy();
                expect(editor.dispose).toHaveBeenCalled();
                expect(codeArea.wrapperElement.removeEventListener).toHaveBeenCalledWith('click', jasmine.any(Function), true);
            });

        });

    });

})(StyledElements);