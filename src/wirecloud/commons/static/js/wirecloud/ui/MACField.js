/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var MACField, onclick, onfocus, onblur;

    onclick = function onclick(e) {

        if ('target' in e && e.target === this.wrapperElement) {
            e.stopPropagation();
            e.preventDefault();
        }

        var dialog = new Wirecloud.ui.MACSelectionWindowMenu(this.dialog_title, {
            scope: this.scope,
        });
        dialog.show(this.parent_dialog);
        dialog.addEventListener('select', function (menu, selected_mashup) {
            this.setValue(selected_mashup);
        }.bind(this));

    };

    onfocus = function onfocus() {
        this.wrapperElement.classList.add('focus');
        this.dispatchEvent('focus');
    };

    onblur = function onblur() {
        this.wrapperElement.classList.remove('focus');
        this.dispatchEvent('blur');
    };

    /**
     * Añade un campo de texto.
     */
    MACField = function MACField(options) {
        var defaultOptions = {
            'class': '',
            'scope': '',
            'dialog': null
        };
        options = Wirecloud.Utils.merge(defaultOptions, options);

        StyledElements.InputElement.call(this, options.initialValue, ['change', 'focus', 'blur']);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = 'se-mac-field se-input-group';
        if (options.class !== "") {
            this.wrapperElement.className += " " + options.class;
        }

        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "hidden");

        if (options.name) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.id != null) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        var close_button = new StyledElements.Button({iconClass: 'fa fa-remove', title: utils.gettext('Clear current selection')});
        close_button.appendTo(this.wrapperElement);
        close_button.disable().addEventListener('click', function () {
            this.setValue('');
        }.bind(this));

        this.name_preview = document.createElement('div');
        this.name_preview.className = 'se-add-on';
        this.wrapperElement.appendChild(this.name_preview);
        this.wrapperElement.appendChild(this.inputElement);

        var button = new StyledElements.Button({iconClass: 'fa fa-search', title: utils.gettext('Search')});
        button.appendTo(this.wrapperElement);

        /* Public fields */
        Object.defineProperties(this, {
            'close_button': {value: close_button},
            'scope': {value: options.scope},
            'parent_dialog': {value: options.parent_dialog},
            'dialog_title': {value: options.dialog_title}
        });

        /* Internal events */
        this.wrapperElement.addEventListener('click', onclick.bind(this), false);
        button.addEventListener('click', onclick.bind(this), true);
        close_button.addEventListener('focus', onfocus.bind(this));
        close_button.addEventListener('blur', onblur.bind(this));
        button.addEventListener('focus', onfocus.bind(this));
        button.addEventListener('blur', onblur.bind(this));
    };
    MACField.prototype = new StyledElements.InputElement();

    MACField.prototype.insertInto = function insertInto(element, refElement) {
        StyledElements.InputElement.prototype.insertInto.call(this, element, refElement);
        this.repaint();
    };

    MACField.prototype.setValue = function setValue(new_value) {
        var mac_id, mac_title;

        if (typeof new_value !== 'string') {
            mac_id = new_value.uri;
            mac_title = new_value.title;
        } else {
            mac_id = new_value;
            mac_title = new_value;
        }

        this.inputElement.value = mac_id;

        this.name_preview.textContent = mac_title;
        this.close_button.setDisabled(new_value === '');
        this.dispatchEvent('change');
    };

    MACField.prototype.getValue = function getValue() {
        return this.inputElement.value;
    };

    Wirecloud.ui.MACField = MACField;


    var MACInputInterface = function MACInputInterface(fieldId, options) {
        if (arguments.length === 0) {
            return;
        }

        StyledElements.InputInterface.call(this, fieldId, options);

        this.inputElement = new Wirecloud.ui.MACField(options);
    };
    MACInputInterface.prototype = new StyledElements.InputInterface();

    Wirecloud.ui.MACInputInterface = MACInputInterface;

})(Wirecloud.Utils);
