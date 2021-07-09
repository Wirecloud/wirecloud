/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2021 Future Internet Consulting and Development Solutions S.L.
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


(function (se, utils) {

    "use strict";

    const privates = new WeakMap();
    const builder = new StyledElements.GUIBuilder();
    const template = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><div class="popover fade"><div class="arrow"/><h3 class="popover-title"><t:title/></h3><div class="popover-content"><t:content/></div></div></s:styledgui>';

    const update_popover_visibility = function update_popover_visibility(changes) {
        if ("visible" in changes) {
            privates.get(this).element.classList.toggle("hidden", !changes.visible);
        }
    };

    const on_widget_unload = function on_widget_unload(popover, widget) {
        popover.hide();
    };

    const track_element = function track_element(widget, popover) {
        const priv = privates.get(popover);
        priv.update_popover_visibility_bound = update_popover_visibility.bind(popover);
        widget.contextManager.addCallback(priv.update_popover_visibility_bound);
        priv.on_widget_unload = on_widget_unload.bind(null, popover);
        widget.addEventListener("unload", priv.on_widget_unload);
    };

    const untrack_element = function untrack_element(widget, popover) {
        const priv = privates.get(popover);
        widget.contextManager.removeCallback(priv.update_popover_visibility_bound);
        widget.removeEventListener("unload", priv.on_widget_unload);
        delete priv.update_popover_visibility_bound;
        delete priv.on_widget_unload;
    };

    const disableCallback = function disableCallback(e) {

        if (e.button !== 0) {
            return;
        }

        setTimeout(this.hide.bind(this), 0);
    };

    const setPosition = function setPosition(element, refPosition, position) {
        element.classList.remove('top', 'right', 'bottom', 'left');
        element.style.top = "";
        element.style.left = "";
        element.style.bottom = "";
        element.style.right = "";

        element.classList.add(position);
        switch (position) {
        case 'top':
            element.style.left = (refPosition.left + (refPosition.width - element.offsetWidth) / 2) + "px";
            element.style.top = (refPosition.top - element.offsetHeight) + "px";
            break;
        case 'right':
            element.style.left = refPosition.right + "px";
            element.style.top = (refPosition.top + (refPosition.height - element.offsetHeight) / 2) + "px";
            break;
        case 'bottom':
            element.style.left = (refPosition.left + (refPosition.width - element.offsetWidth) / 2) + "px";
            element.style.top = refPosition.bottom + "px";
            break;
        case 'left':
            element.style.left = (refPosition.left - element.offsetWidth) + "px";
            element.style.top = (refPosition.top + (refPosition.height - element.offsetHeight) / 2) + "px";
            break;
        }
    };

    const standsOut = function standsOut(element) {
        const parent_box = element.parentElement.getBoundingClientRect();
        const element_box = element.getBoundingClientRect();

        const visible_width = element_box.width - Math.max(element_box.right - parent_box.right, 0) - Math.max(parent_box.left - element_box.left, 0);
        const visible_height = element_box.height - Math.max(element_box.bottom - parent_box.bottom, 0) - Math.max(parent_box.top - element_box.top, 0);
        const element_area = element_box.width * element_box.height;
        const visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    const FIX_PLANS = {
        "bottom": ["left", "right", "top", "bottom"],
        "left": ["right", "top", "bottom", "left"],
        "right": ["left", "top", "bottom", "right"],
        "top": ["left", "right", "bottom", "top"]
    };

    const fixPosition = function fixPosition(element, refPosition, weights, positions) {
        // Search which position has less area outside the window
        const best_weight = Math.min.apply(Math, weights);
        const index = weights.indexOf(best_weight);
        const position = positions[index];

        // And use it as the starting point
        setPosition(element, refPosition, position);

        // Reduce popover size to enter on the current window
        const parent_box = element.parentElement.getBoundingClientRect();
        let element_box = element.getBoundingClientRect();

        const plan = FIX_PLANS[position];
        plan.forEach((placement) => {
            if (
                (placement === "top" || placement === "left") && element_box[placement] < parent_box[placement]
                || (placement === "bottom" || placement === "right") && element_box[placement] > parent_box[placement]
            ) {
                element.style[placement] = "10px";
                element_box = element.getBoundingClientRect();
            }
        });
    };

    const searchBestPosition = function searchBestPosition(refPosition, positions) {
        const priv = privates.get(this);
        const weights = [];

        if ('getBoundingClientRect' in refPosition) {
            refPosition = refPosition.getBoundingClientRect();
        }

        let i = 0;
        do {
            setPosition(priv.element, refPosition, positions[i]);
            weights.push(standsOut(priv.element));
            i += 1;
        } while (weights[i - 1] > 0 && i < positions.length);

        if (weights[i - 1] > 0) {
            fixPosition(priv.element, refPosition, weights, positions);
        }
    };

    const _show = function _show(refPosition) {
        const priv = privates.get(this);

        if ('Wirecloud' in window) {
            Wirecloud.UserInterfaceManager._registerPopup(this);
        }

        if (this.visible) {
            priv.element.classList.add('in');
            return this.repaint();
        }

        priv.element = builder.parse(template, {
            title: this.options.title,
            content: this.options.content
        }).elements[0];
        priv.element.addEventListener('transitionend', _hide.bind(this));

        priv.baseelement = utils.getFullscreenElement() || document.body;
        priv.baseelement.appendChild(priv.element);
        utils.onFullscreenChange(document.body, priv.on_fullscreen_change);
        if (priv.refContainer != null) {
            track_element(priv.refContainer, this);
        }

        priv.element.classList.toggle("sticky", this.options.sticky);
        if (!this.options.sticky) {
            priv.baseelement.ownerDocument.addEventListener("click", priv.disableCallback, true);
        }

        priv.refPosition = refPosition;
        searchBestPosition.call(this, priv.refPosition, this.options.placement);
        priv.element.classList.add('in');
        this.dispatchEvent('show');

        return this;
    };

    const _hide = function _hide() {
        const priv = privates.get(this);
        if (priv.element != null && !priv.element.classList.contains('in')) {
            utils.removeFullscreenChangeCallback(document.body, priv.on_fullscreen_change);
            priv.element.remove();
            priv.element = null;
            priv.refPosition = null;
            if (priv.refContainer != null) {
                untrack_element(priv.refContainer, this);
            }
            if ('Wirecloud' in window) {
                Wirecloud.UserInterfaceManager._unregisterPopup(this);
            }
            if (!this.options.sticky) {
                priv.baseelement.ownerDocument.removeEventListener('click', priv.disableCallback, true);
            }
            this.dispatchEvent('hide');
        }
    };


    se.Popover = class Popover extends se.StyledElement {

        /**
         * @param {Object} [options] a dictionary with popover options
         * @param {Wirecloud.ui.WidgetView} [options.refContainer] Widget
         *   associated with this popover. Visibility of the popover with be
         *   controlled also with the visibility of the widget. This is a
         *   WireCloud related feature.
         * @param {boolean} [options.sticky] If `true`, the popover won't be
         *   closed when clicking on the document.
         */
        constructor(options) {
            const defaultOptions = {
                refContainer: null,
                content: "",
                title: "",
                class: "",
                html: false,
                placement: ["right", "bottom", "left", "top"],
                sticky: false
            };

            super([]);
            Object.defineProperty(this, 'options', {value: utils.merge(defaultOptions, options)});

            const priv = {
                element: null,
                disableCallback: disableCallback.bind(this),
                refContainer: this.options.refContainer,
                on_fullscreen_change: (event) => {
                    priv.baseelement = utils.getFullscreenElement() || document.body;
                    priv.baseelement.appendChild(priv.element);
                    this.repaint();
                }
            };
            privates.set(this, priv);

            delete this.options.refContainer;
        }

        get visible() {
            return privates.get(this).element != null;
        }

        bind(element, mode) {
            switch (mode) {
            case "click":
                element.addEventListener('click', this.toggle.bind(this), true);
                break;
            case "hover":
                element.addEventListener('focus', this.show.bind(this, element), false);
                element.addEventListener('blur', this.hide.bind(this), false);
                element.addEventListener('mouseenter', this.show.bind(this, element), true);
                element.addEventListener('mouseleave', this.hide.bind(this), true);
                element.addEventListener('click', this.show.bind(this, element), false);
                break;
            default:
                throw new TypeError('Invalid mode: ' + mode);
            }

            return this;
        }

        disablePointerEvents() {
            const priv = privates.get(this);

            if (priv.element) {
                priv.element.style.pointerEvents = "none";
            }

            return this;
        }

        enablePointerEvents() {
            const priv = privates.get(this);

            if (priv.element) {
                priv.element.style.pointerEvents = "";
            }

            return this;
        }

        toggle(refElement) {
            if (this.visible) {
                return this.hide();
            } else {
                return this.show(refElement);
            }
        }

        repaint() {
            const priv = privates.get(this);

            if (priv.refPosition) {
                searchBestPosition.call(this, priv.refPosition, this.options.placement);
            }

            return this;
        }

        show(refElement) {
            return _show.call(this, refElement);
        }

        update(title, content) {
            this.options.title = title;
            this.options.content = content;

            const priv = privates.get(this);
            if (priv.element) {
                priv.element.remove();

                priv.element = builder.parse(template, {
                    title: this.options.title,
                    content: this.options.content
                }).elements[0];
                priv.element.addEventListener("transitionend", _hide.bind(this));
                priv.element.classList.toggle("sticky", this.options.sticky);
                priv.element.classList.add("in");
                priv.baseelement.appendChild(priv.element);

                this.repaint();
            }
            return this;
        }

        hide() {
            if (!this.visible) {
                return this;
            }

            const priv = privates.get(this);
            const force = !priv.element.classList.contains('in') || getComputedStyle(priv.element).getPropertyValue('opacity') === "0";
            priv.element.classList.remove('in');
            if (force) {
                _hide.call(this);
            }

            return this;
        }

    }

})(StyledElements, StyledElements.Utils);
