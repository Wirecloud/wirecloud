/*global LayoutManagerFactory*/

(function () {

    "use strict";

    if (!('history' in window) || !('pushState' in window.history)) {
        throw new Error('history support not found');
    }

    var onpopstate = function onpopstate(event) {
        if (event.state === null) {
            return;
        }

        LayoutManagerFactory.getInstance().onHashChange(event.state);
    };

    var prepareData = function prepareData(data) {
        var key, default_data = {
            view: "workspace"
        };
        data = Wirecloud.Utils.merge(default_data, data);
        for (key in data) {
            data[key] = "" + data[key];
        }
        return data;
    };

    var buildURL = function buildURL(data) {
        var key, hash = '';

        for (key in data) {
            if (key === 'workspace_name' || key === 'workspace_creator') {
                continue;
            }
            hash += '&' + encodeURI(key) + '=' + encodeURI(data[key]);
        }

        return window.location.protocol + "//" +
            window.location.host +
            "/" + encodeURIComponent(data.workspace_creator) + '/' + encodeURIComponent(data.workspace_name) +
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

        var initialState = prepareData(initialState);
        var url = buildURL(initialState);

        history.replaceState(initialState, document.title, url);
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

        status.workspace_creator = decodeURIComponent(pathname.substring(index2 + 1, index));
        status.workspace_name = decodeURIComponent(pathname.substring(index + 1));
    };

    HistoryManager.pushState = function pushState(data) {
        var url, key, equal;

        data = prepareData(data);
        equal = true;
        for (key in data) {
            if (data[key] !== history.state[key]) {
                equal = false;
                break;
            }
        }
        if (equal) {
            return;
        }
        url = buildURL(data);

        history.pushState(data, "", url);
    };

    HistoryManager.replaceState = function replaceState(data) {
        var url, key, equal;

        data = prepareData(data);
        equal = true;
        for (key in data) {
            if (data[key] !== history.state[key]) {
                equal = false;
                break;
            }
        }
        if (equal) {
            return;
        }
        url = buildURL(data);

        history.replaceState(data, "", url);
    };

    HistoryManager.getCurrentState = function getCurrentState() {
        return Object.clone(history.state);
    };

    window.HistoryManager = HistoryManager;

})();
