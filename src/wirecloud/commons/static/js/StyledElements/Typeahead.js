/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements */


(function (se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class Typeahead.
     *
     * @constructor
     * @extends {StyledElements.ObjectWithEvents}
     *
     * @version 0.6.2
     * @alias StyledElements.Typeahead
     *
     * @param {Object} [options] - [TODO: description]
     */
    se.Typeahead = function Typeahead(options) {
        options = utils.merge(utils.clone(defaults), options);
        this.superClass(events);

        this.lookup = options.lookup;
        this.compare = options.compare;
        this.build = options.build;

        Object.defineProperties(this, {
            autocomplete: {value: options.autocomplete},
            cleanedQuery: {get: property_cleanedQuery_get},
            dataFiltered: {value: options.dataFiltered},
            minLength: {value: options.minLength},
            suggestions: {value: options.suggestions}
        });

        this.popupMenu = new se.PopupMenu({oneActiveAtLeast: true, useRefElementWidth: true});
        this.popupMenu.on('select', popupMenu_onselect.bind(this));
    };

    // ==================================================================================
    // PUBLIC MEMBERS
    // ==================================================================================

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

          this.textField = textField;
          this.textField.on('change', textField_onchange.bind(this));
          this.textField.on('keydown', textField_onkeydown.bind(this));
          this.textField.on('submit', textField_onsubmit.bind(this));

          return this;
        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var events = ['select', 'show'];

    var defaults = {
        autocomplete: true,
        dataFiltered: false,
        minLength: 2,
        suggestions: true
    };

    var property_cleanedQuery_get = function property_cleanedQuery_get() {
        return this.textField != null ? this.textField.value.trim().split(/\s+/).join(" ") : "";
    };

    var textField_onchange = function textField_onchange() {
        this.userQuery = this.cleanedQuery;

        if (this.selecting) {
            return;
        }

        if (this.suggestions) {
            this.popupMenu.hide().clear();
        }

        if (this.userQuery.length >= this.minLength) {
            this.lookup(this.userQuery, sortResult.bind(this));
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
        var i;

        if (!data.length) {
            return this;
        }

        if (!this.dataFiltered) {
            data = filterData.call(this, data);
        }

        if (this.suggestions) {
            for (i = 0; i < data.length; i++) {
                this.popupMenu.append(createMenuItem.call(this, this.build(this, data[i])));
            }
            this.popupMenu.show(this.textField.getBoundingClientRect());
        }

        return this.trigger('show', data);
    };

    var popupMenu_onselect = function popupMenu_onselect(popupMenu, menuItem) {

        this.selecting = true;
        this.textField.setValue(this.autocomplete ? menuItem.title : "");
        delete this.selecting;

        this.textField.focus();
        this.trigger('select', menuItem);
    };

    var createMenuItem = function createMenuItem(data) {
        var menuItem = new se.MenuItem(utils.highlight(data.title, this.userQuery), null, data.context);

        if (data.iconClass) {
            menuItem.addIconClass(data.iconClass);
        }

        if (data.description) {
            menuItem.setDescription(utils.highlight(data.description, this.userQuery));
        }

        return menuItem;
    };

    var textField_onkeydown = function textField_onkeydown(textField, event, key) {

        if (this.popupMenu.hasActiveChild()) {
            switch(key) {
            case 'Tab':
                event.preventDefault();
                this.popupMenu.selectActiveChild();
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

        if (this.popupMenu.hasActiveChild()) {
            this.popupMenu.selectActiveChild();
        }
    };

})(StyledElements, StyledElements.Utils);
