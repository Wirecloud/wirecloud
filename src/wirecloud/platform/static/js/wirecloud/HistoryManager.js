/*
 *     Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var currentState = {};

    var onpopstate = function onpopstate(event) {
        if (event.state === null) {
            return;
        }

        currentState = event.state;
        document.title = currentState.title;
        Wirecloud.UserInterfaceManager.onHistoryChange(event.state);
    };

    var prepareData = function prepareData(data) {
        var header, key, default_data = {
            view: "workspace"
        };
        data = utils.merge(default_data, data);

        header = Wirecloud.UserInterfaceManager.header;
        if (header != null && header.currentView != null) {
            data.title = header.currentView.getTitle();
        } else {
            data.title = document.title;
        }
        for (key in data) {
            data[key] = "" + data[key];
        }
        return data;
    };

    var buildURL = function buildURL(data) {
        var key, hash = '';

        for (key in data) {
            if (['workspace_name', 'workspace_owner', 'title'].indexOf(key) !== -1) {
                continue;
            }
            hash += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
        }

        return window.location.protocol + "//" +
            window.location.host +
            "/" + encodeURIComponent(data.workspace_owner) + '/' + encodeURIComponent(data.workspace_name) +
            window.location.search +
            '#' + hash.substr(1);
    };

    var HistoryManager = {};

    HistoryManager.init = function init() {
        var initialState = this._parseStateFromHash(window.location.hash);
        this._parseWorkspaceFromPathName(window.location.pathname, initialState);

        window.addEventListener(
            "popstate",
            onpopstate.bind(this),
            true);

        initialState = prepareData(initialState);
        var url = buildURL(initialState);

        history.replaceState(initialState, document.title, url);
        currentState = initialState;
    };

    HistoryManager._parseStateFromHash = function _parseStateFromHash(hash) {
        var definitions, i, pair, key, value, data = {};

        if (hash.charAt(0) === '#') {
            hash = hash.substr(1);
        }
        if (hash.length === 0) {
            return data;
        }

        definitions = hash.split('&');
        for (i = 0; i < definitions.length; i += 1) {
            pair = definitions[i].split('=');
            key = decodeURIComponent(pair[0]);
            value = decodeURIComponent(pair[1]);
            data[key] = value;
        }

        return data;
    };

    HistoryManager._parseWorkspaceFromPathName = function _parseWorkspaceFromPathName(pathname, status) {
        var index, index2;

        index = pathname.lastIndexOf('/');
        index2 = pathname.lastIndexOf('/', index - 1);

        status.workspace_owner = decodeURIComponent(pathname.substring(index2 + 1, index));
        status.workspace_name = decodeURIComponent(pathname.substring(index + 1));
    };

    HistoryManager.pushState = function pushState(data) {
        var url, key, equal;

        data = prepareData(data);
        equal = true;
        for (key in data) {
            if (data[key] !== currentState[key]) {
                equal = false;
                break;
            }
        }
        if (equal) {
            return;
        }
        url = buildURL(data);

        history.pushState(data, null, url);
        document.title = data.title;
        currentState = data;
    };

    HistoryManager.replaceState = function replaceState(data) {
        var url, key, equal;

        data = prepareData(data);
        equal = true;
        for (key in data) {
            if (data[key] !== currentState[key]) {
                equal = false;
                break;
            }
        }
        if (equal) {
            return;
        }
        url = buildURL(data);

        history.replaceState(data, null, url);
        document.title = data.title;
        currentState = data;
    };

    HistoryManager.getCurrentState = function getCurrentState() {
        return utils.clone(currentState);
    };

    Wirecloud.HistoryManager = HistoryManager;

})(Wirecloud.Utils);
