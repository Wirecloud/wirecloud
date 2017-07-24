/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var update_tabindex = function update_tabindex() {
        if (this.enabled) {
            this.wrapperElement.setAttribute('tabindex', this.tabindex);
        } else {
            this.wrapperElement.setAttribute('tabindex', -1);
        }
    };

    /**
     *
     * Eventos que soporta este componente:
     *      - click: evento lanzado cuando se pulsa el botón.
     */
    var SwitchButton = function SwitchButton(options) {
        options = utils.merge(utils.clone(defaults), options);

        // {... ,button1: {name: , iconClass: , label: }, button2: {name: , iconClass: , label: } }
        // Support hirerarchy
        if (options.extending) {
            return;
        }

        // Create the div for the buttons
        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = "btn-group";

        this.buttons = [];

        for (var i = 0; i < options.buttons.length; i++) {
            let but = document.createElement("button");
            but.className = "se-btn";
            but.index = i;
            but.addEventListener("click", function () {
                this.toggleActiveButton(but.index);
            }.bind(this));

            // Set button text
            if (options.buttons[i].name) {
                but.innerHTML = options.buttons[i].name + " ";// Offset for the icon
            }

            // Set button icon
            if (options.buttons[i].iconClass != null && options.buttons[i].iconClass.trim() !== "") {
                var icon = document.createElement('i');
                icon.className = options.buttons[i].iconClass.trim();
                but.appendChild(icon);
            }

            this.wrapperElement.appendChild(but);
            this.buttons.push(but);
        }

        this.selected = options.default;
        if (this.selected != null) {
            this.buttons[this.selected].className = "se-btn btn-primary";
        }
        /* Properties */
        var tabindex;
        Object.defineProperties(this, {

            tabindex: {
                get: function get() {
                    return tabindex;
                },
                set: function set(new_tabindex) {
                    tabindex = new_tabindex;
                    update_tabindex.call(this);
                }
            },

            visible: {
                get: function get() {
                    return !this.hasClassName('invisible');
                },
                set: function set(value) {
                    this.toggleClassName('invisible', !value)
                        ._onvisible(value);
                }
            }

        });

        /* Initial status */
        this.tabindex = options.tabindex;

    };

    StyledElements.Utils.inherit(SwitchButton, StyledElements.StyledElement);

    SwitchButton.prototype.Tooltip = StyledElements.Tooltip;

    // Set the callback function for the buttons click.
    // It will be called with a int value showing the index of the selected button
    SwitchButton.prototype.setCallback = function setCallback(fun) {
        this.callback = fun;
    };

    SwitchButton.prototype.toggleActiveButton = function toggleActiveButton(newSelectedIndex) {
        if (this.selected === newSelectedIndex) {
            return;
        }

        if (this.selected != null) {
            this.buttons[this.selected].classList.remove("btn-primary");
        }

        this.selected = newSelectedIndex;
        if (this.selected != null) {
            this.buttons[this.selected].classList.add("btn-primary");

            if (this.callback) {
                this.callback(this.selected);
            }
        }
    };

    SwitchButton.prototype.deselectButtons = function deselectButtons() {
        if (this.selected != null) {
            this.buttons[this.selected].classList.remove("btn-primary");
            this.selected = null;
        }
    };

    SwitchButton.prototype._onenabled = function _onenabled(enabled) {
        update_tabindex.call(this);

        if (!enabled) {
            this.blur();
        }

        return this;
    };

    /**
     * @since 0.6.0
     * @abstract
     */
    SwitchButton.prototype._onvisible = function _onvisible(visible) {
        // This member can be implemented by subclass.
    };

    SwitchButton.prototype.focus = function focus() {
        this.wrapperElement.focus();
    };

    SwitchButton.prototype.blur = function blur() {
        this.wrapperElement.blur();
    };

    SwitchButton.prototype.destroy = function destroy() {
        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    /**
     * Set a badge on the button to highlight new or unread items.
     * @since 0.7.0
     *
     * @param {String|Number} content The badge's textContent.
     * @param {String} [state] The badge's contextual state class.
     * @param {Boolean} [isAlert] Set the button more eye-catching.
     *
     * @returns {StyledElements.SwitchButton} The instance on which this method is called.
     */
    SwitchButton.prototype.setBadge = function setBadge(content, state, isAlert) {
        return content ? insertBadge.call(this, content, state, !!isAlert) : removeBadge.call(this);
    };

    StyledElements.SwitchButton = SwitchButton;

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        default: 0,
        buttons: [
            {
                iconClass: "",
                name: "On"
            },
            {
                iconClass: "",
                name: "Off"
            }
        ],
        tabindex: 0
    };

    var insertBadge = function insertBadge(content, state, isAlert) {
        var states = ['inverse', 'primary', 'success', 'info', 'warning', 'danger'];

        if (this.badgeElement == null) {
            this.badgeElement = document.createElement('span');
            this.badgeElement.className = "badge";
            if (states.indexOf(state) !== -1) {
                this.badgeElement.classList.add("badge-" + state);
            }
            this.wrapperElement.insertBefore(this.badgeElement, this.wrapperElement.firstChild);
        }

        this.toggleClassName('has-alert', isAlert);
        this.badgeElement.textContent = content;

        return this;
    };

    var removeBadge = function removeBadge() {

        if (this.badgeElement != null) {
            this.wrapperElement.removeChild(this.badgeElement);
            delete this.badgeElement;
        }

        this.removeClassName('has-alert');

        return this;
    };

})(StyledElements, StyledElements.Utils);
