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

/* globals WeakMap, StyledElements */


(function (se, utils) {

    "use strict";

    /**
     * Creates a new instance of Tab. This component is meant to be used inside a
     * {@link StyledElements.Notebook} component, use
     * {@link StyledElements.Notebook#createTab} for creating new tabs.
     *
     * Supported events:
     * - close: event raised after removing the tab from its notebook.
     * - hide: event raised after the tab is hidden.
     * - show: event raised after the tab is displayed.
     *
     * @constructor
     * @extends StyledElements.Container
     * @name StyledElements.Tab
     * @since 0.5
     *
     * @param {Object.<String, *>} options
     *    Available options:
     *
     *    - `closable` (Boolean): `true` for allowing users to close this tab by
     *    providing a close button.
     *    - `containerOptions` (Object): options to be used for creating the
     *    associated container.
     *    - `name` (String): label to use for this tab.
     *
     */
    var Tab = function Tab(id, notebook, options) {

        if (!(notebook instanceof se.Notebook)) {
            throw new TypeError("Invalid notebook argument");
        }

        var defaultOptions = {
            'closable': true,
            'containerOptions': {},
            'label': ''
        };
        options = utils.merge(defaultOptions, options);
        options.useFullHeight = true;

        Object.defineProperties(this, {
            /**
             * Name/label associated with this tab
             *
             * @memberof StyledElements.Tab#
             * @since 0.8.0
             *
             * @type {String}
             */
            label: {
                get: on_label_get
            },
            notebook: {
                value: notebook
            },
            tabElement: {
                get: on_tabelement_get
            },
            /**
             * id used for identify this tab
             *
             * @memberof StyledElements.Tab#
             * @since 0.5.0
             *
             * @type {String}
             */
            tabId: {
                value: id
            }
        });

        var priv = {
            labelElement: document.createElement('span'),
            tabElement: document.createElement("li")
        };
        privates.set(this, priv);
        priv.tabElement.className = "se-notebook-tab";
        priv.tabElement.appendChild(priv.labelElement);

        /* call to the parent constructor */
        se.Container.call(this, options.containerOptions, ['show', 'hide', 'close']);

        this.wrapperElement.classList.add("se-notebook-tab-content");
        this.wrapperElement.classList.add("hidden");

        priv.tabElement.addEventListener("click",
                                    function () {
                                        this.notebook.goToTab(this.tabId);
                                    }.bind(this),
                                    false);


        /* Process options */
        if (options.closable) {
            var closeButton = new this.Button({
                iconClass: "fa fa-remove",
                plain: true,
                class: "close_button"
            });
            closeButton.insertInto(priv.tabElement);

            closeButton.addEventListener("click",
                                         this.close.bind(this),
                                         false);
        }

        // Support deprecated options.name
        if (options.name != null) {
            options.label = options.name;
        }
        Tab.prototype.setLabel.call(this, options.label);
        this.setTitle(options.title);
    };
    utils.inherit(Tab, se.Container);

    Tab.prototype.Tooltip = se.Tooltip;
    Tab.prototype.Button = se.Button;

    /**
     * Removes this `Tab` from the associated `Notebook`.
     *
     * @since 0.5
     * @name StyledElements.Tab#close
     *
     * @returns {StyledElements.Tab}
     *      The instance on which the member is called.
     */
    Tab.prototype.close = function close() {
        this.notebook.removeTab(this.tabId);

        return this.dispatchEvent("close");
    };

    /**
     * Sets the label of this `Tab`.
     *
     * @since 0.8
     * @name StyledElements.Tab#setLabel
     *
     * @param {String} newLabel
     *     text to use as label of this `Tab`.
     *
     * @returns {StyledElements.Tab}
     *     The instance on which the member is called.
     */
    Tab.prototype.setLabel = function setLabel(newLabel) {
        privates.get(this).labelElement.textContent = newLabel;

        return this;
    };

    /**
     * Sets the content to be displayed on the tab's tooltip. Pass `null`,
     * an empty string or directly don't use the `title` parameter for not
     * using a tooltip.
     *
     * @since 0.5
     * @name StyledElements.Tab#setTitle
     *
     * @param {String} [title]
     *      Contents to display in the associated tooltip.
     *
     * @returns {StyledElements.Tab}
     *      The instance on which the member is called.
     */
    Tab.prototype.setTitle = function setTitle(title) {

        if (title == null || title === '') {
            if (this.tooltip != null) {
                this.tooltip.destroy();
                this.tooltip = null;
            }
        } else {
            if (this.tooltip == null) {
                this.tooltip = new this.Tooltip({content: title, placement: ['bottom', 'top', 'right', 'left']});
                this.tooltip.bind(privates.get(this).tabElement);
            }
            this.tooltip.options.content = title;
        }

        return this;
    };

    /**
     * @name StyledElements.Tab#setVisible
     * @deprecated since version 0.5
     * @see {@link StyledElements.Tab#show}, {@link StyledElements.Tab#hide} and
     *      {@link StyledElements.Tab#hidden}
     */
    Tab.prototype.setVisible = function setVisible(newStatus) {
        return newStatus ? this.show() : this.hide();
    };

    /**
     * @override
     * @name StyledElements.Tab#hide
     */
    Tab.prototype.hide = function hide() {
        se.Container.prototype.hide.call(this);
        privates.get(this).tabElement.classList.remove("selected");
        return this;
    };

    /**
     * @override
     * @name StyledElements.Tab#show
     */
    Tab.prototype.show = function show() {
        se.Container.prototype.show.call(this);
        privates.get(this).tabElement.classList.add("selected");
        this.repaint(false);
        return this;
    };

    /**
     * Returns the id of this Tab.
     *
     * @name StyledElements.Tab#getId
     * @deprecated since version 0.5
     * @see {@link StyledElements.Tab#tabId}
     *
     * @returns {String}
     *      id of the tab
     */
    Tab.prototype.getId = function getId() {
        return this.tabId;
    };

    /**
     * TODO change this.
     *
     * @private
     */
    Tab.prototype.getTabElement = function getTabElement() {
        return privates.get(this).tabElement;
    };

    /**
     * Sets the label of this `Tab`.
     *
     * @name StyledElements.Tab#rename
     * @since 0.5
     * @deprecated since version 0.8
     * @see {@link StyledElements.Tab#setLabel}
     *
     * @param {String} name text to use as name of this `Tab`.
     *
     * @returns {StyledElements.Tab}
     *      The instance on which the member is called.
     */
    Tab.prototype.rename = Tab.prototype.setLabel;

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var on_label_get = function on_label_get() {
        return privates.get(this).tabElement.textContent;
    };

    var on_tabelement_get = function on_tabelement_get() {
        return privates.get(this).tabElement;
    };

    se.Tab = Tab;

})(StyledElements, StyledElements.Utils);
