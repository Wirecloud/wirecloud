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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Create a new instance of class Component.
     * @extends StyledElements.Panel
     *
     * @constructor
     * @param {Operator|Widget} wiringComponent
     *      [TODO: description]
     */
    ns.Component = function Component(wiringComponent) {
        var used = false;

        this.title_tooltip = new se.Tooltip({content: wiringComponent.title, placement: ["top", "bottom", "right", "left"]});

        this.btnPrefs = new se.PopupButton({
            class: "we-prefs-btn",
            title: utils.gettext("Preferences"),
            iconClass: "fa fa-reorder"
        });
        this.btnPrefs.popup_menu.append(new ns.ComponentPrefs(this));

        se.Panel.call(this, {
            state: null,
            class: "we-component component-" + wiringComponent.meta.type,
            title: wiringComponent.title,
            subtitle: "v" + wiringComponent.meta.version,
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
            used: {
                get: function () {
                    return used;
                },
                set: function (value) {
                    used = value;
                    update_enable_status.call(this);
                    update_component_label.call(this);
                }
            }
        });
        this.get().setAttribute('data-id', this.id);

        this._on_change_model = on_change_model.bind(this);

        wiringComponent.addEventListener('change', this._on_change_model);
        update_enable_status.call(this);
        update_component_label.call(this);
    };

    utils.inherit(ns.Component, se.Panel, {

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

            return se.Panel.prototype.setTitle.call(this, span);
        },

        showLogs: function showLogs() {

            this._component.showLogs();

            return this;
        },

        showSettings: function showSettings() {

            this._component.showSettings();

            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var update_component_label = function update_component_label() {
        if (this._component.volatile) {
            this.label.textContent = utils.gettext("volatile");
            this.label.className = "label label-info";
        } else if (this._component.missing) {
            this.label.textContent = utils.gettext("missing");
            this.label.className = "label label-danger";
        } else if (this.used) {
            this.label.textContent = utils.gettext("in use");
            this.label.className = "label label-success";
        } else if (!this._component.hasEndpoints()) {
            this.label.textContent = utils.gettext("no endpoints");
            this.label.className = "label label-warning";
        } else {
            if (this.label.parentElement) {
                this.heading.removeChild(this.label);
            }
            return this;
        }
        this.heading.appendChild(this.label);

        return this;
    };

    var update_enable_status = function update_enable_status() {
        this.enabled = !(this.used || this._component.volatile || this._component.missing || !this._component.hasEndpoints());
    };

    var on_change_model = function on_change_model(model, changes) {

        if (changes.indexOf('title') !== -1) {
            this.setTitle(model.title);
            this.title_tooltip.options.content = model.title;
        }

        if (changes.indexOf('meta') !== -1) {
            this.setTitle(model.title);
            this.title_tooltip.options.content = model.title;
            this.setSubtitle("v" + model.meta.version);

            update_enable_status.call(this);
            update_component_label.call(this);
        }
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
