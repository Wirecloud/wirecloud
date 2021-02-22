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

    ns.SourceEndpoint = class SourceEndpoint extends ns.Endpoint {

        constructor(id, meta) {
            super(id, meta);

            this.outputList = [];
            this.connections = [];
        }

        connect(out, connection) {
            if (!(out instanceof ns.TargetEndpoint)) {
                throw new TypeError('Invalid target endpoint');
            }

            if (this.outputList.indexOf(out) === -1) {
                this.outputList.push(out);
                this.connections.push(connection);
                out._addInput(this, connection);
                connection._connect();
            }
        }

        disconnect(out) {
            if (!(out instanceof ns.TargetEndpoint)) {
                throw new TypeError('Invalid target endpoint');
            }

            const index = this.outputList.indexOf(out);

            if (index !== -1) {
                this.outputList.splice(index, 1);
                const connection = this.connections[index];
                this.connections.splice(index, 1);
                out._removeInput(this, connection);
                connection._disconnect();
            }
        }

        fullDisconnect() {
            [...this.outputList].forEach((output) => {this.disconnect(output)});

            return this;
        }

        formatException(exception) {
            return exception.toString();
        }

        /**
         * Propagates the event to all the TargetEndpoints connected to this
         * SourceEndpoint.
         */
        propagate(value, options) {
            utils.clone(this.outputList).forEach((targetEndpoint, i) => {
                try {
                    targetEndpoint.propagate(value, options);
                } catch (error) {
                    const errorDetails = this.formatException(error);
                    const connection = this.connections[i];
                    connection.logManager.log(errorDetails);
                }
            });
        }

        getReachableEndpoints() {
            const endpoints = [];

            this.outputList.forEach((endpoint) => {
                const currentEndpoints = endpoint.getReachableEndpoints();
                if (Array.isArray(currentEndpoints) && currentEndpoints.length > 0) {
                    endpoints.push(...currentEndpoints);
                }
            });

            return endpoints;
        }

    }

})(Wirecloud.wiring, Wirecloud.Utils);
