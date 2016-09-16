/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    var MarketplaceView, onGetMarketsSuccess, onGetMarketsFailure, onGetMarketsComplete, auto_select_initial_market, notifyError, builder, ERROR_TEMPLATE;

    ERROR_TEMPLATE = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><div class="alert alert-error"><t:message/></div></s:styledgui>';

    builder = new StyledElements.GUIBuilder();

    notifyError = function notifyError(message, context) {
        var error_alert;

        message = builder.parse(builder.DEFAULT_OPENING + message + builder.DEFAULT_CLOSING, context);
        error_alert = builder.parse(ERROR_TEMPLATE, {
            'message': message
        });

        this.errorsAlternative.clear();
        this.errorsAlternative.appendChild(error_alert);
        this.alternatives.showAlternative(this.errorsAlternative);
    };

    auto_select_initial_market = function auto_select_initial_market() {
        var currentState = Wirecloud.HistoryManager.getCurrentState();
        if (currentState.market) {
            this.changeCurrentMarket(currentState.market, {history: "ignore"});
        } else if (this.viewList.length > 0) {
            this.changeCurrentMarket(this.viewList[0].key, {history: "replace"});
        } else {
            var msg = utils.gettext("<p>WireCloud is not connected with any marketplace.</p><p>Suggestions:</p><ul><li>Connect WireCloud with a new marketplace.</li><li>Go to the my resources view instead</li></ul>");
            notifyError.call(this, msg);
        }
    };

    onGetMarketsSuccess = function onGetMarketsSuccess(options, response) {
        var market_key, old_views, view_element, view_constructor, i, p;

        this.loading = false;

        old_views = this.viewsByName;
        this.viewsByName = {};
        this.viewList = [];

        for (i = 0; i < response.length; i++) {

            view_element = response[i];
            if (view_element.user != null) {
                market_key = view_element.user + '/' + view_element.name;
            } else {
                market_key = view_element.name;
            }

            if (market_key in old_views) {
                this.viewsByName[market_key] = old_views[market_key];
                delete old_views[market_key];
            } else {
                view_constructor = Wirecloud.MarketManager.getMarketViewClass(view_element.type);
                this.viewsByName[market_key] = this.alternatives.createAlternative({alternative_constructor: view_constructor, containerOptions: {catalogue: this, marketplace_desc: view_element}});
                this.viewsByName[market_key].key = market_key;
            }
            this.viewList.push(this.viewsByName[market_key]);

            this.number_of_alternatives += 1;
        }

        p = Promise.resolve();
        for (market_key in old_views) {
            p = p.then(remove_market.bind(this, old_views[market_key]));
        }

        p = p.then(function () {
            return new Promise(function (resolve, reject) {
                for (market_key in old_views) {
                    old_views[market_key].destroy();
                }

                if (this.isVisible()) {
                    if (this.temporalAlternatives.indexOf(this.alternatives.getCurrentAlternative()) !== -1) {
                        auto_select_initial_market.call(this);
                    } else {
                        // Refresh wirecloud header as current marketplace may have been changed
                        Wirecloud.trigger('viewcontextchanged');
                    }
                }
                utils.callCallback(options.onSuccess);
                resolve();
            }.bind(this));
        }.bind(this));

    };

    onGetMarketsFailure = function onGetMarketsFailure(options, msg) {
        this.loading = false;

        this.errorsAlternative.clear();
        notifyError.call(this, msg);

        if (typeof options.onFailure === 'function') {
            options.onFailure();
        }
    };

    onGetMarketsComplete = function onGetMarketsComplete(options) {
        var i;

        for (i = 0; i < this.callbacks.length; i += 1) {
            try {
                this.callbacks[i]();
            } catch (e) {}
        }
        this.callbacks = [];

        if (typeof options.onComplete === 'function') {
            options.onComplete();
        }
    };

    MarketplaceView = function MarketplaceView(id, options) {
        options.id = 'marketplace';
        StyledElements.Alternative.call(this, id, options);

        this.viewsByName = {};
        this.alternatives = new StyledElements.Alternatives();
        this.emptyAlternative = this.alternatives.createAlternative();
        this.errorsAlternative = this.alternatives.createAlternative({containerOptions: {'class': 'marketplace-error-view'}});
        this.temporalAlternatives = [this.emptyAlternative, this.errorsAlternative];

        this.alternatives.addEventListener('postTransition', function (alternatives, out_alternative, in_alternative) {
            Wirecloud.trigger('viewcontextchanged', this);
        }.bind(this));
        this.appendChild(this.alternatives);

        this.marketMenu = new StyledElements.PopupMenu();
        this.marketMenu.append(new Wirecloud.ui.MarketplaceViewMenuItems(this));

        options.parentElement.addEventListener("postTransition", function (alts, outalt, inalt) {
            if (inalt === this && this.loading === null) {
                Wirecloud.MarketManager.getMarkets(onGetMarketsSuccess.bind(this, {}), onGetMarketsFailure.bind(this, {}), onGetMarketsComplete.bind(this, {}));
                this.loading = true;
            }
        }.bind(this));

        this.addEventListener('show', function (view) {

            if (view.loading === false && !view.error) {
                if (view.alternatives.getCurrentAlternative() === view.emptyAlternative) {
                    auto_select_initial_market.call(view);
                } else {
                    view.alternatives.getCurrentAlternative().refresh_if_needed();
                }
            }
        });

        Object.defineProperty(this, 'error', {
            get: function () {
                return this.alternatives.getCurrentAlternative() === this.errorsAlternative;
            }
        });

        this.myresourcesButton = new StyledElements.Button({
            iconClass: 'fa fa-archive',
            class: "wc-show-myresources-button",
            title: utils.gettext('My Resources')
        });
        this.myresourcesButton.addEventListener('click', function () {
            Wirecloud.UserInterfaceManager.changeCurrentView('myresources', {history: "push"});
        });

        this.number_of_alternatives = 0;
        this.loading = null;
        this.callbacks = [];
    };
    MarketplaceView.prototype = new StyledElements.Alternative();

    MarketplaceView.prototype.view_name = 'marketplace';

    MarketplaceView.prototype.buildStateData = function buildStateData() {
        var currentState, data, subview;

        currentState = Wirecloud.HistoryManager.getCurrentState();
        data = {
            workspace_owner: currentState.workspace_owner,
            workspace_name: currentState.workspace_name,
            view: 'marketplace'
        };

        if (this.loading === false && this.error === false && this.alternatives.getCurrentAlternative() !== this.emptyAlternative) {
            subview = this.alternatives.getCurrentAlternative().alternatives.getCurrentAlternative();
            if (subview.view_name != null) {
                data.subview = subview.view_name;
                if ('buildStateData' in subview) {
                    subview.buildStateData(data);
                }
            }
            data.market = this.alternatives.getCurrentAlternative().market_id;
        }

        return data;
    };

    MarketplaceView.prototype.onHistoryChange = function onHistoryChange(state) {
        this.changeCurrentMarket(state.market, {history: "ignore"});
        if ('onHistoryChange' in this.viewsByName[state.market]) {
            this.viewsByName[state.market].onHistoryChange(state);
        }
    };

    MarketplaceView.prototype.goUp = function goUp() {
        var current_alternative, change = false;

        current_alternative = this.alternatives.getCurrentAlternative();
        if (this.temporalAlternatives.indexOf(current_alternative) === -1) {
            change = this.alternatives.getCurrentAlternative().goUp();
        }

        if (!change) {
            Wirecloud.UserInterfaceManager.changeCurrentView('workspace');
        }
    };

    MarketplaceView.prototype.getBreadcrum = function getBreadcrum() {
        var breadcrum, current_alternative, subalternative;

        current_alternative = this.alternatives.getCurrentAlternative();
        if (current_alternative === this.emptyAlternative) {
            return [utils.gettext('loading marketplace view...')];
        } else if (current_alternative === this.errorsAlternative) {
            return [utils.gettext('marketplace list not available')];
        } else {
            breadcrum = ['marketplace'];
            if (current_alternative.desc.user) {
                breadcrum.push(current_alternative.desc.user);
            }

            breadcrum.push(current_alternative.getLabel());
            subalternative = current_alternative.alternatives.getCurrentAlternative();

            if (subalternative.view_name === 'details' && subalternative.currentEntry != null) {
                breadcrum.push({
                    label: subalternative.currentEntry.title,
                    'class': 'resource_title'
                });
            }
            return breadcrum;
        }
    };

    MarketplaceView.prototype.getTitle = function getTitle() {
        var current_alternative, subalternative, marketname, title;

        current_alternative = this.alternatives.getCurrentAlternative();
        if (current_alternative === this.emptyAlternative || current_alternative === this.errorsAlternative) {
            return utils.gettext('Marketplace');
        } else {
            if (current_alternative.desc.user) {
                marketname = current_alternative.desc.user + '/' + current_alternative.getLabel();
            } else {
                marketname = current_alternative.getLabel();
            }
            title = utils.interpolate(utils.gettext('Marketplace - %(marketname)s'), {marketname: marketname});
            subalternative = current_alternative.alternatives.getCurrentAlternative();
            if (subalternative.view_name === "details" && subalternative.currentEntry != null) {
                title += ' - ' + subalternative.currentEntry.title;
            }

            return title;
        }
    };

    MarketplaceView.prototype.getToolbarMenu = function getToolbarMenu() {
        return this.marketMenu;
    };

    MarketplaceView.prototype.getToolbarButtons = function getToolbarButtons() {
        return [this.myresourcesButton];
    };

    MarketplaceView.prototype.waitMarketListReady = function waitMarketListReady(options) {
        if (options == null || typeof options.onComplete !== 'function') {
            throw new TypeError('missing onComplete callback');
        }

        if (options.include_markets === true) {
            options.onComplete = function (onComplete) {
                var count = Object.keys(this.viewsByName).length;

                if (count === 0) {
                    try {
                        onComplete();
                    } catch (e) {}
                    return;
                }

                var listener = function () {
                    if (--count === 0) {
                        onComplete();
                    }
                };
                for (var key in this.viewsByName) {
                    this.viewsByName[key].wait_ready(listener);
                }
            }.bind(this, options.onComplete);
        }

        if (this.loading === false) {
            try {
                options.onComplete();
            } catch (e) {}
            return;
        }

        this.callbacks.push(options.onComplete);
        if (this.loading === null) {
            Wirecloud.MarketManager.getMarkets(onGetMarketsSuccess.bind(this, {}), onGetMarketsFailure.bind(this, {}), onGetMarketsComplete.bind(this, {}));
            this.loading = true;
        }
    };

    MarketplaceView.prototype.refreshViewInfo = function refreshViewInfo(options) {

        if (this.loading === true) {
            return;
        }

        if (typeof options !== 'object') {
            options = {};
        }

        this.loading = true;
        Wirecloud.trigger('viewcontextchanged');

        this.number_of_alternatives = 0;

        Wirecloud.MarketManager.getMarkets(onGetMarketsSuccess.bind(this, options), onGetMarketsFailure.bind(this, options), onGetMarketsComplete.bind(this, options));
    };

    MarketplaceView.prototype.addMarket = function addMarket(market_info) {
        var view_constructor = Wirecloud.MarketManager.getMarketViewClass(market_info.type);
        market_info.permissions = {'delete': true};
        this.viewsByName[market_info.name] = this.alternatives.createAlternative({alternative_constructor: view_constructor, containerOptions: {catalogue: this, marketplace_desc: market_info}});

        this.number_of_alternatives += 1;
        this.changeCurrentMarket(market_info.name);
    };

    MarketplaceView.prototype.changeCurrentMarket = function changeCurrentMarket(market, options) {
        options = utils.merge({
            history: "push",
        }, options);

        this.alternatives.showAlternative(this.viewsByName[market], {
            onComplete: function () {
                var new_status = this.buildStateData();
                if (options.history === "push") {
                    Wirecloud.HistoryManager.pushState(new_status);
                } else if (options.history === "replace") {
                    Wirecloud.HistoryManager.replaceState(new_status);
                }
            }.bind(this)
        });
    };

    var remove_market = function remove_market(market_view) {
        return new Promise(function (alt, resolve) {
            this.alternatives.removeAlternative(alt, {onComplete: resolve});
        }.bind(this, market_view));
    };

    Wirecloud.ui.MarketplaceView = MarketplaceView;

})(Wirecloud.Utils);
