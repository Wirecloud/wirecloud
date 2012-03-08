/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50, prototypejs: true */
/*global EzWebExt, gettext, StyledElements*/

var CatalogueSearchView = function (id, options) {
    options.id = 'search_interface';
    this.catalogue = options.catalogue;
    StyledElements.Alternative.call(this, id, options);

    this.wrapperElement.innerHTML = $('wirecloud_catalogue_search_interface').getTextContent();
    this.timeout = null;

    this.simple_search_input = this.wrapperElement.getElementsByClassName('simple_search_text')[0];
    this.view_all_button = this.wrapperElement.getElementsByClassName('view_all')[0];

    EzWebExt.addEventListener(this.simple_search_input, 'keypress', this._onSearchInputKeyPress.bind(this));

    EzWebExt.addEventListener(this.view_all_button, 'click', function () {
        this.simple_search_input.value = '';
        this._search();
    }.bind(this));
};
CatalogueSearchView.prototype = new StyledElements.Alternative();

CatalogueSearchView.prototype._search = function (event) {
    var options;

    options = {
        'order_by': $('results_order').value,
        'search_criteria': this.simple_search_input.value,
        'search_boolean': 'AND',
        'scope': 'all',
        'starting_page': 1,
        'resources_per_page': $('results_per_page').value
    };

    this.catalogue.search(options);
};

CatalogueSearchView.prototype._onSearchInputKeyPress = function (event) {
    event = event || window.event;

    switch (event.keyCode) {
    case 16: // shift
    case 17: // ctrl
    case 18: // alt
        return;

    case 13: // enter

        // Cancel current timeout
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        // Inmediate search
        this._search();

        // Don't set a new timeout
        return;

    default:
        // Cancel current timeout
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    this.timeout = setTimeout(this._search.bind(this), 700);
};
