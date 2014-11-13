/*
 *     Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, LayoutManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var buttontitle = function buttontitle(resource) {
        if (resource.type === 'widget') {
            return gettext('Add to workspace');
        } else {
            return gettext('Merge');
        }
    };

    var buttonlistener = function buttonlistener(resource) {
        if (resource.type === 'widget') {
            var local_widget = Wirecloud.LocalCatalogue.getResource(resource.vendor, resource.name, resource.version);
            Wirecloud.activeWorkspace.addInstance(local_widget);
        } else {
            Wirecloud.mergeWorkspace(resource, {
                onFailure: function (msg, details) {
                    var dialog;
                    if (details != null && 'missingDependencies' in details) {
                        // Show missing dependencies
                        dialog = new Wirecloud.ui.MissingDependenciesWindowMenu(null, details);
                    } else {
                        dialog = new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG);
                    }
                    dialog.show();
                }
            });
        }
    };

    var MACWallet = function MACWallet() {
    };

    MACWallet.prototype.show = function show() {

        if (this.wallet != null) {
            return;
        }

        this.wallet = new Wirecloud.ui.MACSearch({
            extra_template_context: {
                addmore: function () {
                    var div = document.createElement('div');
                    div.className = 'widget_wallet_addmore';
                    var button = new StyledElements.StyledButton({text: gettext('Get more resources'), "class": "btn-success"});
                    button.addEventListener('click', function () {
                        LayoutManagerFactory.getInstance().changeCurrentView('marketplace');
                    });
                    button.insertInto(div);
                    return div;
                },
                scope: function () {
                    var pills = new StyledElements.Pills();
                    pills.add('widget', 'Widgets');
                    pills.add('mashup', 'Mashups');
                    pills.switchPill('widget');
                    pills.addEventListener('change', function (pills, enabled_pill) {
                        this.wallet.search_scope = enabled_pill;
                        this.wallet.refresh();
                    }.bind(this));
                    return pills;
                }.bind(this),
                closebutton: function () {
                    var button = new StyledElements.StyledButton({"class": "icon-remove", plain: true});
                    button.addEventListener('click', function () {
                        this.hide();
                    }.bind(this));
                    return button;
                }.bind(this)
            },
            resourceButtonIconClass: 'icon-plus',
            resourceButtonTooltip: buttontitle,
            resourceButtonListener: buttonlistener,
            scope: 'widget',
            template: 'wallet'
        });
        Wirecloud.activeWorkspace.notebook.contentArea.appendChild(this.wallet.wrapperElement);
        Wirecloud.UserInterfaceManager._registerPopup(this);
        setTimeout(function () {
            this.wallet.focus();
            this.wallet.addClassName('in');
        }.bind(this), 0);
    };

    var _hide = function _hide() {
        if (this.wallet != null && this.wallet.wrapperElement.parentNode) {
            this.wallet.wrapperElement.parentNode.removeChild(this.wallet.wrapperElement);
            Wirecloud.UserInterfaceManager._unregisterPopup(this);
        }
        this.wallet = null;
    };

    MACWallet.prototype.hide = function hide(instant) {
        if (this.wallet != null) {
            if (instant !== true && this.wallet.hasClassName('in')) {
                this.wallet.wrapperElement.addEventListener('transitionend', _hide.bind(this));
                this.wallet.removeClassName('in');
            } else {
                _hide.call(this);
            }
        }
    };

    Wirecloud.ui.MACWallet = MACWallet;

})();
