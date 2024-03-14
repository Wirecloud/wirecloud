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

(function (se, utils, window) {

    "use strict";

    const oninput = function oninput() {
        this.dispatchEvent('change');
    };

    const onfocus = function onfocus() {
        this.dispatchEvent('focus');

        this.wrapperElement.classList.add('focused');
    };

    const onblur = function onblur() {
        this.dispatchEvent('blur');

        this.wrapperElement.classList.remove('focused');
    };

    const CodeAreaClass = class CodeArea extends se.InputElement {

        constructor(options) {
            const defaultOptions = {
                'initialValue': '',
                'class': '',
                'language': ''
            };

            options = utils.merge(defaultOptions, options);

            super(options.initialValue, ['blur', 'change', 'focus']);

            this.wrapperElement = document.createElement("div");
            this.editor = window.monaco.editor.create(this.wrapperElement, {
                value: options.initialValue,
                language: options.language,
                minimap: { enabled: false },
                automaticLayout: true
            });

            this.wrapperElement.className = "se-code-area";
            if (options.class !== "") {
                this.wrapperElement.className += " " + options.class;
            }

            if (options.name) {
                this.wrapperElement.setAttribute("name", options.name);
            }

            if (options.id != null) {
                this.wrapperElement.setAttribute("id", options.id);
            }

            /* Internal events */
            this._oninput = oninput.bind(this);
            this._onfocus = onfocus.bind(this);
            this._onblur = onblur.bind(this);

            this.editor.onMouseDown((e) => utils.stopPropagationListener(e.event.browserEvent));
            this.editor.getModel().onDidChangeContent(this._oninput);
            this.editor.onDidFocusEditorWidget(this._onfocus);
            this.editor.onDidBlurEditorWidget(this._onblur);

            window.test_editor = this;
        }

        getValue() {
            return this.editor.getValue();
        }

        setValue(newValue) {
            this.editor.setValue(newValue);

            return this;
        }

        enable() {
            this.editor.updateOptions({ readOnly: false });

            return this;
        }

        disable() {
            this.editor.updateOptions({ readOnly: true });

            return this;
        }

        blur() {
            if (this.editor.hasWidgetFocus) {
                window.document.activeElement.blur();
            }

            return this;
        }

        focus() {
            this.editor.focus();

            return this;
        }

        select() {
            this.editor.setSelection(this.editor.getModel().getFullModelRange());
        }

        destroy() {
            this.editor.dispose();

            this.wrapperElement.removeEventListener('click', utils.stopPropagationListener, true);

            delete this._oninput;
            delete this._onfocus;
            delete this._onblur;

            super.destroy();
        }

    };

    /**
     * Styled Code Area
     */
    if (!window.monaco) {
        // If monaco is not available, use the TextArea class
        se.CodeArea = se.TextArea;
        se.__Testing__CodeArea = CodeAreaClass; // For testing purposes
    } else {
        se.CodeArea = CodeAreaClass;
    }

})(StyledElements, StyledElements.Utils, window);