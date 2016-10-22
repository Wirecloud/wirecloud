/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Create a new instance of class Typeahead.
     *
     * @constructor
     * @mixes {StyledElements.ObjectWithEvents}
     *
     * @since 0.6.2
     * @name StyledElements.Typeahead
     *
     * @param {Object} [options] - [TODO: description]
     */
    se.Typeahead = function Typeahead(options) {
        options = utils.merge(utils.clone(defaults), options);
        se.ObjectWithEvents.call(this, events);

        this.lookup = options.lookup;
        this.compare = options.compare;
        this.build = options.build;
        this.notFoundMessage = options.notFoundMessage;

        this.timeout = null;
        this.currentRequest = null;

        Object.defineProperties(this, {
            autocomplete: {value: options.autocomplete},
            cleanedQuery: {get: property_cleanedQuery_get},
            dataFiltered: {value: options.dataFiltered},
            minLength: {value: options.minLength}
        });

        this.popupMenu = new se.PopupMenu({oneActiveAtLeast: true, useRefElementWidth: true});
        this.popupMenu.addEventListener('click', popupMenu_onselect.bind(this));
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(se.Typeahead, se.ObjectWithEvents, /** @lends StyledElements.Typeahead.prototype */{

        /**
         * [TODO: bind description]
         *
         * @since 0.6.2
         *
         * @param {StyledElements.TextField} textField - [TODO: description]
         * @returns {StyledElements.Typeahead} - The instance on which the member is called.
         */
        bind: function bind(textField) {

            if (!(textField instanceof se.TextField)) {
                throw new TypeError();
            }

            this.textField = textField;
            // TODO
            this.textField.inputElement.setAttribute('autocomplete', 'off');
            this.textField.inputElement.setAttribute('autocorrect', 'off');
            this.textField.inputElement.setAttribute('spellcheck', 'false');

            this.textField.addEventListener('change', textField_onchange.bind(this));
            this.textField.addEventListener('keydown', textField_onkeydown.bind(this));
            this.textField.addEventListener('submit', textField_onsubmit.bind(this));
            this.textField.addEventListener('focus', textField_onchange.bind(this));
            this.textField.addEventListener('blur', textField_onblur.bind(this));

            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var builder = new se.GUIBuilder();
    var events = ['select', 'show'];

    var defaults = {
        autocomplete: true,
        dataFiltered: false,
        minLength: 1
    };

    var property_cleanedQuery_get = function property_cleanedQuery_get() {
        return this.textField != null ? this.textField.value.trim().split(/\s+/).join(" ") : "";
    };

    var textField_onchange = function textField_onchange() {
        if (this.timeout != null) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(search.bind(this), 150);
    };

    var search = function search() {
        this.timeout = null;
        this.userQuery = this.cleanedQuery;

        if (this.userQuery.length >= this.minLength) {
            if (this.currentRequest != null && 'abort' in this.currentRequest) {
                this.currentRequest.abort();
            }
            this.currentRequest = this.lookup(this.userQuery, sortResult.bind(this));
        } else {
            this.popupMenu.hide();
        }
    };

    var filterData = function filterData(data) {
        var i, result = [];

        for (i = 0; i < data.length; i++) {
            switch (this.compare(this.userQuery, data[i])) {
            case 0:
                result.push(data[i]);
                break;
            default:
                // do nothing yet.
                break;
            }
        }

        return result;
    };

    var sortResult = function sortResult(data) {
        var i, msg, item;

        this.currentRequest = null;
        this.popupMenu.clear();

        if (data.length > 0) {
            if (!this.dataFiltered) {
                data = filterData.call(this, data);
            }

            for (i = 0; i < data.length; i++) {
                this.popupMenu.append(createMenuItem.call(this, this.build(this, data[i])));
            }
        } else {
            msg = this.notFoundMessage != null ? this.notFoundMessage : utils.gettext("No results found for <em><t:query/></em>");
            msg = builder.DEFAULT_OPENING + msg + builder.DEFAULT_CLOSING;
            msg = builder.parse(msg, {query: this.cleanedQuery});
            item = new StyledElements.MenuItem(msg);
            item.disable();
            this.popupMenu.append(item);
        }
        this.popupMenu.show(this.textField.getBoundingClientRect());

        return this.dispatchEvent('show', data);
    };

    var popupMenu_onselect = function popupMenu_onselect(popupMenu, menuItem) {
        // TODO: this is needed to not firing the change event on the Text Field. Search another way
        this.textField.inputElement.value = this.autocomplete ? menuItem.context.value : "";
        this.textField.focus();

        menuItem.context = menuItem.context.context;
        this.dispatchEvent('select', menuItem);
    };

    var createMenuItem = function createMenuItem(data) {
        var menuItem = new se.MenuItem(new se.Fragment(utils.highlight(data.title, this.userQuery)), null, data);

        if (data.iconClass) {
            menuItem.addIconClass(data.iconClass);
        }

        if (data.description) {
            menuItem.setDescription(new se.Fragment(utils.highlight(data.description, this.userQuery)));
        }

        return menuItem;
    };

    var textField_onkeydown = function textField_onkeydown(textField, event, key) {

        if (this.popupMenu.hasEnabledItem()) {
            switch (key) {
            case 'Tab':
            case 'Enter':
                event.preventDefault();
                this.popupMenu.activeItem.click();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.popupMenu.moveCursorDown();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.popupMenu.moveCursorUp();
                break;
            default:
                // Quit when this doesn't handle the key event.
            }
        }
    };

    var textField_onsubmit = function textField_onsubmit(textField) {
        if (this.popupMenu.hasEnabledItem()) {
            this.popupMenu.activeItem.click();
        }
    };

    var textField_onblur = function textField_onblur(textField) {
        if (this.timeout != null) {
            clearTimeout(this.timeout);
        }
        if (this.currentRequest != null && 'abort' in this.currentRequest) {
            this.currentRequest.abort();
        }
        this.timeout = null;
        this.currentRequest = null;
        setTimeout(this.popupMenu.hide.bind(this.popupMenu), 100);
    };

})(StyledElements, StyledElements.Utils);
