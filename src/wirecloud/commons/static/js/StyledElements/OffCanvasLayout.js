/*
 *  This file is part of Wirecloud.
 *  Copyright (C) 2015  CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *  Wirecloud is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  License, or (at your option) any later version.
 *
 *  Wirecloud is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global StyledElements */


(function (ns) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * [OffCanvasLayout description]
     *
     * @constructor
     * @param {Object.<String, *>} options [description]
     */
    ns.OffCanvasLayout = function OffCanvasLayout(options) {
        StyledElements.StyledElement.call(this, ns.OffCanvasLayout.EVENTS);

        options = StyledElements.Utils.merge(ns.OffCanvasLayout.DEFAULTS, options);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "se-offcanvas " + options.sideway + "-sideway";

        Object.defineProperties(this, {
            slipped: {
                get: function get() {
                    return this.wrapperElement.classList.contains('slipped');
                },
                set: function set(value) {
                    if (value) {
                        this.wrapperElement.classList.add('slipped');
                    } else {
                        this.wrapperElement.classList.remove('slipped');
                    }
                }
            },
            sidebar: {
                value: new StyledElements.Container({
                    'class': "se-offcanvas-sidebar"
                })
            },
            content: {
                value: new StyledElements.Container({
                    'class': "se-offcanvas-content"
                })
            },
            footer: {
                value: new StyledElements.Container({
                    'class': "se-offcanvas-footer"
                })
            }
        });

        this.panels = [];
        this.latestIndex = 0;

        this.wrapperElement.appendChild(this.sidebar.wrapperElement);
        this.wrapperElement.appendChild(this.content.wrapperElement);
        this.wrapperElement.appendChild(this.footer.wrapperElement);
    };

    ns.OffCanvasLayout.DEFAULTS = {
        sideway: 'left'
    };

    ns.OffCanvasLayout.EVENTS = ['show', 'hide'];

    ns.OffCanvasLayout.prototype = new ns.StyledElement();

    // ==================================================================================
    // PUBLIC MEMBERS
    // ==================================================================================

    /**
     * [addPanel description]
     *
     * @param {StyledElement} panelElement [description]
     * @returns {OffCanvasLayout} The instance on which the member is called.
     */
    ns.OffCanvasLayout.prototype.addPanel = function addPanel(panelElement) {
        this.sidebar.appendChild(panelElement.wrapperElement);
        this.panels.push(panelElement);

        return this;
    };

    /**
     * [repaint description]
     * @override
     *
     * @param {[type]} temporal [description]
     * @returns {OffCanvasLayout} The instance on which the member is called.
     */
    ns.OffCanvasLayout.prototype.repaint = function repaint(temporal) {
        this.sidebar.repaint(temporal);
        this.content.repaint(temporal);
        this.footer.repaint(temporal);

        return this;
    };

    /**
     * [show description]
     *
     * @param {Number} [panelIndex] [description]
     * @returns {OffCanvasLayout} The instance on which the member is called.
     */
    ns.OffCanvasLayout.prototype.show = function show(panelIndex) {
        var i, shownPanel = null;

        if (this.panels.length) {

            this.panels.forEach(function (panel) {
                panel.hide();
            });

            if (typeof panelIndex !== 'undefined') {
                shownPanel = this.panels[panelIndex].show();
                this.latestIndex = panelIndex;
            } else {
                shownPanel = this.panels[this.latestIndex].show();
            }
        }

        this.slipped = true;
        this.events.show.dispatch(shownPanel);

        return this;
    };

    /**
     * [hide description]
     *
     * @param {Number} [panelIndex] [description]
     * @returns {OffCanvasLayout} The instance on which the member is called.
     */
    ns.OffCanvasLayout.prototype.hide = function hide(panelIndex) {

        if (typeof panelIndex !== 'undefined') {
            this.latestIndex = panelIndex;
        }

        this.slipped = false;
        this.events.hide.dispatch();

        return this;
    };

})(StyledElements);
