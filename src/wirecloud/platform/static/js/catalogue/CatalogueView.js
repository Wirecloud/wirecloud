/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global CatalogueSearchView, gettext, interpolate, LayoutManagerFactory, OpManagerFactory, Wirecloud, StyledElements*/

(function () {

    "use strict";

    var CatalogueView = function CatalogueView(id, options) {
        var resource_extra_context;

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

        if (this.catalogue !== Wirecloud.LocalCatalogue) {
            resource_extra_context = {
                'mainbutton': function (options, context, resource) {
                    var button, local_catalogue_view;

                    local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local;
                    if (Wirecloud.LocalCatalogue.resourceExists(resource)) {
                        button = new StyledElements.StyledButton({
                            'class': 'btn-danger',
                            'text': gettext('Uninstall')
                        });
                        button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', resource, this.catalogue));
                    } else {
                        button = new StyledElements.StyledButton({
                            'class': 'btn-success',
                            'text': gettext('Install')
                        });

                        button.addEventListener('click', local_catalogue_view.createUserCommand('install', resource, this.catalogue));
                    }
                    button.addClassName('mainbutton');
                    return button;
                }.bind(this)
            };
        }

        this.viewsByName = {
            'initial': this.alternatives.createAlternative(),
            'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: {catalogue: this, resource_painter: Wirecloud.ui.ResourcePainter, resource_extra_context: resource_extra_context}}),
            'developer': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.WirecloudCatalogue.PublishView, containerOptions: {catalogue: this.catalogue, mainview: this}}),
            'details': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.WirecloudCatalogue.ResourceDetailsView, containerOptions: {catalogue: this}})
        };
        this.viewsByName.search.init();

        this.alternatives.addEventListener('postTransition', function (alternatives, out_alternative) {
            var new_status = options.catalogue.buildStateData();

            if (out_alternative === this.viewsByName.initial) {
                Wirecloud.HistoryManager.replaceState(new_status);
            } else {
                Wirecloud.HistoryManager.pushState(new_status);
            }
        }.bind(this));

        this.addEventListener('show', function () {
            if (this.alternatives.getCurrentAlternative() === this.viewsByName.initial) {
                this.changeCurrentView('search');
            }
            this.refresh_if_needed();
        }.bind(this));
    };
    CatalogueView.prototype = new StyledElements.Alternative();

    CatalogueView.prototype.getLabel = function getLabel() {
        return this.catalogue.name;
    };

    CatalogueView.prototype._onShow = function _onShow() {
    };

    CatalogueView.prototype.onHistoryChange = function onHistoryChange(state) {
        this.changeCurrentView(state.subview);
    };

    CatalogueView.prototype.goUp = function goUp() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            return false;
        }
        this.changeCurrentView('search');
        return true;
    };

    CatalogueView.prototype.search = function search(onSuccess, onError, options) {
        return this.catalogue.search(onSuccess, onError, options);
    };

    CatalogueView.prototype.getPublishEndpoints = function getPublishEndpoints() {
        return null;
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

    CatalogueView.prototype.ui_commands.install = function install(resource, catalogue_source) {
        return function () {
            var layoutManager;

            layoutManager = LayoutManagerFactory.getInstance();
            layoutManager._startComplexTask(gettext("Importing resource into local repository"), 3);
            layoutManager.logSubTask(gettext('Uploading resource'));

            this.catalogue.addResourceFromURL(resource.description_url, {
                packaged: resource.packaged,
                onSuccess: function () {
                    LayoutManagerFactory.getInstance().logSubTask(gettext('Resource installed successfully'));
                    LayoutManagerFactory.getInstance().logStep('');

                    this.refresh_search_results();

                    catalogue_source.home();
                    catalogue_source.refresh_search_results();
                }.bind(this),
                onFailure: function (msg) {
                    (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                    Wirecloud.GlobalLogManager.log(msg);
                },
                onComplete: function () {
                    LayoutManagerFactory.getInstance()._notifyPlatformReady();
                }
            });
        }.bind(this);
    };

    CatalogueView.prototype.ui_commands.uninstall = function uninstall(resource, catalogue_source) {
        return function () {
            var layoutManager;

            layoutManager = LayoutManagerFactory.getInstance();
            layoutManager._startComplexTask(gettext("Uninstalling resource"), 3);
            layoutManager.logSubTask(gettext('Uninstalling resource'));

            this.catalogue.uninstallResource(resource, {
                onSuccess: function () {
                    LayoutManagerFactory.getInstance().logSubTask(gettext('Resource uninstalled successfully'));
                    LayoutManagerFactory.getInstance().logStep('');

                    this.refresh_search_results();

                    if (catalogue_source != null) {
                        catalogue_source.home();
                        catalogue_source.refresh_search_results();
                    }
                }.bind(this),
                onFailure: function (msg) {
                    (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                    Wirecloud.GlobalLogManager.log(msg);
                },
                onComplete: function () {
                    LayoutManagerFactory.getInstance()._notifyPlatformReady();
                }
            });
        }.bind(this);
    };

    CatalogueView.prototype.ui_commands.publishOtherMarket = function publishOtherMarket(resource) {
        return function () {
            (new Wirecloud.ui.PublishResourceWindowMenu(resource, this.getLabel())).show();
        }.bind(this);
    };

    CatalogueView.prototype.ui_commands.showDetails = function showDetails(resource) {
        return function (e) {
            var onSuccess = function (resource_details) {
                this.viewsByName.details.paint(resource_details);
                this.alternatives.showAlternative(this.viewsByName.details);
                this.viewsByName.details.repaint();
            };

            if (resource instanceof Wirecloud.WirecloudCatalogue.ResourceDetails) {
                onSuccess.call(this, resource);
            } else {
                this.catalogue.getResourceDetails(resource.vendor, resource.name, {
                    onSuccess: onSuccess.bind(this)
                });
            }
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
            LayoutManagerFactory.getInstance()._notifyPlatformReady();
            (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
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
            vendor: resource.vendor,
            name: resource.name,
            version: resource.version.text
        };

        msg = interpolate(msg, context, true);
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

    window.CatalogueView = CatalogueView;
})();
