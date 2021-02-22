/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2021 Future Internet Consulting and Development Solutions S.L.
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

    const push_nav_history = function push_nav_history() {
        const new_status = this.mainview.buildStateData();
        Wirecloud.HistoryManager.pushState(new_status);
    };

    const replace_nav_history = function replace_nav_history() {
        const new_status = this.mainview.buildStateData();
        Wirecloud.HistoryManager.replaceState(new_status);
    };

    ns.CatalogueView = class CatalogueView extends se.Alternative {

        constructor(id, options) {
            options.class = 'catalogue';
            super(id, options);

            Object.defineProperty(this, 'desc', {value: options.marketplace_desc});
            this.market_id = this.desc.user + '/' + this.desc.name;
            this.mainview = options.catalogue;
            this.catalogue = new Wirecloud.WirecloudCatalogue(options.marketplace_desc);
            this.alternatives = new se.Alternatives();
            this.appendChild(this.alternatives);

            const resource_extra_context = {
                'mainbutton': (options, context, resource) => {
                    var button, local_catalogue_view;

                    local_catalogue_view = Wirecloud.UserInterfaceManager.views.myresources;
                    if (Wirecloud.LocalCatalogue.resourceExists(resource)) {
                        button = new se.Button({
                            'class': 'btn-danger',
                            'text': utils.gettext('Uninstall')
                        });
                        button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', resource, this));
                    } else {
                        button = new se.Button({
                            'class': 'btn-success',
                            'text': utils.gettext('Install')
                        });

                        button.addEventListener('click', local_catalogue_view.createUserCommand('install', resource, this));
                    }
                    button.addClassName('mainbutton');
                    return button;
                }
            };

            this.viewsByName = {
                'search': this.alternatives.createAlternative({alternative_constructor: ns.CatalogueSearchView, containerOptions: {catalogue: this, resource_painter: Wirecloud.ui.ResourcePainter, resource_extra_context: resource_extra_context}}),
                'details': this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.WirecloudCatalogue.ResourceDetailsView, containerOptions: {catalogue: this}})
            };
            this.viewsByName.search.init();

            this.alternatives.addEventListener('postTransition', function (alternatives, out_alternative) {
                Wirecloud.dispatchEvent('viewcontextchanged');
            }.bind(this));

            this.addEventListener('show', this.refresh_if_needed.bind(this));
        }

        getLabel() {
            return this.catalogue.title;
        }

        isAllow(action) {
            return this .catalogue.isAllow(action);
        }

        _onShow() {
        }

        onHistoryChange(state) {
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
        }

        goUp() {
            if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
                return false;
            }
            this.changeCurrentView('search', {onComplete: push_nav_history.bind(this)});
            return true;
        }

        wait_ready(onComplete) {
            if (typeof onComplete !== 'function') {
                throw new TypeError('missing onComplete callback');
            }
            utils.callCallback(onComplete);
        }

        search(onSuccess, onError, options) {
            return this.catalogue.search(onSuccess, onError, options);
        }

        getPublishEndpoints() {
            return null;
        }

        changeCurrentView(view_name, options) {
            if (!(view_name in this.viewsByName)) {
                throw new TypeError();
            }

            options = options != null ? options : {};

            this.alternatives.showAlternative(this.viewsByName[view_name], {
                onComplete: options.onComplete
            });
        }

        home() {
            this.changeCurrentView('search', {onComplete: push_nav_history.bind(this)});
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

    ns.CatalogueView.prototype.ui_commands = {};

    ns.CatalogueView.prototype.ui_commands.showDetails = function showDetails(resource, options) {
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
                this.catalogue.getResourceDetails(resource.vendor, resource.name).then(
                    (resource) => {
                        onSuccess.call(this, resource);
                        onComplete.call(this);
                    },
                    onComplete.bind(this)
                );
            }
        }.bind(this);
    };

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
