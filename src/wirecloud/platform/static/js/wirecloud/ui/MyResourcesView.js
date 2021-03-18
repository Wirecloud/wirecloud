/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals Wirecloud, StyledElements */


(function (ns, se, utils) {

    "use strict";

    const keydown_listener = function keydown_listener(key, modifiers) {
        const subview = this.alternatives.getCurrentAlternative();
        if (typeof subview.handleKeydownEvent === "function") {
            return subview.handleKeydownEvent(key, modifiers);
        }
    };

    const logerror = function logerror(msg) {
        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
        Wirecloud.GlobalLogManager.log(msg);
    };

    ns.MyResourcesView = class MyResourcesView extends se.Alternative {

        constructor(id, options) {
            let resource_extra_context;

            options.class = 'catalogue myresources';
            super(id, options);

            this.catalogue = Wirecloud.LocalCatalogue;
            this.alternatives = new StyledElements.Alternatives();
            this.appendChild(this.alternatives);

            const search_options = {
                catalogue: this,
                resource_painter: Wirecloud.ui.ResourcePainter,
                resource_extra_context: resource_extra_context,
                emptyTitle: utils.gettext('Empty resource list'),
                emptyMessage: utils.gettext('Currently, you do not have access to any component. You can get components using the Marketplace view or by uploading components manually using the Upload button.')
            };
            this.viewsByName = {
                'search': this.alternatives.createAlternative({alternative_constructor: ns.CatalogueSearchView, containerOptions: search_options}),
                'details': this.alternatives.createAlternative({alternative_constructor: ns.WirecloudCatalogue.ResourceDetailsView, containerOptions: {catalogue: this}})
            };
            this.viewsByName.search.init();

            this.uploadButton = new StyledElements.Button({
                class: "wc-upload-mac-button",
                iconClass: 'fas fa-cloud-upload-alt',
                title: utils.gettext('Upload')
            });
            const upload_dialog = new Wirecloud.ui.WirecloudCatalogue.UploadWindowMenu({catalogue: this.catalogue, mainview: this});
            this.uploadButton.addEventListener('click', function () {
                upload_dialog.show();
            });

            this.marketButton = new StyledElements.Button({
                iconClass: 'fas fa-shopping-cart',
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
        }

        buildStateData() {
            const currentState = Wirecloud.HistoryManager.getCurrentState();
            const data = {
                workspace_owner: currentState.workspace_owner,
                workspace_name: currentState.workspace_name,
                view: 'myresources',
                subview: 'search'
            };

            const subview = this.alternatives.getCurrentAlternative();
            if (subview.view_name != null) {
                data.subview = subview.view_name;
                if ('buildStateData' in subview) {
                    subview.buildStateData(data);
                }
            }

            return data;
        }

        onHistoryChange(state) {
            let details, parts, currentResource;

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
        }

        goUp() {
            if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
                Wirecloud.UserInterfaceManager.changeCurrentView('workspace');
            }
            this.changeCurrentView('search');
        }

        getBreadcrumb() {
            const breadcrum = [utils.gettext('My Resources')];

            if (this.alternatives.getCurrentAlternative() === this.viewsByName.details && this.viewsByName.details.currentEntry != null) {
                breadcrum.push(this.viewsByName.details.currentEntry.title);
            }

            return breadcrum;
        }

        getTitle() {
            let currentResource;

            if (this.alternatives.getCurrentAlternative() === this.viewsByName.details) {
                currentResource = this.viewsByName.details.currentEntry;
                if (currentResource != null) {
                    return utils.interpolate(utils.gettext('My Resources - %(resource)s'), {resource: currentResource.uri});
                }
            }
            return utils.gettext('My Resources');
        }

        getToolbarButtons() {
            return [this.uploadButton, this.marketButton];
        }

        search(options) {
            return this.catalogue.search(options);
        }

        changeCurrentView(view_name, options) {
            if (!(view_name in this.viewsByName)) {
                throw new TypeError();
            }

            if (options == null) {
                options = {
                    onComplete: function (alternatives, out_alternative) {
                        this.refresh_if_needed();
                        const new_status = this.buildStateData();
                        Wirecloud.HistoryManager.pushState(new_status);
                        Wirecloud.dispatchEvent('viewcontextchanged');
                    }.bind(this)
                };
            }

            this.alternatives.showAlternative(this.viewsByName[view_name], options);
        }

        home() {
            this.changeCurrentView('search');
        }

        createUserCommand(command) {
            return this.ui_commands[command].apply(this, Array.prototype.slice.call(arguments, 1));
        }

        refresh_if_needed() {
            if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
                this.viewsByName.search.refresh_if_needed();
            }
        }

        refresh_search_results() {
            this.viewsByName.search.source.refresh();
        }

    }

    ns.MyResourcesView.prototype.view_name = 'myresources';
    ns.MyResourcesView.prototype.ui_commands = {};
    ns.MyResourcesView.prototype.ui_commands.install = function install(resource, catalogue_source) {
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

    ns.MyResourcesView.prototype.ui_commands.uninstall = function uninstall(resource, catalogue_source) {
        return function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.deleteResource(resource).then(
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

    ns.MyResourcesView.prototype.ui_commands.uninstallall = function uninstallall(resource, catalogue_source) {
        return function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.deleteResource(resource, {
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

    ns.MyResourcesView.prototype.ui_commands.publishOtherMarket = function publishOtherMarket(resource) {
        return function () {
            const marketplaceview = Wirecloud.UserInterfaceManager.views.marketplace;
            marketplaceview.waitMarketListReady({
                include_markets: true,
                onComplete: function () {
                    let dialog, msg, key;
                    const views = Wirecloud.UserInterfaceManager.views.marketplace.viewsByName;

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

    ns.MyResourcesView.prototype.ui_commands.showDetails = function showDetails(resource, options) {
        options = utils.merge({
            history: "push"
        }, options);

        return function (e) {
            const onSuccess = function onSuccess(resource_details) {
                if (options.version != null) {
                    resource_details.changeVersion(options.version);
                }
                this.viewsByName.details.paint(resource_details, {
                    tab: options.tab
                });
            };
            let viewChanged = false, dataLoaded = false;
            const onComplete = function onComplete() {
                const new_status = this.buildStateData();
                if (options.history === "push") {
                    Wirecloud.HistoryManager.pushState(new_status);
                } else {
                    Wirecloud.HistoryManager.replaceState(new_status);
                }
                utils.callCallback(options.onComplete);
            };
            const onCompleteRequest = function onCompleteRequest() {
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
                this.catalogue.getResourceDetails(resource.vendor, resource.name).then(
                    (resource) => {
                        onSuccess.call(this, resource);
                        onCompleteRequest.call(this);
                    },
                    onCompleteRequest.bind(this)
                );
            }
        }.bind(this);
    };

    ns.MyResourcesView.prototype.ui_commands.delete = function (resource) {
        const doRequest = function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.deleteResource(resource, {allusers: true}).then(
                    () => {
                        this.home();
                        this.refresh_search_results();
                    },
                    logerror
                )
            );
        };

        // First ask the user
        let msg = utils.gettext('Do you really want to remove the "%(name)s" (vendor: "%(vendor)s", version: "%(version)s") resource?');
        msg = utils.interpolate(msg, resource, true);
        return function () {
            const dialog = new Wirecloud.ui.AlertWindowMenu(msg);
            dialog.setHandler(doRequest.bind(this)).show();
        }.bind(this);
    };

    ns.MyResourcesView.prototype.ui_commands.deleteall = function deleteall(resource) {
        const success_callback = function (response) {
            this.home();
            this.refresh_search_results();
        }.bind(this);

        const doRequest = function () {
            Wirecloud.UserInterfaceManager.monitorTask(
                this.catalogue.deleteResource(resource, {allusers: true, allversions: true}).then(
                    success_callback,
                    logerror
                )
            );
        };

        // First ask the user
        let msg = utils.gettext('Do you really want to remove all versions of the (vendor: "%(vendor)s", name: "%(name)s") resource?');
        const context = {
            vendor: resource.vendor,
            name: resource.name
        };

        msg = utils.interpolate(msg, context, true);
        return function () {
            const dialog = new Wirecloud.ui.AlertWindowMenu(msg);
            dialog.setHandler(doRequest.bind(this)).show();
        }.bind(this);
    };

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
