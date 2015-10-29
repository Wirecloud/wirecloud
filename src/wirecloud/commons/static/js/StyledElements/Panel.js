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
     * @param {Object.<String, *>} options [description]
     */
    se.Panel = utils.defineClass({

        constructor: function Panel(options) {
            options = utils.merge(utils.clone(defaults), options);
            this.superClass(['click'].concat(options.events));

            this.wrapperElement = document.createElement('div');
            this.wrapperElement.className = 'panel';

            if (options.state) {
                this.addClassName('panel-' + options.state);
            }

            if (options.selectable) {
                this.addClassName('panel-selectable');
            }

            this.addClassName(options.extraClass);

            this.heading = new se.Container({extraClass: "panel-heading"});
            this.heading.insertInto(this.wrapperElement);

            if (options.title) {
                this.setTitle(options.title);
            }

            if (options.buttons.length) {
                this.buttons = new se.Container({extraClass: "panel-options"});
                options.buttons.forEach(function (button) {
                    this.buttons.appendChild(button);
                }, this);
                this.heading.appendChild(this.buttons);
            }

            if (options.subtitle) {
                this.subtitle = new se.Container({extraClass: "panel-subtitle"});
                this.heading.appendChild(this.subtitle.appendChild(options.subtitle));
            }

            if (!options.noBody) {
                this.body = new se.Container({extraClass: "panel-body"});
                this.body.insertInto(this.wrapperElement);
            }

            Object.defineProperties(this, {

                active: {
                    get: function get() {return this.hasClassName('active');},
                    set: function set(value) {
                        if (this.active !== value) {
                            this.toggleClassName('active', value)._onactive(value);
                        }
                    }
                },

                title: {
                    get: function get() {return this.heading.titleElement.textContent;}
                }

            });

            this.wrapperElement.addEventListener('click', this._onclick.bind(this));
        },

        inherit: se.StyledElement,

        members: {

            /**
             * @version 0.6.0
             * @abstract
             */
            _onactive: function _onactive(active) {
                // This member can be implemented by subclass.
            },

            /**
             * @override
             */
            _onclick: function _onclick(event) {
                return this.trigger('click', event);
            },

            /**
             * @override
             */
            clear: function clear() {

                if (this.body != null) {
                    this.body.clear();
                }

                return this;
            },

            setTitle: function setTitle(title) {

                if (this.heading.titleElement == null) {
                    this.heading.titleElement = document.createElement('div');
                    this.heading.titleElement.className ="panel-title";
                    this.heading.appendChild(this.heading.titleElement);
                }

                this.heading.titleElement.innerHTML = "";

                if (typeof title === 'string') {
                    this.heading.titleElement.innerHTML = title;
                } else {
                    this.heading.titleElement.appendChild(title);
                }

                return this;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        events: [],
        title: "",
        subtitle: "",
        state: 'default',
        selectable: false,
        extraClass: "",
        noBody: false,
        buttons: []
    };

})(StyledElements, StyledElements.Utils);
