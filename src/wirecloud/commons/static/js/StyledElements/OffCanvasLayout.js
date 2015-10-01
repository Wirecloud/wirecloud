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
     * Create a new instance of class OffCanvasLayout.
     *
     * @constructor
     * @param {Object.<String, *>} [options] [description]
     */
    se.OffCanvasLayout = utils.defineClass({

        constructor: function OffCanvasLayout(options) {
            options = utils.merge(utils.clone(defaults), options);
            this.superClass(['slideIn', 'slideOut']);

            this.wrapperElement = document.createElement('div');
            this.addClassName("se-offcanvas " + options.sideway + "-sideway");

            Object.defineProperty(this, 'slipped', {
                get: function get() {
                    return this.hasClassName('slipped');
                },
                set: function set(value) {
                    this.toggleClassName('slipped', value);
                }
            });

            this.panels = [];
            this.latestIndex = 0;

            Object.defineProperties(this, {
                sidebar: {value: new se.Container({extraClass: 'se-offcanvas-sidebar'})},
                content: {value: new se.Container({extraClass: 'se-offcanvas-content'})},
                footer: {value: new se.Container({extraClass: 'se-offcanvas-footer'})}
            });

            this.sidebar.insertInto(this.wrapperElement);
            this.content.insertInto(this.wrapperElement);
            this.footer.insertInto(this.wrapperElement);
        },

        inherit: se.StyledElement,

        members: {

            /**
             * [addPanel description]
             *
             * @param {Panel} panel
             *      [description]
             * @returns {OffCanvasLayout}
             *      The instance on which the member is called.
             */
            addPanel: function addPanel(panel) {
                this.sidebar.appendChild(panel);
                this.panels.push(panel);

                return this;
            },

            /**
             * [slideOut description]
             *
             * @param {Number} [panelIndex]
             *      [description]
             * @returns {OffCanvasLayout}
             *      The instance on which the member is called.
             */
            slideOut: function slideOut(panelIndex) {

                if (panelIndex != null) {
                    this.latestIndex = panelIndex;
                }

                this.slipped = false;

                return this.trigger('slideOut');
            },

            /**
             * [slideIn description]
             *
             * @param {Number} [panelIndex]
             *      [description]
             * @returns {OffCanvasLayout}
             *      The instance on which the member is called.
             */
            slideIn: function slideIn(panelIndex) {
                var panel;

                if (this.panels.length) {
                    this.panels.forEach(function (panel) {
                        panel.hide();
                    });

                    if (panelIndex != null) {
                        this.latestIndex = panelIndex;
                    }

                    panel = this.panels[this.latestIndex].show();
                }

                this.slipped = true;

                return this.trigger('slideIn', panel);
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        sideway: 'left'
    };

})(StyledElements, StyledElements.Utils);
