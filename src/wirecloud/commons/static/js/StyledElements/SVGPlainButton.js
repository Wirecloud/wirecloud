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

/* global StyledElements */


(function (se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class SVGPlainButton.
     * @extends {StyledElement}
     *
     * @constructor
     * @param {PlainObject} [options]
     *      [TODO: description]
     */
    se.SVGPlainButton = utils.defineClass({

        constructor: function SVGPlainButton(options) {

            options = utils.merge(utils.clone(defaults), options);
            this.superClass(events.concat(options.events));

            this.wrapperElement = document.createElementNS(se.SVGPlainButton.SVG_NS, 'text');
            this.wrapperElement.setAttribute('class', "btn-svg-plain");

            if (options.iconClass) {
                this.iconClass(options.iconClass);
            }

            if (options.extraClass) {
                this.addClassName(options.extraClass);
            }

            if (options.title) {
                this.title(options.title);
            }

            if (options.menuItems != null) {
                this.dropdownMenu = new se.PopupMenu();
                this.dropdownMenu.append(options.menuItems);
                this.dropdownMenu.addEventListener('visibilityChange', menu_onvisible.bind(this));
            }

            Object.defineProperties(this, {

                active: {
                    get: function get() {return this.hasClassName('active');},
                    set: function set(value) {this._onactive(value);}
                }

            });

            this.get().addEventListener('mousedown', utils.stopPropagationListener, true);
            this.get().addEventListener('click', button_onclick.bind(this), false);
        },

        inherit: se.StyledElement,

        statics: {

            SVG_NS: "http://www.w3.org/2000/svg"

        },

        members: {

            _onactive: function _onactive(active) {
                return this.active === active ? this : this.toggleClassName('active', active);
            },

            iconClass: function iconClass(className) {

                if (this.icon != null) {
                    this.get().removeChild(this.icon);
                    delete this.icon;
                }

                this.icon = document.createTextNode(fontawesomeIcons[className]);
                this.get().appendChild(this.icon);

                return this;
            },

            title: function title(new_title) {
                return new_title ? appendTitle.call(this, new_title) : removeTitle.call(this);
            },

            position: function position(x, y) {

                this.get().setAttribute('x', x);
                this.get().setAttribute('y', y);

                return this;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        title: "",
        events: [],
        extraClass: "",
        iconClass: "",
        menuItems: null
    };

    var events = ['click'];

    var fontawesomeIcons = {
        "icon-plus-sign": "\uf055",
        "icon-remove-sign": "\uf057",
        "icon-reorder": "\uf0c9",
        "icon-trash": "\uf014"
    };

    var appendTitle = function appendTitle(title) {

        if (this.tooltip == null) {
            this.tooltip = new se.Tooltip({placement: ['top']});
            this.tooltip.bind(this.get());
        }

        this.tooltip.options.content = title;

        return this;
    };

    var removeTitle = function removeTitle() {

        if (this.tooltip != null) {
            this.tooltip.destroy();
            delete this.tooltip;
        }

        return this;
    };

    var button_onclick = function button_onclick(event) {

        event.preventDefault();
        event.stopPropagation();

        if (this.enabled && event.button === 0) {
            toggleDropdownMenuVisible.call(this);
            this.trigger('click', event);
        }
    };

    var menu_onvisible = function menu_onvisible() {
        this.active = this.dropdownMenu.isVisible();
    };

    var toggleDropdownMenuVisible = function toggleDropdownMenuVisible() {

        if (this.dropdownMenu != null) {
            if (this.dropdownMenu.isVisible()) {
                this.dropdownMenu.hide();
            } else {
                this.dropdownMenu.show(this.get().getBoundingClientRect());
            }
        }
    };

})(StyledElements, StyledElements.Utils);
