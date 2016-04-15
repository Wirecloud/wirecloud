/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * @extends StyledElements.Panel
     *
     * @constructor
     * @param {Operator|Widget} wiringComponent
     *      [TODO: description]
     */
    ns.Component = utils.defineClass({

        constructor: function Component(wiringComponent) {

            this.title_tooltip = new se.Tooltip({content: wiringComponent.title, placement: ["top", "bottom", "right", "left"]});

            this.btnPrefs = new se.PopupButton({
                extraClass: "we-prefs-btn",
                title: gettext("Preferences"),
                iconClass: "icon-reorder"
            });
            this.btnPrefs.popup_menu.append(new ns.ComponentPrefs(this));

            this.superClass({
                state: null,
                extraClass: "we-component component-" + wiringComponent.meta.type,
                title: wiringComponent.title,
                subtitle: "v" + wiringComponent.meta.version.text,
                selectable: true,
                noBody: true,
                buttons: [this.btnPrefs]
            });

            this.heading.title.addClassName('component-title text-truncate');
            this.heading.subtitle.addClassName("component-version");

            this.label = document.createElement('span');

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

            wiringComponent.on('upgraded', function (componentUpdated) {
                this.setTitle(componentUpdated.title);
                this.setSubtitle("v" + componentUpdated.meta.version.text);
            }.bind(this));
        },

        inherit: se.Panel,

        members: {

            /**
             * @override
             */
            _onenabled: function _onenabled(enabled) {

                if (!enabled) {
                    formatDisabledMessage.call(this);
                    this.heading.appendChild(this.label);
                } else {
                    this.heading.removeChild(this.label);
                }

                return this.superMember(se.Panel, '_onenabled', enabled);
            },

            hasSettings: function hasSettings() {
                return this._component.meta.preferenceList.length > 0;
            },

            /**
             * @override
             */
            setTitle: function setTitle(title) {
                var span;

                span = document.createElement('span');
                span.textContent = title;
                this.title_tooltip.options.content = title;
                this.title_tooltip.bind(span);

                return this.superMember(se.Panel, 'setTitle', span);
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
            this.label.textContent = utils.gettext("volatile");
            this.label.className = "label label-info";
            return this;
        }

        if (!this._component.hasEndpoints()) {
            this.label.textContent = utils.gettext("no endpoints");
            this.label.className = "label label-warning";
            return this;
        }

        this.label.textContent = utils.gettext("in use");
        this.label.className = "label label-success";

        return this;
    };

    var component_onrename = function component_onrename(title) {
        this.setTitle(title);
        this.title_tooltip.options.content = title;
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
