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


(function (se, utils) {

    "use strict";

    var HTMLWindowMenu = function HTMLWindowMenu(url, title, extra_class, options) {

        // Allow hierarchy
        if (arguments.length === 0) {
            return;
        }

        this.url = url;

        if (extra_class != null) {
            extra_class = 'wc-html-window-menu ' + extra_class;
        } else {
            extra_class = 'wc-html-window-menu';
        }

        Wirecloud.ui.WindowMenu.call(this, title, extra_class);

        // Close button
        this.button = new se.Button({
            text: utils.gettext('Close'),
            'class': 'btn-primary'
        });
        this.button.insertInto(this.windowBottom);
        this.button.addEventListener("click", this._closeListener);
    };
    utils.inherit(HTMLWindowMenu, Wirecloud.ui.WindowMenu);

    HTMLWindowMenu.prototype.show = function show() {
        this.windowContent.innerHTML = '';
        this.windowContent.classList.add('disabled');
        Wirecloud.ui.WindowMenu.prototype.show.apply(this, arguments);
        Wirecloud.io.makeRequest(this.url, {
            method: 'GET',
            onSuccess: function (response) {
                this.windowContent.innerHTML = response.responseText;
                this.calculatePosition();
            }.bind(this),
            onFailure: function (response) {
                this.windowContent.innerHTML = '<div class="alert alert-danger">Error processing resource documentation</div>';
            },
            onComplete: function () {
                this.windowContent.classList.remove('disabled');
            }.bind(this)
        });
    };

    Wirecloud.ui.HTMLWindowMenu = HTMLWindowMenu;

})(StyledElements, Wirecloud.Utils);
