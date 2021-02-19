/*
 *     Copyright 2008-2016 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

    ns.TargetEndpoint = class TargetEndpoint extends ns.Endpoint {

        constructor(id, meta) {
            super(id, meta);

            this.inputs = [];
            this.connections = [];
        }

        connect(input, connection) {
            if (!(input instanceof ns.SourceEndpoint)) {
                throw new TypeError('Invalid source endpoint');
            }

            input.connect(this, connection);
        }

        disconnect(input) {
            if (!(input instanceof ns.SourceEndpoint)) {
                throw new TypeError('Invalid source endpoint');
            }

            input.disconnect(this);
        }

        propagate(data, options) {
            // Do nothing by default
        };

        /**
         * @private
         */
        _addInput(input, connection) {
            this.inputs.push(input);
            this.connections.push(connection);
        }

        /**
         * @private
         */
        _removeInput(input, connection) {
            const index = this.inputs.indexOf(input);

            this.inputs.splice(index, 1);
            this.connections.splice(index, 1);
        }

        fullDisconnect() {
            [...this.inputs].forEach((input) => {input.disconnect(this)});

            return this;
        }

    }

})(Wirecloud.wiring, Wirecloud.Utils);
