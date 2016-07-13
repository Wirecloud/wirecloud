/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    var RenameWindowMenu = function RenameWindowMenu(what, rename_method) {

        var fields = {
            'title': {
                label: utils.gettext("Title"),
                type: 'text',
                required: true,
                initialValue: what.title
            }
        };
        this.what = what;
        this.rename_method = rename_method;
        Wirecloud.ui.FormWindowMenu.call(this, fields, utils.gettext("New title"));
    };
    RenameWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    RenameWindowMenu.prototype.setFocus = function setFocus() {
        this.form.fieldInterfaces.title.focus();
    };

    RenameWindowMenu.prototype.executeOperation = function executeOperation(data) {
        this.what[this.rename_method](data.title);
    };

    Wirecloud.ui.RenameWindowMenu = RenameWindowMenu;

})(Wirecloud.Utils);
