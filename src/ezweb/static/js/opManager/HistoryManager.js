var HistoryManager = new Object();

HistoryManager.init = function(initial_workspace) {
    this.initialState = this._parseStateFromHash(window.location.hash);
    if (initial_workspace != null) {
        this.initialState.workspace = "" + initial_workspace;
    } else {
        this.initialState.workspace = this._parseWorkspaceFromPathName(window.location.pathname);
    }

    if ('history' in window && 'pushState' in window.history) {
        Event.observe(window,
            "popstate",
            this._onpopstate.bind(this),
            true);
        history.replaceState(this.initialState, "", window.location.href);
        this.currentState = this.initialState;

        this._pushState = function(data, title, url) {
            history.pushState(data, "", url);
            this.currentState = data;
        };

    } else if ('onhashchange' in document || 'onhashchange' in window) {
        Event.observe(window,
            "hashchange",
            this._onhashchange.bind(this),
            true);
        this.currentState = this.initialState;

        this._pushState = function(data, title, url) {
            var url = this._buildURL(data);
            window.location = url;
        };
    }
    this.stateChangeEnabled = true;
};

HistoryManager._parseStateFromHash = function(hash) {
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

HistoryManager._parseWorkspaceFromPathName = function(pathname) {
    var index = pathname.lastIndexOf('/');

    return pathname.substr(index + 1);
};

HistoryManager._prepareData = function(data) {
    var default_data = {
        view: "dragboard"
    }
    data = Object.extend(default_data, data);
    for (key in data) {
        data[key] = "" + data[key];
    }
    return data;
};

HistoryManager._buildURL = function(data) {
    var key,
        hash = '',
        lite = '';

    for (key in data) {
        if (key === 'workspace') {
            continue;
        }
        hash += '&' + encodeURI(key) + '=' + encodeURI(data[key]);
    }

    return window.location.protocol + "//" +
        window.location.host + lite +
        "/workspaces/" + data.workspace +
        window.location.search +
        '#' + hash.substr(1);
};

HistoryManager.pushState = function(data) {
    var url, key, equal;

    if (!this.stateChangeEnabled) {
        return;
    }

    data = this._prepareData(data);
    equal = true;
    for (key in data) {
        if (data[key] !== this.currentState[key]) {
            equal = false;
            break;
        }
    }
    if (equal) {
        return;
    }
    url = this._buildURL(data);

    this._pushState(data, "", url);
};

HistoryManager._onhashchange = function() {
    this.stateChangeEnabled = false;

    var hash = window.location.hash;
    var state = Object.clone(this.initialState);
    Object.extend(state, this._parseStateFromHash(hash));
    this.currentState = state;

    LayoutManagerFactory.getInstance().onHashChange(state);

    this.stateChangeEnabled = true;
};

HistoryManager._onpopstate = function(event) {
    if (event.state === null) {
        return;
    }
    this.stateChangeEnabled = false;

    this.currentState = event.state;
    LayoutManagerFactory.getInstance().onHashChange(event.state);

    this.stateChangeEnabled = true;
};

HistoryManager.getCurrentState = function() {
    return Object.clone(this.currentState);
};

HistoryManager.cloneCurrentState = function() {
    return Object.clone(this.currentState);
};
