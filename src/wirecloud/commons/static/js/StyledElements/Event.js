/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

    const privates = new WeakMap();

    /**
     * This class manages the callbacks of the <code>StyledElement</code>s' events.
     */
    se.Event = class Event {

        constructor(context) {
            Object.defineProperties(this, {
                context: {value: context},
                handlers: {value: []}
            });

            privates.set(this, {
                dispatching: false
            });
        }

        addEventListener(handler) {
            if (typeof handler !== 'function') {
                throw new TypeError('Handlers must be functions');
            }
            this.handlers.push(handler);
        }

        removeEventListener(handler) {
            if (typeof handler !== 'function') {
                throw new TypeError('Handlers must be functions');
            }

            for (let i = this.handlers.length - 1; i >= 0; i--) {
                if (this.handlers[i] === handler) {
                    if (privates.get(this).dispatching) {
                        this.handlers[i] = null;
                    } else {
                        this.handlers.splice(i, 1);
                    }
                }
            }
        }

        clearEventListeners() {
            if (privates.get(this).dispatching) {
                this.handlers.forEach(function (callback, index, array) {
                    array[index] = null;
                });
            } else {
                this.handlers.length = 0;
            }
        }

        dispatch() {
            const priv = privates.get(this);
            const args = [this.context, ...arguments];
            priv.dispatching = true;

            for (let i = 0; i < this.handlers.length; i++) {
                if (this.handlers[i] == null) {
                    continue;
                }
                try {
                    this.handlers[i].apply(this.context, args);
                } catch (e) {
                    if (window.console != null && typeof window.console.error === 'function') {
                        window.console.error(e);
                    }
                }
            }

            for (let i = this.handlers.length - 1; i >= 0; i--) {
                if (this.handlers[i] == null) {
                    this.handlers.splice(i, 1);
                }
            }

            priv.dispatching = false;
        }

    }

})(StyledElements, StyledElements.Utils);
