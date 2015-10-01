/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global gettext, StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class Component.
     * @extends {Panel}
     *
     * @constructor
     * @param {Operator|Widget} wiringComponent
     *      [TODO: description]
     */
    ns.Component = utils.defineClass({

        constructor: function Component(wiringComponent) {

            this.btnPrefs = new se.PopupButton({
                extraClass: "btn-show-prefs",
                title: gettext("Preferences"),
                iconClass: "icon-reorder"
            });
            this.btnPrefs.popup_menu.append(new ns.ComponentPrefs(this));

            this.superClass({
                extraClass: "component component-" + wiringComponent.meta.type,
                title: wiringComponent.title,
                subtitle: "v" + wiringComponent.meta.version.text,
                selectable: true,
                noBody: true,
                buttons: [this.btnPrefs]
            });

            this.subtitle.addClassName("component-version");

            this.badge = document.createElement('span');

            this._component = wiringComponent;

            Object.defineProperties(this, {
                id: {value: wiringComponent.id},
                type: {value: wiringComponent.meta.type},
            });
            this.get().setAttribute('data-id', this.id);

            if (this.type == 'widget') {
                wiringComponent.on('title_changed', component_onrename.bind(this));
            }

            if (wiringComponent.volatile || !wiringComponent.hasEndpoints()) {
                this.disable();
            }
        },

        inherit: se.Panel,

        members: {

            /**
             * @override
             */
            _onenabled: function _onenabled(enabled) {

                if (!enabled) {
                    formatDisabledMessage.call(this);
                    this.heading.appendChild(this.badge);
                } else {
                    this.heading.removeChild(this.badge);
                }

                return this.superMember(se.Panel, '_onenabled', enabled);
            },

            hasSettings: function hasSettings() {
                return this._component.hasSettings();
            },

            showLogs: function showLogs() {

                this._component.showLogs();

                return this;
            },

            showSettings: function showSettings() {

                this._component.showSettings();

                return this;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var formatDisabledMessage = function formatDisabledMessage() {
        /*jshint validthis:true */

        if (this._component.volatile) {
            this.badge.textContent = utils.gettext("volatile");
            this.badge.className = "badge badge-info";
            return this;
        }

        if (!this._component.hasEndpoints()) {
            this.badge.textContent = utils.gettext("no endpoints");
            this.badge.className = "badge badge-warning";
            return this;
        }

        this.badge.textContent = utils.gettext("in use");
        this.badge.className = "badge badge-success";

        return this;
    };

    var component_onrename = function component_onrename(title) {
        this.setTitle(title);
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
