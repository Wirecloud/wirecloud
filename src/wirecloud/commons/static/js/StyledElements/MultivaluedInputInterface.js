/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    /**
     *
     */
    se.MultivaluedInputInterface = class MultivaluedInputInterface extends StyledElements.InputInterface {
        constructor(fieldId, fieldDesc) {
            super(fieldId, {});

            this.entries = [];
            this.fields = fieldDesc.fields;
            this.inputElement = new StyledElements.Container();
            this.wrapperElement = this.inputElement.wrapperElement;
            this.addEntry();
        }

        addEntry() {
            let entry = {
                wrapper: document.createElement('div')
            };

            let fields = {
                '': {
                    type: 'lineLayout',
                    fields: this.fields
                }
            };

            entry.form = new StyledElements.Form(fields, {
                useHtmlForm: false,
                acceptButton: false,
                cancelButton: false,
                legend: false
            });
            entry.form.wrapperElement.style.display = "inline-block";
            entry.form.wrapperElement.style.verticalAlign = "middle";

            entry.form.insertInto(entry.wrapper);

            entry.addRowButton = new StyledElements.Button({
                class: 'se-add-item-btn',
                iconClass: 'fas fa-plus'
            });
            entry.addRowButton.addEventListener('click', () => {
                this.addEntry();
            }).insertInto(entry.wrapper);

            entry.removeRowButton = new StyledElements.Button({
                class: 'se-remove-item-btn',
                iconClass: 'fas fa-minus',
                state: 'danger'
            });
            entry.removeRowButton.addEventListener('click', () => {
                removeEntry.call(this, entry);
            });
            entry.removeRowButton.insertInto(entry.wrapper);

            this.entries.push(entry);
            this.wrapperElement.appendChild(entry.wrapper);

            return entry;
        }

        clear() {
            this.entries.forEach((entry) => {
                this.wrapperElement.removeChild(entry.wrapper);
                entry.form.destroy();
            });
            this.entries = [];

            return this;
        }

        getValue() {
            return this.entries.map((entry) => {return entry.form.getData();});
        }

        static parse(text) {
            return JSON.parse(text);
        }

        _setValue(newValue) {
            this.clear();

            if (!(newValue instanceof Array)) {
                newValue = [];
            }

            newValue.forEach((item) => {
                let entry = this.addEntry();
                entry.form.setData(item);
            });

            if (this.entries.length === 0) {
                this.addEntry();
            }

            return this;
        }

        _setError(error) {
            // TODO
            return this;
        }

    }

    const removeEntry = function removeEntry(entry) {
        this.wrapperElement.removeChild(entry.wrapper);
        utils.removeFromArray(this.entries, entry);
        entry.form.destroy();

        if (this.entries.length === 0) {
            this.addEntry();
        }
    };

})(StyledElements, StyledElements.Utils);
