/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Tab, StyledElements, Wirecloud */

(function (se, utils) {

    "use strict";

    var build_endpoints = function build_endpoints() {
        this.inputs = {};
        this.meta.inputList.forEach(function (endpoint) {
            this.inputs[endpoint.name] = new Wirecloud.wiring.WidgetTargetEndpoint(this, endpoint);
        }, this);
        this.outputs = {};
        this.meta.outputList.forEach(function (endpoint) {
            this.outputs[endpoint.name] = new Wirecloud.wiring.WidgetSourceEndpoint(this, endpoint);
        }, this);
    };

    var build_prefs = function build_prefs(initial_values) {
        var preference_name, widget_pref_info;

        this.preferenceList = [];
        this.preferences = {};

        for (preference_name in initial_values) {
            widget_pref_info = initial_values[preference_name];
            this.preferences[preference_name] = new Wirecloud.UserPref(this.meta.preferences[preference_name], widget_pref_info.readonly, widget_pref_info.hidden, widget_pref_info.value);
        }

        this.meta.preferenceList.forEach(function (preference) {
            if (!(preference.name in this.preferences)) {
                this.preferences[preference.name] = new Wirecloud.UserPref(preference, false, false, preference.default);
            }

            this.preferenceList.push(this.preferences[preference.name]);
        }, this);
    };

    /**
     */
    var WidgetBase = function WidgetBase(widget, tab, options) {

        var i, preferences, iwidget_pref_info, properties, iwidget_prop_info, get_meta, set_meta, upgrade;

        if (typeof options !== 'object' || !(widget instanceof Wirecloud.WidgetMeta)) {
            throw new TypeError();
        }

        if (!(tab instanceof Tab)) {
            throw new TypeError();
        }

        if (options.persist == null) {
            options.persist = function (changes, onSuccess, onFailure) {
                onSuccess();
            };
        }

        upgrade = function upgrade(new_widget) {
            widget = new_widget;
            build_endpoints.call(this);
            build_prefs.call(this, this.preferences);
            this.trigger('upgraded', new_widget);
        };

        get_meta = function get_meta() {return widget;};
        set_meta = function set_meta(new_widget) {
            if (!(new_widget instanceof Wirecloud.WidgetMeta)) {
                throw new TypeError();
            }

            if (widget.uri !== new_widget.uri) {
                options.persist.call(this,
                    {widget: new_widget.id},
                    upgrade.bind(this, new_widget),
                    function (error) {
                        this.events.upgradeerror.dispatch(error);
                    }.bind(this)
                );
            } else {
                upgrade.call(this, new_widget);
            }
        };

        Object.defineProperties(this, {
            'widget': {
                get: get_meta,
                set: set_meta
            },
            'meta': {
                get: get_meta,
                set: set_meta
            },
            'missing': {get: function () {return this.meta.missing;}},
            'codeurl': {get: function () {return this.meta.codeurl + "#id=" + this.id;}},
            'tab': {value: tab},
            'volatile': {value: options.volatile ? true : false},
            'workspace': {get: function () {return tab.workspace;}}
        });
        this.id = options.id;
        this.loaded = false;
        this.title = options.title;
        this.pending_events = [];

        this.permissions = Wirecloud.Utils.merge({
            'close': true,
            'configure': true,
            'move': true,
            'rename': true,
            'resize': true,
            'upgrade': true
        }, options.permissions);

        if (options.readonly) {
            this.permissions.close = false;
            this.permissions.move = false;
            this.permissions.resize = false;
            this.permissions.upgrade = false;
        }

        build_endpoints.call(this);
        build_prefs.call(this, options.preferences);

        properties = this.meta.propertyList;
        this.propertyList = [];
        this.properties = {};
        this.propertyCommiter = new Wirecloud.PropertyCommiter(this);
        for (i = 0; i < properties.length; i++) {
            iwidget_prop_info = options.properties[properties[i].name];
            if (iwidget_prop_info != null) {
                this.propertyList[i] = new Wirecloud.PersistentVariable(properties[i], this.propertyCommiter, iwidget_prop_info.readonly, iwidget_prop_info.value);
            } else {
                this.propertyList[i] = new Wirecloud.PersistentVariable(properties[i], this.propertyCommiter, false, properties[i].default);
            }
            this.properties[properties[i].name] = this.propertyList[i];
        }

        this.callbacks = {
            'iwidget': [],
            'mashup': [],
            'platform': []
        };
        this.contextManager = new Wirecloud.ContextManager(this, {
            'title': {
                label: utils.gettext("Title"),
                description: utils.gettext("Widget's title"),
                value: options.title
            },
            'xPosition': {
                label: utils.gettext("X-Position"),
                description: utils.gettext("Specifies the x-coordinate at which the widget is placed"),
                value: 0
            },
            'yPosition': {
                label: utils.gettext("Y-Position"),
                description: utils.gettext("Specifies the y-coordinate at which the widget is placed"),
                value: 0
            },
            'height': {
                label: utils.gettext("Height"),
                description: utils.gettext("Widget's height in layout cells"),
                value: 0
            },
            'width': {
                label: utils.gettext("Width"),
                description: utils.gettext("Widget's width in layout cells"),
                value: 0
            },
            'heightInPixels': {
                label: utils.gettext("Height in pixels"),
                description: utils.gettext("Widget's height in pixels"),
                value: 0
            },
            'widthInPixels': {
                label: utils.gettext("Width in pixels"),
                description: utils.gettext("Widget's width in pixels"),
                value: 0
            }
        });
        Object.defineProperty(this, 'logManager', {value: new Wirecloud.Widget.LogManager(this)});
        this.prefCallback = null;

        StyledElements.ObjectWithEvents.call(this, ['load', 'unload', 'removed', 'title_changed', 'upgraded', 'upgradeerror']);
    };
    WidgetBase.prototype = new StyledElements.ObjectWithEvents();

    WidgetBase.prototype.isAllowed = function isAllowed(action) {
        if (action in this.permissions) {
            return this.permissions[action];
        } else {
            return false;
        }
    };

    WidgetBase.prototype.is = function is(component) {
        return this.meta.type == component.meta.type && this.id == component.id;
    };

    WidgetBase.prototype.registerPrefCallback = function registerPrefCallback(prefCallback) {
        this.prefCallback = prefCallback;
    };

    WidgetBase.prototype.registerContextAPICallback = function registerContextAPICallback(scope, callback) {
        switch (scope) {
        case 'iwidget':
            this.contextManager.addCallback(callback);
            break;
        case 'mashup':
            this.workspace.contextManager.addCallback(callback);
            break;
        case 'platform':
            Wirecloud.contextManager.addCallback(callback);
            break;
        default:
            throw new TypeError('invalid scope');
        }

        this.callbacks[scope].push(callback);
    };

    /**
     * This function is called when the content of the iwidget has been loaded completly.
     *
     * @private
     */
    WidgetBase.prototype._notifyLoaded = function _notifyLoaded(element) {

        if (this.loaded || !element.hasAttribute('src')) {
            return;
        }

        if (this.meta.missing) {
            this.logManager.log(utils.gettext('Missing widget: This widget is currently not available. Probably you or an administrator uninstalled it.'), {details: new se.Fragment("<h5>Suggestions:</h5><ul><li>Remove this widget from the dashboard</li><li>Reinstall the appropiated version of the widget</li><li>Install another version of the widget and use the <em>Upgrade/Downgrade</em> option</li></ul>")});
        } else {
            this.logManager.log(utils.gettext('Widget loaded successfully'), Wirecloud.constants.LOGGING.INFO_MSG);
        }

        this.loaded = true;

        element.contentDocument.defaultView.addEventListener('unload',
            this._notifyUnloaded.bind(this),
            true);

        element.contentDocument.defaultView.addEventListener('keydown', function (event) {
            if (event.keyCode === 27 /* escape */) {
                Wirecloud.UserInterfaceManager.handleEscapeEvent();
            }
        }, true);

        element.contentDocument.defaultView.addEventListener('click', function () {
            Wirecloud.UserInterfaceManager.handleEscapeEvent();
            Wirecloud.activeWorkspace.getIWidget(this.id).internal_view.unhighlight();
        }.bind(this), true);

        /* Propagate pending events */
        for (var i = 0; i < this.pending_events.length; i += 1) {
            this.inputs[this.pending_events[i].endpoint].propagate(this.pending_events[i].value);
        }
        this.pending_events = [];

        this.events.load.dispatch(this);
    };

    WidgetBase.prototype._notifyUnloaded = function _notifyUnloaded() {
        var i;

        if (!this.loaded) {
            return;
        }

        this.logManager.log(utils.gettext('Widget unloaded'), Wirecloud.constants.LOGGING.INFO_MSG);
        this.logManager.newCycle();

        // Remove context callbacks
        for (i = 0; i < this.callbacks.iwidget.length; i += 1) {
            this.contextManager.removeCallback(this.callbacks.iwidget[i]);
        }

        for (i = 0; i < this.callbacks.mashup.length; i += 1) {
            this.workspace.contextManager.removeCallback(this.callbacks.mashup[i]);
        }

        for (i = 0; i < this.callbacks.platform.length; i += 1) {
            Wirecloud.contextManager.removeCallback(this.callbacks.platform[i]);
        }

        this.callbacks = {
            'iwidget': [],
            'mashup': [],
            'platform': []
        };

        // Commit any property change
        this.propertyCommiter.commit();

        // Remove preferences callback
        this.prefCallback = null;

        this.loaded = false;
        this.events.unload.dispatch(this);
    };

    WidgetBase.prototype.buildInterface = function buildInterface(template, view) {
        return new Wirecloud.ui.IWidgetView(this, template, view);
    };

    WidgetBase.prototype.fullDisconnect = function fullDisconnect() {
        var key, connectables;

        connectables = this.inputs;
        for (key in connectables) {
            connectables[key].fullDisconnect();
        }

        connectables = this.outputs;
        for (key in connectables) {
            connectables[key].fullDisconnect();
        }
    };

    WidgetBase.prototype.hasEndpoints = function hasEndpoints() {
        return this.meta.hasEndpoints();
    };

    WidgetBase.prototype.showLogs = function showLogs() {
        var dialog = new Wirecloud.ui.LogWindowMenu(this.logManager);
        dialog.htmlElement.classList.add("wc-component-logs-dialog");
        dialog.show();

        return this;
    };

    WidgetBase.prototype.showSettings = function showSettings() {
        var dialog = new Wirecloud.Widget.PreferencesWindowMenu();
        dialog.show(this);

        return this;
    };

    Wirecloud.WidgetBase = WidgetBase;

})(StyledElements, Wirecloud.Utils);
