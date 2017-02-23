/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function () {

    "use strict";

    var PropertyCommiter = function PropertyCommiter(component) {
        Object.defineProperty(this, 'component', {value: component});
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

        if (this.component.meta.type === "widget") {
            commitWidgetProperties.call(this);
        } else /* if (this.component.meta.type === "operator") */ {
            commitOperatorProperties.call(this);
        }

    };

    var commitWidgetProperties = function commitWidgetProperties() {
        var url = Wirecloud.URLs.IWIDGET_PROPERTIES.evaluate({
            workspace_id: this.component.tab.workspace.id,
            tab_id: this.component.tab.id,
            iwidget_id: this.component.id
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
    }

    var commitOperatorProperties = function commitOperatorProperties() {
        var url = (Wirecloud.URLs.WIRING_ENTRY.evaluate({
            workspace_id: this.component.wiring.workspace.id,
        }));

        // Build patch request
        var requestBody = [];
        for (var key in this.values) {
            var property = this.values[key];
            requestBody.push({
                op: "replace",
                path: "/operators/" + this.component.id + "/properties/" + key + "/value",
                value: property
            });
        }

        Wirecloud.io.makeRequest(url, {
            method: 'PATCH',
            contentType: 'application/json-patch+json',
            postBody: JSON.stringify(requestBody),
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
    }

    Wirecloud.PropertyCommiter = PropertyCommiter;

})();
