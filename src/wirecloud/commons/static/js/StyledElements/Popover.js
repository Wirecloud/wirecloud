/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var privates = new WeakMap();
    var builder = new StyledElements.GUIBuilder();
    var template = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><div class="popover fade"><div class="arrow"/><h3 class="popover-title"><t:title/></h3><div class="popover-content"><t:content/></div></div></s:styledgui>';

    var disableCallback = function disableCallback(e) {

        if (e.button !== 0) {
            return;
        }

        setTimeout(this.hide.bind(this), 0);
    };

    var setPosition = function setPosition(element, refPosition, position) {
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

    var standsOut = function standsOut(element) {
        var parent_box = element.parentElement.getBoundingClientRect();
        var element_box = element.getBoundingClientRect();

        var visible_width = element_box.width - Math.max(element_box.right - parent_box.right, 0) - Math.max(parent_box.left - element_box.left, 0);
        var visible_height = element_box.height - Math.max(element_box.bottom - parent_box.bottom, 0) - Math.max(parent_box.top - element_box.top, 0);
        var element_area = element_box.width * element_box.height;
        var visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    const FIX_PLANS = {
        "bottom": ["left", "right", "top", "bottom"],
        "left": ["right", "top", "bottom", "left"],
        "right": ["left", "top", "bottom", "right"],
        "top": ["left", "right", "bottom", "top"]
    };

    var fixPosition = function fixPosition(element, refPosition, weights, positions) {
        // Search which position has less area outside the window
        var best_weight = Math.min.apply(Math, weights);
        var index = weights.indexOf(best_weight);
        var position = positions[index];

        // And use it as the starting point
        setPosition(element, refPosition, position);

        // Reduce popover size to enter on the current window
        var parent_box = element.parentElement.getBoundingClientRect();
        var element_box = element.getBoundingClientRect();

        var plan = FIX_PLANS[position];
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

    var searchBestPosition = function searchBestPosition(refPosition, positions) {
        const priv = privates.get(this);
        var i = 0, weights = [];

        do {
            setPosition(priv.element, refPosition, positions[i]);
            weights.push(standsOut(priv.element));
            i += 1;
        } while (weights[i - 1] > 0 && i < positions.length);

        if (weights[i - 1] > 0) {
            fixPosition(priv.element, refPosition, weights, positions);
        }
    };

    var _show = function _show(refPosition) {
        const priv = privates.get(this);

        if ('Wirecloud' in window) {
            Wirecloud.UserInterfaceManager._registerPopup(this);
        }

        if (this.visible) {
            priv.element.classList.add('in');
            return this.repaint();
        }

        if ('getBoundingClientRect' in refPosition) {
            refPosition = refPosition.getBoundingClientRect();
        }

        priv.element = builder.parse(template, {
            title: this.options.title,
            content: this.options.content
        }).elements[0];
        priv.element.addEventListener('transitionend', _hide.bind(this));

        priv.baseelement = utils.getFullscreenElement() || document.body;
        priv.baseelement.appendChild(priv.element);
        priv.baseelement.addEventListener("click", priv.disableCallback, true);

        searchBestPosition.call(this, refPosition, this.options.placement);
        priv.element.classList.add('in');
        this.dispatchEvent('show');

        return this;
    };

    var Popover = function Popover(options) {
        var defaultOptions = {
            'content': '',
            'title': '',
            'class': '',
            'html': false,
            'placement': ['right', 'bottom', 'left', 'top']
        };
        Object.defineProperty(this, 'options', {value: utils.merge(defaultOptions, options)});

        StyledElements.StyledElement.call(this, []);

        const priv = {
            element: null,
            disableCallback: disableCallback.bind(this)
        };
        privates.set(this, priv);
        Object.defineProperties(this, {
            visible: {
                get: function () {
                    return priv.element != null;
                }
            },
        });
    };
    utils.inherit(Popover, StyledElements.StyledElement);

    Popover.prototype.bind = function bind(element, mode) {
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
    };

    Popover.prototype.toggle = function toggle(refElement) {
        if (this.visible) {
            return this.hide();
        } else {
            return this.show(refElement);
        }
    };

    Popover.prototype.show = function show(refElement) {
        return _show.call(this, refElement);
    };

    var _hide = function _hide() {
        var priv = privates.get(this);
        if (priv.element != null && !priv.element.classList.contains('in')) {
            priv.element.remove();
            priv.element = null;
            if ('Wirecloud' in window) {
                Wirecloud.UserInterfaceManager._unregisterPopup(this);
            }
            priv.baseelement.removeEventListener('click', priv.disableCallback, true);
            this.dispatchEvent('hide');
        }
    };

    Popover.prototype.hide = function hide() {
        var force;
        if (!this.visible) {
            return this;
        }

        var priv = privates.get(this);
        force = !priv.element.classList.contains('in') || getComputedStyle(priv.element).getPropertyValue('opacity') === "0";
        priv.element.classList.remove('in');
        if (force) {
            _hide.call(this);
        }

        return this;
    };

    StyledElements.Popover = Popover;

})(StyledElements.Utils);
