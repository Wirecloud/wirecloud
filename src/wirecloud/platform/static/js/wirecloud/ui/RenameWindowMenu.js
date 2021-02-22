/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    ns.RenameWindowMenu = class RenameWindowMenu extends ns.FormWindowMenu {

        constructor(what, title) {
            const fields = {
                "title": {
                    label: utils.gettext("New Name"),
                    type: "text",
                    required: true,
                    initialValue: what.title
                }
            };
            super(fields, title);
            this.what = what;
        }

        setFocus() {
            this.form.fieldInterfaces.title.focus();
        }

        executeOperation(data) {
            return this.what.rename(data.title);
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
