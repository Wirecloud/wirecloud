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
     * Create a new instance of class Panel.
     *
     * @constructor
     * @param {String[]} events [description]
     * @param {Object.<String, *>} options [description]
     */
    se.Panel = utils.defineClass({

        constructor: function Panel(events, options) {
            options = utils.updateObject(defaults, options);
            this.superClass(['click'].concat(events));

            this.wrapperElement = document.createElement('div');
            this.wrapperElement.className = 'panel';

            if (options.state) {
                this.addClass('panel-' + options.state);
            }

            if (options.selectable) {
                this.addClass('panel-selectable');
            }

            if (options.extraClass) {
                this.addClass(options.extraClass);
            }

            this.heading = new se.Container({
                extraClass: "panel-heading"
            });
            this.append(this.heading);

            if (options.title) {
                this.title = new se.Container({
                    extraClass: "panel-title"
                });
                this.heading.append(this.title.append(options.title));
            }

            if (options.optionList.length) {
                this.options = new se.Container({
                    extraClass: "panel-options"
                });
                options.optionList.forEach(function (button) {
                    this.options.append(button);
                }, this);
                this.heading.append(this.options);
            }

            this.body = new se.Container({
                extraClass: "panel-body"
            });
            this.append(this.body);

            Object.defineProperty(this, 'active', {
                get: function get() {
                    return this.hasClass('active');
                },
                set: function set(value) {
                    this.toggleClass('active', value)
                        ._onactive(value);
                }
            });

            this.wrapperElement.addEventListener('click', this._onclick.bind(this));
        },

        inherit: se.StyledElement,

        members: {

            /**
             * @version 0.2.0
             * @abstract
             */
            _onactive: function _onactive(active) {
                // This member can be implemented by subclass.
            },

            /**
             * @override
             */
            _onclick: function _onclick(event) {
                return this.trigger('click', this, event);
            },

            /**
             * @override
             */
            empty: function empty() {
                this.body.empty();

                return this;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        title: "",
        state: 'default',
        selectable: false,
        extraClass: "",
        optionList: []
    };

})(StyledElements, StyledElements.Utils);
