/*
 *     Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Wirecloud*/

(function () {

    "use strict";

    var PropertyCommiter = function PropertyCommiter(iwidget) {
        Object.defineProperty(this, 'iwidget', {value: iwidget});
        this.values = {};
        this.pending_values = null;
        this.timeout = null;
    };

    PropertyCommiter.prototype.add = function add(name, value) {
        if (this.pending_values == null) {
            this.values[name] = value;

            if (this.timeout != null) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(this.commit.bind(this), 1000);
        } else {
            this.pending_values[name] = value;
        }
    };

    PropertyCommiter.prototype.commit = function commit() {
        if (this.timeout != null) {
            clearTimeout(this.timeout);
        }

        if (Object.keys(this.values).length === 0) {
            return; // Nothing to do
        }

        this.timeout = null;
        this.pending_values = {};

        var url = Wirecloud.URLs.IWIDGET_PROPERTIES.evaluate({
            workspace_id: this.iwidget.workspace.id,
            tab_id: this.iwidget.tab.id,
            iwidget_id: this.iwidget.id
        });
        Wirecloud.io.makeRequest(url, {
            contentType: 'application/json',
            postBody: JSON.stringify(this.values),
            onSuccess: function () {
                this.values = this.pending_values;
                if (Object.keys(this.values).length > 0) {
                    this.timeout = setTimeout(this.commit.bind(this), 1000);
                }
                this.pending_values = null;
            }.bind(this),
            onFailure: function () {
                this.values = Wirecloud.Utils.merge(this.values, this.pending_values);
                this.timeout = setTimeout(this.commit.bind(this), 30000);
            }.bind(this)
        });
    };

    Wirecloud.PropertyCommiter = PropertyCommiter;

})();
