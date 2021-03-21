/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, utils) {

    "use strict";

    ns.Endpoint = class Endpoint {

        constructor(id, meta) {
            if (meta == null) {
                meta = {};
            }

            Object.defineProperties(this, {
                name: {value: meta.name},
                friendcode: {value: meta.friendcode || ""},
                label: {value: meta.label || ""},
                description: {value: meta.description || ""},
                id: {value: id}
            });

            const friendcodeList = this.friendcode !== '' ? this.friendcode.split(/\s+/) : [];
            Object.defineProperty(this, 'friendcodeList', {value: friendcodeList});
        }

        getReachableEndpoints() {
            return [];
        }

        /**
         * Disconnects this <code>Endpoint</code> from all the
         * <code>Endpoints</code> this is connected to.
         */
        /* istanbul ignore next */
        fullDisconnect() {
            const funcName = 'fullDisconnect';
            const msg = utils.interpolate(
                utils.gettext("Unimplemented function: %(funcName)s"),
                {
                    funcName: funcName
                },
                true
            );
            Wirecloud.GlobalLogManager.log(msg);
            return this;
        }

    }

})(Wirecloud.wiring, Wirecloud.Utils);
