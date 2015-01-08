/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global CatalogueSearchView, gettext, interpolate, LayoutManagerFactory, Wirecloud, StyledElements*/

(function () {

    "use strict";

    var MyResourcesView = function MyResourcesView(id, options) {
        var resource_extra_context;

        options.class = 'catalogue myresources';
        StyledElements.Alternative.call(this, id, options);

        this.catalogue = Wirecloud.LocalCatalogue;
        this.alternatives = new StyledElements.StyledAlternatives();
        this.appendChild(this.alternatives);

        this.viewsByName = {
            'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: {catalogue: this, resource_painter: Wirecloud.ui.ResourcePainter, resource_extra_context: resource_extra_context}}),
            'details': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.WirecloudCatalogue.ResourceDetailsView, containerOptions: {catalogue: this}}),
            'developer': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.WirecloudCatalogue.PublishView, containerOptions: {catalogue: this.catalogue, mainview: this}})
        };
        this.viewsByName.search.init();

        this.uploadButton = new StyledElements.StyledButton({
            'iconClass': 'icon-cloud-upload',
            'title': gettext('Upload')
        });
        this.uploadButton.addEventListener('click', function () {
            this.changeCurrentView('developer');
        }.bind(this));

        this.marketButton = new StyledElements.StyledButton({
            'iconClass': 'icon-shopping-cart',
            'title': gettext('Marketplace')
        });
        this.marketButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('marketplace');
        });

        this.alternatives.addEventListener('preTransition', function (alternatives, out_alternative) {
            LayoutManagerFactory.getInstance().header._notifyViewChange();
        });

        this.addEventListener('show', this.refresh_if_needed.bind(this));
    };
    MyResourcesView.prototype = new StyledElements.Alternative();

    MyResourcesView.prototype.view_name = 'myresources';

    MyResourcesView.prototype.buildStateData = function buildStateData() {
        var currentState, data, subview;

        currentState = Wirecloud.HistoryManager.getCurrentState();
        data = {
            workspace_creator: currentState.workspace_creator,
            workspace_name: currentState.workspace_name,
            view: 'myresources',
            subview: 'search'
        };

        subview = this.alternatives.getCurrentAlternative();
        if (subview.view_name != null) {
            data.subview = subview.view_name;
            if ('buildStateData' in subview) {
                subview.buildStateData(data);
            }
        }

        return data;
    };

    MyResourcesView.prototype.onHistoryChange = function onHistoryChange(state) {
        var details, parts, currentResource;

        if (state.subview === 'search') {
            this.changeCurrentView(state.subview, {});
        } else {
            parts = state.resource.split('/');
            details = {
                vendor: parts[0],
                name: parts[1]
            };

            currentResource = this.viewsByName.details.currentEntry;
            if (currentResource != null && currentResource.vendor == details.vendor && currentResource.name == details.name) {
                details = currentResource;
            }
            this.createUserCommand('showDetails', details, {tab: state.tab, version: parts[2]})();
        }
    };

    MyResourcesView.prototype.goUp = function goUp() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            LayoutManagerFactory.getInstance().changeCurrentView('workspace');
        }
        this.changeCurrentView('search');
    };

    MyResourcesView.prototype.getBreadcrum = function getBreadcrum() {
        var breadcrum = [gettext('My Resources')];

        if (this.alternatives.getCurrentAlternative() === this.viewsByName.details && this.viewsByName.details.currentEntry != null) {
            breadcrum.push(this.viewsByName.details.currentEntry.title);
        }

        return breadcrum;
    };

    MyResourcesView.prototype.getTitle = function getTitle() {
        var currentResource;

        if (this.alternatives.getCurrentAlternative() === this.viewsByName.details) {
            currentResource = this.viewsByName.details.currentEntry;
            if (currentResource != null) {
                return Wirecloud.Utils.interpolate(gettext('My Resources - %(resource)s'), {resource: currentResource.uri});
            }
        }
        return gettext('My Resources');
    };

    MyResourcesView.prototype.getToolbarButtons = function getToolbarButtons() {
        return [this.uploadButton, this.marketButton];
    };

    MyResourcesView.prototype.search = function search(onSuccess, onError, options) {
        return this.catalogue.search(onSuccess, onError, options);
    };

    MyResourcesView.prototype.changeCurrentView = function changeCurrentView(view_name, options) {
        if (!(view_name in this.viewsByName)) {
            throw new TypeError();
        }

        if (options == null) {
            options = {
                onComplete: function (alternatives, out_alternative) {
                    this.refresh_if_needed();
                    var new_status = this.buildStateData();
                    Wirecloud.HistoryManager.pushState(new_status);
                    LayoutManagerFactory.getInstance().header._notifyViewChange(this);
                }.bind(this)
            };
        }

        this.alternatives.showAlternative(this.viewsByName[view_name], options);
    };

    MyResourcesView.prototype.home = function home() {
        this.changeCurrentView('search');
    };

    MyResourcesView.prototype.createUserCommand = function createUserCommand(command) {
        return this.ui_commands[command].apply(this, Array.prototype.slice.call(arguments, 1));
    };

    MyResourcesView.prototype.ui_commands = {};

    MyResourcesView.prototype.ui_commands.install = function install(resource, catalogue_source) {
        return function () {
            var layoutManager;

            layoutManager = LayoutManagerFactory.getInstance();
            layoutManager._startComplexTask(gettext("Importing resource into local repository"), 3);
            layoutManager.logSubTask(gettext('Uploading resource'));

            this.catalogue.addResourceFromURL(resource.description_url, {
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

    MyResourcesView.prototype.ui_commands.uninstall = function uninstall(resource, catalogue_source) {
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

    MyResourcesView.prototype.ui_commands.uninstallall = function uninstallall(resource, catalogue_source) {
        return function () {
            var layoutManager;

            layoutManager = LayoutManagerFactory.getInstance();
            layoutManager._startComplexTask(gettext("Uninstalling resource"), 3);
            layoutManager.logSubTask(gettext('Uninstalling resource'));

            this.catalogue.uninstallResource(resource, {
                allversions: true,
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

    MyResourcesView.prototype.ui_commands.publishOtherMarket = function publishOtherMarket(resource) {
        return function () {
            var marketplaceview = LayoutManagerFactory.getInstance().viewsByName.marketplace;
            marketplaceview.waitMarketListReady({
                include_markets: true,
                onComplete: function () {
                    var dialog, msg;
                    if (marketplaceview.number_of_alternatives > 0) {
                        dialog = new Wirecloud.ui.PublishResourceWindowMenu(resource);
                    } else {
                        msg = gettext("You have not configured any marketplace to upload this resource. Please, configure one on the Marketplace view.");
                        dialog = new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                    }
                    dialog.show();
                }
            });
        }.bind(this);
    };

    MyResourcesView.prototype.ui_commands.showDetails = function showDetails(resource, options) {
        if (options == null) {
            options = {};
        }

        return function (e) {
            var onSuccess = function onSuccess(resource_details) {
                if (options.version != null) {
                    resource_details.changeVersion(options.version);
                }
                this.viewsByName.details.paint(resource_details, {
                        tab: options.tab
                    });
                this.viewsByName.details.repaint();
            };
            var viewChanged = false, dataLoaded = false;
            var onComplete = function onComplete() {
                if (options.preventDefault !== true) {
                    var new_status = this.buildStateData();
                    Wirecloud.HistoryManager.pushState(new_status);
                    LayoutManagerFactory.getInstance().header._notifyViewChange(this);
                }
                Wirecloud.Utils.callCallback(options.onComplete);
            };
            var onCompleteRequest = function onCompleteRequest() {
                this.viewsByName.details.enable();
                dataLoaded = true;
                if (viewChanged && dataLoaded) {
                    onComplete.call(this);
                }
            };

            this.viewsByName.details.disable();
            this.changeCurrentView('details', {
                onComplete: function () {
                    LayoutManagerFactory.getInstance().changeCurrentView('myresources', {
                        onComplete: function () {
                            viewChanged = true;
                            if (viewChanged && dataLoaded) {
                                onComplete.call(this);
                            }
                        }.bind(this)
                    });
                }.bind(this)
            });

            if (resource instanceof Wirecloud.WirecloudCatalogue.ResourceDetails) {
                onSuccess.call(this, resource);
                onCompleteRequest.call(this);
            } else {
                this.catalogue.getResourceDetails(resource.vendor, resource.name, {
                    onSuccess: onSuccess.bind(this),
                    onComplete: onCompleteRequest.bind(this)
                });
            }
        }.bind(this);
    };

    MyResourcesView.prototype.ui_commands.delete = function (resource) {
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
            layoutManager._startComplexTask(gettext("Deleting resource from catalogue"), 3);
            layoutManager.logSubTask(gettext('Requesting server'));

            this.catalogue.deleteResource(resource, {
                onSuccess: success_callback,
                onFailure: error_callback
            });
        };

        // First ask the user
        msg = gettext('Do you really want to remove the "%(name)s" (vendor: "%(vendor)s", version: "%(version)s") resource?');
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

    MyResourcesView.prototype.ui_commands.deleteall = function deleteall(resource) {
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
            layoutManager._startComplexTask(gettext("Deleting all versions of the resource from catalogue"), 3);
            layoutManager.logSubTask(gettext('Requesting server'));

            this.catalogue.deleteResource(resource, {
                allversions: true,
                onSuccess: success_callback,
                onFailure: error_callback
            });
        };

        // First ask the user
        msg = gettext('Do you really want to remove all versions of the (vendor: "%(vendor)s", name: "%(name)s") resource?');
        context = {
            vendor: resource.vendor,
            name: resource.name
        };

        msg = interpolate(msg, context, true);
        return function () {
            var dialog = new Wirecloud.ui.AlertWindowMenu();
            dialog.setMsg(msg);
            dialog.setHandler(doRequest.bind(this));
            dialog.show();
        }.bind(this);
    };

    MyResourcesView.prototype.refresh_if_needed = function refresh_if_needed() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            this.viewsByName.search.refresh_if_needed();
        }
    };

    MyResourcesView.prototype.refresh_search_results = function () {
        this.viewsByName.search.source.refresh();
    };

    Wirecloud.ui.MyResourcesView = MyResourcesView;
})();
