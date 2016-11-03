/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var itemListener = function itemListener() {
        if (this.listComponent.enabled) {
            this.listComponent.toggleElementSelection(this.value);
        }
    };

    var _cleanSelection = function _cleanSelection() {
        for (var i = 0; i < this.currentSelection.length; i++) {
            var value = this.currentSelection[i];
            this.entriesByValue[value].element.classList.remove("selected");
        }
        this.currentSelection = [];
    };

    /**
     * A list
     */
    var List = function List(options) {
        options = utils.merge({
            class: '',
            id: null,
            multivalued: false,
            initialEntries: [],
            initialSelection: []
        }, options);

        StyledElements.StyledElement.call(this, ['change']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = utils.prependWord(options.class, "styled_list");

        if (options.id != null) {
            this.wrapperElement.id = options.id;
        }

        this.content = document.createElement("div");
        this.wrapperElement.appendChild(this.content);

        this.entries = [];
        this.entriesByValue = {};
        this.currentSelection = [];

        this.addEntries(options.initialEntries);
        this.select(options.initialSelection);

        /* Process options */
        if (options.full) {
            this.wrapperElement.classList.add("full");
        }

        this.multivalued = options.multivalued;

        if (options.allowEmpty === undefined) {
            this.allowEmpty = this.multivalued;
        } else {
            this.allowEmpty = options.allowEmpty;
        }
    };
    utils.inherit(List, StyledElements.StyledElement);

    /**
     * Añade las entradas indicadas en la lista.
     */
    List.prototype.addEntries = function addEntries(entries) {
        var entryValue, entryText;

        if (entries == null || entries.length === 0) {
            return;
        }

        if (!Array.isArray(entries)) {
            throw new TypeError();
        }

        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (Array.isArray(entry)) {
                entryValue = entry[0];
                entryText = entry[1];
            } else {
                entryValue = entries[i].value;
                entryText = entries[i].label;
            }
            entryText = entryText ? entryText : entryValue;

            var row = document.createElement("div");
            row.className = "row";

            var context = {listComponent: this, value: entryValue};
            row.addEventListener("click", itemListener.bind(context), true);
            entry.element = row;

            row.appendChild(document.createTextNode(entryText));
            this.content.appendChild(row);

            this.entriesByValue[entryValue] = entry;
        }
        this.entries = this.entries.concat(entries);
    };

    List.prototype.removeEntryByValue = function removeEntryByValue(value) {
        var entry, index;

        entry = this.entriesByValue[value];
        delete this.entriesByValue[value];
        this.entries.slice(this.entries.indexOf(entry), 1);
        entry.element.remove();

        if (index !== -1) {
            this.currentSelection.splice(index, 1);
            this.dispatchEvent('change', this.currentSelection, [], [value]);
        }
    };

    /**
     * Removes all entries of this List
     */
    List.prototype.clear = function clear() {
        this.cleanSelection();

        this.content.innerHTML = '';
        this.entries = [];
        this.entriesByValue = {};
    };

    /**
     * Devuelve una copia de la selección actual.
     */
    List.prototype.getSelection = function getSelection() {
        return utils.clone(this.currentSelection);
    };

    /**
     * Borra la seleccion actual.
     */
    List.prototype.cleanSelection = function cleanSelection() {
        if (this.currentSelection.length === 0) {
            return;  // Nothing to do
        }

        var oldSelection = this.currentSelection;

        _cleanSelection.call(this);

        this.dispatchEvent('change', [], [], oldSelection);
    };

    /**
     * Cambia la selección actual a la indicada.
     *
     * @param {Array} selection lista de valores a seleccionar.
     */
    List.prototype.select = function select(selection) {
        _cleanSelection.call(this);

        this.addSelection(selection);
    };

    /**
     * Añade un conjunto de valores a la selección actual.
     */
    List.prototype.addSelection = function addSelection(selection) {
        var i, entry, addedValues = [], removedValues = [];

        if (selection.length === 0) {
            return;  // Nothing to do
        }

        if (!this.multivalued) {
            if (selection[0] === this.currentSelection[0]) {
                return; // Nothing to do
            }

            removedValues = this.currentSelection;

            _cleanSelection.call(this);

            if (selection.length > 1) {
                selection = selection.splice(0, 1);
            }
        }

        for (i = 0; i < selection.length; i++) {
            entry = selection[i];
            if (this.currentSelection.indexOf(entry) === -1) {
                this.entriesByValue[entry].element.classList.add("selected");
                this.currentSelection.push(entry);
                addedValues.push(entry);
            }
        }

        this.dispatchEvent('change', this.currentSelection, addedValues, removedValues);
    };

    /**
     * Elimina un conjunto de valores de la selección actual.
     */
    List.prototype.removeSelection = function removeSelection(selection) {
        var i, entry, index, removedValues = [];

        if (selection.length === 0) {
            return;  // Nothing to do
        }

        for (i = 0; i < selection.length; i++) {
            entry = selection[i];
            this.entriesByValue[entry].element.classList.remove("selected");
            index = this.currentSelection.indexOf(entry);
            if (index !== -1) {
                this.currentSelection.splice(index, 1);
                this.entriesByValue[entry].element.classList.remove("selected");
                removedValues.push(entry);
            }
        }

        if (removedValues.length > 0) {
            this.dispatchEvent('change', this.currentSelection, [], removedValues);
        }
    };

    /**
     * Añade o borra una entrada de la selección dependiendo de si el elemento está
     * ya selecionado o no. En caso de que la entrada estuviese selecionado, el
     * elemento se eliminiaria de la selección y viceversa.
     */
    List.prototype.toggleElementSelection = function toggleElementSelection(element) {
        if (!this.entriesByValue[element].element.classList.contains("selected")) {
            this.addSelection([element]);
        } else if (this.allowEmpty) {
            this.removeSelection([element]);
        }
    };

    StyledElements.List = List;

})(StyledElements.Utils);
