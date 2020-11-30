/*
 *     Copyright 2012-2017 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    ns.FormWindowMenu = class FormWindowMenu extends ns.WindowMenu {

        constructor(fields, title, extra_class, options) {
            super(title, extra_class);

            options = Wirecloud.Utils.merge({
                factory: Wirecloud.ui.InputInterfaceFactory,
                autoHide: true
            }, options);
            options.buttonArea = this.windowBottom;

            this.form = new se.Form(fields, options);
            this.form.insertInto(this.windowContent);
            this.form.acceptButton.addClassName('btn-accept');
            this.form.cancelButton.addClassName('btn-cancel');
            this.form.addEventListener('submit', function (form, data) {
                this.form.acceptButton.disable();
                this.form.cancelButton.disable();
                try {
                    var operation = this.executeOperation(data);
                } catch (e) {}
                if (operation != null && typeof operation.then === "function") {
                    this.form.acceptButton.addClassName('busy');
                    operation.then(
                        function () {
                            this.hide();
                        }.bind(this),
                        function (error) {
                            this.form.displayMessage(error);
                            this.form.acceptButton.removeClassName('busy');
                            this.form.acceptButton.enable();
                            this.form.cancelButton.enable();

                        }.bind(this)
                    );
                } else if (options.autoHide === true) {
                    this.hide();
                }
            }.bind(this));
            this.form.addEventListener('cancel', this._closeListener);
        }

        setValue(newValue) {
            this.form.setData(newValue);

            return this;
        }

        setFocus() {
            this.form.focus();

            return this;
        }

        show(parentWindow) {
            this.form.reset();
            this.form.acceptButton.enable();
            this.form.cancelButton.enable();
            super.show(parentWindow);
            this.form.repaint();

            return this;
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
