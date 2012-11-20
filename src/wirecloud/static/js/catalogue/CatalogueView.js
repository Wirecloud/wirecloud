/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*global CatalogueResource, CatalogueSearchView, Constants, Event, gettext, interpolate, LayoutManagerFactory, LogManagerFactory, Wirecloud, ShowcaseFactory, StyledElements*/

(function () {

    "use strict";

    var CatalogueView = function CatalogueView(id, options) {
        options.class = 'catalogue';
        StyledElements.Alternative.call(this, id, options);

        Object.defineProperty(this, 'desc', {value: options.marketplace_desc});
        if (this.desc.user != null) {
            this.market_id = this.desc.user + '/' + this.desc.name;
        } else {
            this.market_id = this.desc.name;
        }
        if (this.desc.name === 'local') {
            this.catalogue = Wirecloud.LocalCatalogue;
        } else {
            this.catalogue = new Wirecloud.WirecloudCatalogue(options.marketplace_desc);
        }
        this.alternatives = new StyledElements.StyledAlternatives();
        this.appendChild(this.alternatives);

        this.viewsByName = {
            'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: {catalogue: this, resource_painter: Wirecloud.ui.ResourcePainter}}),
            'developer': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.WirecloudCatalogue.PublishView, containerOptions: {catalogue: this.catalogue, mainview: this}}),
            'details': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.ResourceDetailsView, containerOptions: {catalogue: this}})
        };
        this.viewsByName.search.init();

        this.addEventListener('show', this.refresh_if_needed.bind(this));
    };
    CatalogueView.prototype = new StyledElements.Alternative();

    CatalogueView.prototype.getLabel = function getLabel() {
        return this.catalogue.name;
    };

    CatalogueView.prototype._onShow = function _onShow() {
    };

    CatalogueView.prototype.search = function search(onSuccess, onError, options) {
        return this.catalogue.search(onSuccess, onError, options);
    };

    CatalogueView.prototype.instantiate = function instantiate(resource) {
        if (resource.isMashup()) {
            // Ask if the user want to create a new workspace or merge it with the current one
            (new Wirecloud.ui.InstantiateMashupWindowMenu(resource)).show();
        } else {
            ShowcaseFactory.getInstance().addWidget(resource.getVendor(),
                resource.getName(),
                resource.getVersion().text,
                resource.getUriTemplate(),
                {packaged: resource.isPackaged()}
            );
        }
    };

    CatalogueView.prototype.getPublishEndpoint = function getPublishEndpoint() {
        return [{
            'name': this.market_id,
            'label': this.market_id,
            'type': 'boolean'
        }];
    };

    CatalogueView.prototype.getPublishData = function getPublishData(data) {
        return [{
            'market': this.market_id
        }];
    };

    CatalogueView.prototype.changeCurrentView = function changeCurrentView(view_name) {
        if (!(view_name in this.viewsByName)) {
            throw new TypeError();
        }

        this.alternatives.showAlternative(this.viewsByName[view_name]);
    };

    CatalogueView.prototype.home = function home() {
        this.changeCurrentView('search');
    };

    CatalogueView.prototype.show_upload_view = function show_upload_view() {
        this.changeCurrentView('developer');
    };

    CatalogueView.prototype.createUserCommand = function createUserCommand(command) {
        return this.ui_commands[command].apply(this, Array.prototype.slice.call(arguments, 1));
    };

    CatalogueView.prototype.ui_commands = {};

    CatalogueView.prototype.ui_commands.import = function _import(resource, catalogue_source) {
        return function () {
            var layoutManager;

            layoutManager = LayoutManagerFactory.getInstance();
            layoutManager._startComplexTask(gettext("Importing operator into local repository"), 3);
            layoutManager.logSubTask(gettext('Uploading operator'));

            this.catalogue.addResourceFromURL(resource.getUriTemplate(), {
                packaged: resource.isPackaged(),
                onSuccess: function () {
                    var local_repository;

                    LayoutManagerFactory.getInstance().logSubTask(gettext('Operator installed successfully'));
                    LayoutManagerFactory.getInstance().logStep('');

                    this.refresh_search_results();

                    catalogue_source.home();
                    catalogue_source.refresh_search_results();
                }.bind(this),
                onFailure: function (msg) {
                    LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                    LogManagerFactory.getInstance().log(msg);
                },
                onComplete: function () {
                    LayoutManagerFactory.getInstance()._notifyPlatformReady();
                }
            });
        }.bind(this);
    };

    CatalogueView.prototype.ui_commands.instantiate = function instantiate(resource) {
        return function () {
            this.instantiate(resource);
            LayoutManagerFactory.getInstance().changeCurrentView('workspace');
        }.bind(this);
    };

    CatalogueView.prototype.ui_commands.showDetails = function showDetails(resource) {
        return function (e) {
            Event.stop(e);
            this.viewsByName.details.paint(resource);
            this.alternatives.showAlternative(this.viewsByName.details);
        }.bind(this);
    };

    CatalogueView.prototype.ui_commands.delete = function (resource) {
        var success_callback, error_callback, doRequest, msg, context;

        success_callback = function (response) {
            LayoutManagerFactory.getInstance()._notifyPlatformReady();
            this.home();
            this.refresh_search_results();
        }.bind(this);

        error_callback = function (msg) {
            var logManager, layoutManager;

            layoutManager = LayoutManagerFactory.getInstance();

            layoutManager._notifyPlatformReady();
            layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
        };

        doRequest = function () {
            var layoutManager;

            layoutManager = LayoutManagerFactory.getInstance();
            layoutManager._startComplexTask(gettext("Deleting widget resource from catalogue"), 3);
            layoutManager.logSubTask(gettext('Requesting server'));

            this.catalogue.deleteResource(resource, success_callback, error_callback);
        };

        // First ask the user
        msg = gettext('Do you really want to remove the "%(name)s" (vendor: "%(vendor)s", version: "%(version)s") widget?');
        context = {
            name: resource.getName(),
            vendor: resource.getVendor(),
            version: resource.getVersion().text
        };

        msg = interpolate(msg, context, true);
        return function () {
            LayoutManagerFactory.getInstance().showYesNoDialog(msg, doRequest.bind(this));
        }.bind(this);
    };

    CatalogueView.prototype.refresh_if_needed = function refresh_if_needed() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            this.viewsByName.search.refresh_if_needed();
        }
    };

    CatalogueView.prototype.refresh_search_results = function () {
        this.viewsByName.search.pagination.refresh();
    };

    window.CatalogueView = CatalogueView;
})();
