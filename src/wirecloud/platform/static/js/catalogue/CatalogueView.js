/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals CatalogueSearchView, Wirecloud, StyledElements */


(function (utils) {

    "use strict";

    var CatalogueView = function CatalogueView(id, options) {
        var resource_extra_context;

        options.class = 'catalogue';
        StyledElements.Alternative.call(this, id, options);

        Object.defineProperty(this, 'desc', {value: options.marketplace_desc});
        this.market_id = this.desc.user + '/' + this.desc.name;
        this.mainview = options.catalogue;
        this.catalogue = new Wirecloud.WirecloudCatalogue(options.marketplace_desc);
        this.alternatives = new StyledElements.Alternatives();
        this.appendChild(this.alternatives);

        resource_extra_context = {
            'mainbutton': function (options, context, resource) {
                var button, local_catalogue_view;

                local_catalogue_view = Wirecloud.UserInterfaceManager.views.myresources;
                if (Wirecloud.LocalCatalogue.resourceExists(resource)) {
                    button = new StyledElements.Button({
                        'class': 'btn-danger',
                        'text': utils.gettext('Uninstall')
                    });
                    button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', resource, this.catalogue));
                } else {
                    button = new StyledElements.Button({
                        'class': 'btn-success',
                        'text': utils.gettext('Install')
                    });

                    button.addEventListener('click', local_catalogue_view.createUserCommand('install', resource, this.catalogue));
                }
                button.addClassName('mainbutton');
                return button;
            }.bind(this)
        };

        this.viewsByName = {
            'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: {catalogue: this, resource_painter: Wirecloud.ui.ResourcePainter, resource_extra_context: resource_extra_context}}),
            'details': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.WirecloudCatalogue.ResourceDetailsView, containerOptions: {catalogue: this}})
        };
        this.viewsByName.search.init();

        this.alternatives.addEventListener('postTransition', function (alternatives, out_alternative) {
            Wirecloud.dispatchEvent('viewcontextchanged');
        }.bind(this));

        this.addEventListener('show', this.refresh_if_needed.bind(this));
    };
    CatalogueView.prototype = new StyledElements.Alternative();

    CatalogueView.prototype.getLabel = function getLabel() {
        return this.catalogue.title;
    };

    CatalogueView.prototype.isAllow = function isAllow(action) {
        return this .catalogue.isAllow(action);
    };

    CatalogueView.prototype._onShow = function _onShow() {
    };

    CatalogueView.prototype.onHistoryChange = function onHistoryChange(state) {
        var details, parts, currentResource;

        if (state.subview === 'search') {
            this.changeCurrentView(state.subview);
        } else {
            parts = state.resource.split('/');
            details = {
                vendor: parts[0],
                name: parts[1],
                version: parts[2]
            };

            currentResource = this.viewsByName.details.currentEntry;
            if (currentResource != null && currentResource.vendor === details.vendor && currentResource.name === details.name) {
                details = currentResource.changeVersion(details.version);
            }
            this.createUserCommand('showDetails', details, {history: "ignore"})();
        }
    };

    CatalogueView.prototype.goUp = function goUp() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            return false;
        }
        this.changeCurrentView('search', {onComplete: push_nav_history.bind(this)});
        return true;
    };

    CatalogueView.prototype.wait_ready = function wait_ready(onComplete) {
        if (typeof onComplete !== 'function') {
            throw new TypeError('missing onComplete callback');
        }
        utils.callCallback(onComplete);
    };

    CatalogueView.prototype.search = function search(onSuccess, onError, options) {
        return this.catalogue.search(onSuccess, onError, options);
    };

    CatalogueView.prototype.getPublishEndpoints = function getPublishEndpoints() {
        return null;
    };

    CatalogueView.prototype.changeCurrentView = function changeCurrentView(view_name, options) {
        if (!(view_name in this.viewsByName)) {
            throw new TypeError();
        }

        options = options != null ? options : {};

        this.alternatives.showAlternative(this.viewsByName[view_name], {
            onComplete: options.onComplete
        });
    };

    CatalogueView.prototype.home = function home() {
        this.changeCurrentView('search', {onComplete: push_nav_history.bind(this)});
    };

    CatalogueView.prototype.createUserCommand = function createUserCommand(command) {
        return this.ui_commands[command].apply(this, Array.prototype.slice.call(arguments, 1));
    };

    CatalogueView.prototype.ui_commands = {};

    CatalogueView.prototype.ui_commands.install = function install(resource, catalogue_source) {
        return function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.addComponent({url: resource.description_url}).then(
                    () => {
                        this.refresh_search_results();

                        catalogue_source.home();
                        catalogue_source.refresh_search_results();
                    },
                    logerror
                )
            );
        }.bind(this);
    };

    CatalogueView.prototype.ui_commands.showDetails = function showDetails(resource, options) {
        options = utils.merge({
            history: "push"
        }, options);

        return function () {
            var onSuccess = function (resource_details) {
                this.viewsByName.details.paint(resource_details);
                this.viewsByName.details.repaint();
            };
            var onComplete = function onSuccess() {
                this.viewsByName.details.enable();
                if (options.history === "push") {
                    push_nav_history.call(this);
                } else if (options.history === "replace") {
                    replace_nav_history.call(this);
                }
                utils.callCallback(options.onComplete);
            };

            this.viewsByName.details.disable();
            this.alternatives.showAlternative(this.viewsByName.details);

            if (resource instanceof Wirecloud.WirecloudCatalogue.ResourceDetails) {
                onSuccess.call(this, resource);
                onComplete.call(this);
            } else {
                this.catalogue.getResourceDetails(resource.vendor, resource.name, {
                    onSuccess: onSuccess.bind(this),
                    onComplete: onComplete.bind(this)
                });
            }
        }.bind(this);
    };

    CatalogueView.prototype.ui_commands.delete = function (resource) {
        var doRequest, msg;

        doRequest = function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.deleteResource(resource).then(
                    () => {
                        this.home();
                        this.refresh_search_results();
                    },
                    logerror
                )
            );
        };

        // First ask the user
        msg = utils.gettext('Do you really want to remove the "%(name)s" (vendor: "%(vendor)s", version: "%(version)s") component?');
        msg = utils.interpolate(msg, resource, true);
        return function () {
            var dialog = new Wirecloud.ui.AlertWindowMenu();
            dialog.setMsg(msg);
            dialog.setHandler(doRequest.bind(this));
            dialog.show();
        }.bind(this);
    };

    CatalogueView.prototype.refresh_if_needed = function refresh_if_needed() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            this.viewsByName.search.refresh_if_needed();
        }
    };

    CatalogueView.prototype.refresh_search_results = function () {
        this.viewsByName.search.source.refresh();
    };

    var push_nav_history = function push_nav_history() {
        var new_status = this.mainview.buildStateData();
        Wirecloud.HistoryManager.pushState(new_status);
    };

    var replace_nav_history = function replace_nav_history() {
        var new_status = this.mainview.buildStateData();
        Wirecloud.HistoryManager.replaceState(new_status);
    };

    var logerror = function logerror(msg) {
        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
        Wirecloud.GlobalLogManager.log(msg);
    };

    window.CatalogueView = CatalogueView;

})(Wirecloud.Utils);
