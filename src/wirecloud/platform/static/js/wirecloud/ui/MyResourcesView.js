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

    var MyResourcesView = function MyResourcesView(id, options) {
        var resource_extra_context;

        options.class = 'catalogue myresources';
        StyledElements.Alternative.call(this, id, options);

        this.catalogue = Wirecloud.LocalCatalogue;
        this.alternatives = new StyledElements.Alternatives();
        this.appendChild(this.alternatives);

        var search_options = {
            catalogue: this,
            resource_painter: Wirecloud.ui.ResourcePainter,
            resource_extra_context: resource_extra_context,
            emptyTitle: utils.gettext('Empty resource list'),
            emptyMessage: utils.gettext('Currently, you do not have access to any component. You can get components using the Marketplace view or by uploading components manually using the Upload button.')
        };
        this.viewsByName = {
            'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: search_options}),
            'details': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.WirecloudCatalogue.ResourceDetailsView, containerOptions: {catalogue: this}})
        };
        this.viewsByName.search.init();

        this.uploadButton = new StyledElements.Button({
            class: "wc-upload-mac-button",
            iconClass: 'fa fa-cloud-upload',
            title: utils.gettext('Upload')
        });
        var upload_dialog = new Wirecloud.ui.WirecloudCatalogue.UploadWindowMenu({catalogue: this.catalogue, mainview: this});
        this.uploadButton.addEventListener('click', function () {
            upload_dialog.show();
        });

        this.marketButton = new StyledElements.Button({
            iconClass: 'fa fa-shopping-cart',
            class: "wc-show-marketplace-button",
            title: utils.gettext('Get more components')
        });
        this.marketButton.addEventListener('click', function () {
            Wirecloud.UserInterfaceManager.changeCurrentView('marketplace');
        });

        this.alternatives.addEventListener('preTransition', function (alternatives, old_alternative, new_alternative) {
            Wirecloud.UserInterfaceManager.header._notifyViewChange();
        });
        this.alternatives.addEventListener('postTransition', function (alternatives, old_alternative, new_alternative) {
            setTimeout(Wirecloud.dispatchEvent.bind(Wirecloud, 'viewcontextchanged'), 0);
        }.bind(this));

        this.addEventListener('show', function () {
            Wirecloud.UserInterfaceManager.rootKeydownHandler = keydown_listener.bind(this);
            this.refresh_if_needed();
        }.bind(this));
    };
    MyResourcesView.prototype = new StyledElements.Alternative();

    MyResourcesView.prototype.view_name = 'myresources';

    MyResourcesView.prototype.buildStateData = function buildStateData() {
        var currentState, data, subview;

        currentState = Wirecloud.HistoryManager.getCurrentState();
        data = {
            workspace_owner: currentState.workspace_owner,
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
            if (currentResource != null && currentResource.vendor === details.vendor && currentResource.name === details.name) {
                details = currentResource;
            }
            this.createUserCommand('showDetails', details, {history: "replace", tab: state.tab, version: parts[2]})();
        }
    };

    MyResourcesView.prototype.goUp = function goUp() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            Wirecloud.UserInterfaceManager.changeCurrentView('workspace');
        }
        this.changeCurrentView('search');
    };

    MyResourcesView.prototype.getBreadcrumb = function getBreadcrumb() {
        var breadcrum = [utils.gettext('My Resources')];

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
                return utils.interpolate(utils.gettext('My Resources - %(resource)s'), {resource: currentResource.uri});
            }
        }
        return utils.gettext('My Resources');
    };

    MyResourcesView.prototype.getToolbarButtons = function getToolbarButtons() {
        return [this.uploadButton, this.marketButton];
    };

    MyResourcesView.prototype.search = function search(options) {
        return this.catalogue.search(options);
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
                    Wirecloud.dispatchEvent('viewcontextchanged');
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

    MyResourcesView.prototype.ui_commands.uninstall = function uninstall(resource, catalogue_source) {
        return function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.uninstallResource(resource).then(
                    function () {
                        this.refresh_search_results();

                        if (catalogue_source != null) {
                            catalogue_source.home();
                            catalogue_source.refresh_search_results();
                        }
                    }.bind(this),
                    logerror
                )
            );
        }.bind(this);
    };

    MyResourcesView.prototype.ui_commands.uninstallall = function uninstallall(resource, catalogue_source) {
        return function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.uninstallResource(resource, {
                    allversions: true
                }).then(
                    function () {
                        this.refresh_search_results();

                        if (catalogue_source != null) {
                            catalogue_source.home();
                            catalogue_source.refresh_search_results();
                        }
                    }.bind(this),
                    logerror
                )
            );
        }.bind(this);
    };

    MyResourcesView.prototype.ui_commands.publishOtherMarket = function publishOtherMarket(resource) {
        return function () {
            var marketplaceview = Wirecloud.UserInterfaceManager.views.marketplace;
            marketplaceview.waitMarketListReady({
                include_markets: true,
                onComplete: function () {
                    var dialog, msg, key;
                    var views = Wirecloud.UserInterfaceManager.views.marketplace.viewsByName;

                    for (key in views) {
                        if (views[key].getPublishEndpoints() != null) {
                            dialog = new Wirecloud.ui.PublishResourceWindowMenu(resource);
                            break;
                        }
                    }
                    if (dialog == null) {
                        msg = utils.gettext("You have not configured any marketplace to upload this resource. Please, configure one on the Marketplace view.");
                        dialog = new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                    }
                    dialog.show();
                }
            });
        }.bind(this);
    };

    MyResourcesView.prototype.ui_commands.showDetails = function showDetails(resource, options) {
        options = utils.merge({
            history: "push"
        }, options);

        return function (e) {
            var onSuccess = function onSuccess(resource_details) {
                if (options.version != null) {
                    resource_details.changeVersion(options.version);
                }
                this.viewsByName.details.paint(resource_details, {
                    tab: options.tab
                });
            };
            var viewChanged = false, dataLoaded = false;
            var onComplete = function onComplete() {
                var new_status = this.buildStateData();
                if (options.history === "push") {
                    Wirecloud.HistoryManager.pushState(new_status);
                } else {
                    Wirecloud.HistoryManager.replaceState(new_status);
                }
                utils.callCallback(options.onComplete);
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
                    Wirecloud.UserInterfaceManager.changeCurrentView('myresources', {
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
        msg = utils.gettext('Do you really want to remove the "%(name)s" (vendor: "%(vendor)s", version: "%(version)s") resource?');
        msg = utils.interpolate(msg, resource, true);
        return function () {
            var dialog = new Wirecloud.ui.AlertWindowMenu();
            dialog.setMsg(msg);
            dialog.setHandler(doRequest.bind(this));
            dialog.show();
        }.bind(this);
    };

    MyResourcesView.prototype.ui_commands.deleteall = function deleteall(resource) {
        var success_callback, doRequest, msg, context;

        success_callback = function (response) {
            this.home();
            this.refresh_search_results();
        }.bind(this);

        doRequest = function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.deleteResource(resource, {allversions: true}).then(
                    success_callback,
                    logerror
                )
            );
        };

        // First ask the user
        msg = utils.gettext('Do you really want to remove all versions of the (vendor: "%(vendor)s", name: "%(name)s") resource?');
        context = {
            vendor: resource.vendor,
            name: resource.name
        };

        msg = utils.interpolate(msg, context, true);
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

    var keydown_listener = function keydown_listener(key, modifiers) {
        var subview = this.alternatives.getCurrentAlternative();
        if (typeof subview.handleKeydownEvent === "function") {
            return subview.handleKeydownEvent(key, modifiers);
        }
    };

    var logerror = function logerror(msg) {
        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
        Wirecloud.GlobalLogManager.log(msg);
    };

    Wirecloud.ui.MyResourcesView = MyResourcesView;

})(Wirecloud.Utils);
