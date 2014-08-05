/*
 *     Copyright 2012-2013 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Form, Wirecloud */

(function () {

    "use strict";

    /**
     * Form dialog.
     */
    var FormWindowMenu = function FormWindowMenu(fields, title, extra_class, options) {

        // Allow hierarchy
        if (arguments.length === 0) {
            return;
        }

        Wirecloud.ui.WindowMenu.call(this, title, extra_class);

        options = Wirecloud.Utils.merge({
            factory: Wirecloud.ui.InputInterfaceFactory,
            autoHide: true
        }, options);
        options.buttonArea = this.windowBottom;

        this.form = new Form(fields, options);
        this.form.insertInto(this.windowContent);
        this.form.addEventListener('submit', function (form, data) {
            this.form.acceptButton.disable();
            this.form.cancelButton.disable();
            try {
                this.executeOperation(data);
            } catch (e) {}
            if (options.autoHide === true) {
                this.hide();
            }
        }.bind(this));
        this.form.addEventListener('cancel', this._closeListener);
    };
    FormWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    FormWindowMenu.prototype.setValue = function setValue(newValue) {
        this.form.setData(newValue);
    };

    FormWindowMenu.prototype.show = function show(parentWindow) {
        this.form.reset();
        this.form.acceptButton.enable();
        this.form.cancelButton.enable();
        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);
        this.form.repaint();
    };

    Wirecloud.ui.FormWindowMenu = FormWindowMenu;
})();
