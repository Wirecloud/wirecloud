/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    var privates = new WeakMap();

    var clickCallback = function clickCallback(e) {
        e.preventDefault();
        e.stopPropagation();

        var priv = privates.get(this);
        if (this.enabled && priv.related_input) {
            priv.related_input.focus();
        }
    };

    /**
     * Create a new instance of class `Addon`.
     *
     * Available options:
     * - `text`: content to be displayed inside the Addon
     * - `title`: content to be displayed on the tooltip associated with this
     *   Addon
     * - `class`: extra css classes to apply to this Addon.
     *
     * @constructor
     * @extends StyledElements.StyledElement
     * @name StyledElements.Addon
     * @since 0.5
     * @param {Object.<String, *>} options [description]
     */
    var Addon = function Addon(options) {
        var defaultOptions = {
            'text': null,
            'title': '',
            'class': ''
        };
        options = utils.merge(defaultOptions, options);

        se.Container.call(this, []);

        this.wrapperElement = document.createElement("span");
        this.wrapperElement.className = "se-add-on";
        this.addClassName(options.class);

        privates.set(this, {
            related_input: null
        });

        /* Init addon state */
        this.setTitle(options.title);
        this.setLabel(options.text);

        /* Event handlers */
        this._clickCallback = clickCallback.bind(this);

        this.wrapperElement.addEventListener('mousedown', utils.stopPropagationListener, true);
        this.wrapperElement.addEventListener('click', this._clickCallback, true);
    };
    utils.inherit(Addon, se.Container);

    Addon.prototype.Tooltip = se.Tooltip;

    /**
     * Sets the content to be displayed inside the addon.
     *
     * @since 0.5
     *
     * @param {String} label
     *     Text to be used as the content of the addon.
     *
     * @returns {StyledElements.Addon}
     *     The instance on which the member is called.
     */
    Addon.prototype.setLabel = function setLabel(label) {
        this.wrapperElement.textContent = label;
        return this;
    };

    /**
     * Sets the content to be displayed inside the tooltip associated with the
     * addon.
     *
     * @since 0.5
     *
     * @param {String} title
     *     Text to be used on the tooltip associated with this addon.
     *
     * @returns {StyledElements.Addon}
     *     The instance on which the member is called.
     */
    Addon.prototype.setTitle = function setTitle(title) {
        var priv = privates.get(this);
        if (title == null || title === "") {
            if (priv.tooltip != null) {
                priv.tooltip.destroy();
                priv.tooltip = null;
            }
        } else {
            if (priv.tooltip == null) {
                priv.tooltip = new this.Tooltip({content: title, placement: ['bottom', 'top', 'right', 'left']});
                priv.tooltip.bind(this.wrapperElement);
            }
            priv.tooltip.options.content = title;
        }

        return this;
    };

    /**
     * Sets the content to be displayed inside the tooltip associated with the
     * addon.
     *
     * @since 0.5
     *
     * @param {String} title
     *     Text to be used on the tooltip associated with this addon.
     *
     * @returns {StyledElements.Addon}
     *     The instance on which the member is called.
     */
    Addon.prototype.assignInput = function assignInput(input) {
        privates.get(this).related_input = input;
        return this;
    };

    Addon.prototype.destroy = function destroy() {

        this.wrapperElement.removeEventListener('mousedown', utils.stopPropagationListener, true);
        this.wrapperElement.removeEventListener('click', this._clickCallback, true);

        delete this._clickCallback;

        se.StyledElement.prototype.destroy.call(this);
    };

    se.Addon = Addon;

})(StyledElements, StyledElements.Utils);
