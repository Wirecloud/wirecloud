/*
 *     Copyright (c) 2011-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    let currentState = {};

    const onpopstate = function onpopstate(event) {
        if (event.state === null) {
            return;
        }

        currentState = event.state;
        document.title = currentState.title;
        Wirecloud.UserInterfaceManager.onHistoryChange(event.state);
    };

    const prepareData = function prepareData(data) {
        data = utils.merge({
            view: "workspace"
        }, data);

        const header = Wirecloud.UserInterfaceManager.header;
        if (header != null && header.currentView != null) {
            data.title = header.currentView.getTitle();
        } else {
            data.title = document.title;
        }
        for (const key in data) {
            data[key] = "" + data[key];
        }
        return data;
    };

    const buildURL = function buildURL(data) {
        let url, key, hash = '';

        if (data.workspace_owner !== "wirecloud" || data.workspace_name !== "landing") {
            url = new URL("/" + encodeURIComponent(data.workspace_owner) + '/' + encodeURIComponent(data.workspace_name), Wirecloud.location.base);
        } else {
            url = new URL("/", Wirecloud.location.base);
        }
        url.search = window.location.search;

        for (key in data) {
            if (['workspace_name', 'workspace_owner', 'workspace_title', 'tab_id', 'title'].indexOf(key) !== -1) {
                continue;
            }
            hash += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
        }
        url.hash = '#' + hash.substr(1);

        return url;
    };

    const HistoryManager = {};

    HistoryManager.init = function init() {
        let initialState = this._parseStateFromHash(window.location.hash);
        this._parseWorkspaceFromPathName(window.location.pathname, initialState);

        window.addEventListener(
            "popstate",
            onpopstate.bind(this),
            true);

        initialState = prepareData(initialState);
        const url = buildURL(initialState);

        history.replaceState(initialState, document.title, url);
        currentState = initialState;
    };

    HistoryManager._parseStateFromHash = function _parseStateFromHash(hash) {
        const data = {};

        if (hash.charAt(0) === '#') {
            hash = hash.substr(1);
        }
        if (hash.length === 0) {
            return data;
        }

        const definitions = hash.split('&');
        definitions.forEach((definition) => {
            const pair = definition.split('=');
            const key = decodeURIComponent(pair[0]);
            const value = decodeURIComponent(pair[1]);
            data[key] = value;
        });

        return data;
    };

    HistoryManager._parseWorkspaceFromPathName = function _parseWorkspaceFromPathName(pathname, status) {
        const index = pathname.lastIndexOf('/');
        const index2 = pathname.lastIndexOf('/', index - 1);

        if (index !== index2) {
            status.workspace_owner = decodeURIComponent(pathname.substring(index2 + 1, index));
            status.workspace_name = decodeURIComponent(pathname.substring(index + 1));
        } else {
            status.workspace_owner = "wirecloud";
            status.workspace_name = "landing";
        }
    };

    HistoryManager.pushState = function pushState(data) {
        data = prepareData(data);
        let equal = true;
        for (const key in data) {
            if (data[key] !== currentState[key]) {
                equal = false;
                break;
            }
        }
        if (equal) {
            return;
        }
        const url = buildURL(data);

        history.pushState(data, null, url);
        document.title = data.title;
        currentState = data;
    };

    HistoryManager.replaceState = function replaceState(data) {
        data = prepareData(data);
        let equal = true;
        for (const key in data) {
            if (data[key] !== currentState[key]) {
                equal = false;
                break;
            }
        }
        if (equal) {
            return;
        }
        const url = buildURL(data);

        history.replaceState(data, null, url);
        document.title = data.title;
        currentState = data;
    };

    HistoryManager.getCurrentState = function getCurrentState() {
        return utils.clone(currentState);
    };

    Wirecloud.HistoryManager = HistoryManager;

})(Wirecloud.Utils);
