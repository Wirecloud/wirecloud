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

    var builder = new StyledElements.GUIBuilder();
    var template = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><div class="tooltip fade" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"><t:content/></div></div></s:styledgui>';

    var setPosition = function setPosition(refPosition, position) {
        this.element.classList.remove('top', 'right', 'bottom', 'left');

        switch (position) {
        case 'top':
            this.element.classList.add('top');
            this.element.style.left = (refPosition.left + (refPosition.width - this.element.offsetWidth) / 2) + "px";
            this.element.style.top = (refPosition.top - this.element.offsetHeight) + "px";
            break;
        case 'right':
            this.element.classList.add('right');
            this.element.style.left = refPosition.right + "px";
            this.element.style.top = (refPosition.top + (refPosition.height - this.element.offsetHeight) / 2) + "px";
            break;
        case 'bottom':
            this.element.classList.add('bottom');
            this.element.style.left = (refPosition.left + (refPosition.width - this.element.offsetWidth) / 2) + "px";
            this.element.style.top = refPosition.bottom + "px";
            break;
        case 'left':
            this.element.classList.add('left');
            this.element.style.left = (refPosition.left - this.element.offsetWidth) + "px";
            this.element.style.top = (refPosition.top + (refPosition.height - this.element.offsetHeight) / 2) + "px";
            break;
        }
    };

    var standsOut = function standsOut() {
        var parent_box = this.element.parentElement.getBoundingClientRect();
        var element_box = this.element.getBoundingClientRect();

        var visible_width = element_box.width - Math.max(element_box.right - parent_box.right, 0) - Math.max(parent_box.left - element_box.left, 0);
        var visible_height = element_box.height - Math.max(element_box.bottom - parent_box.bottom, 0) - Math.max(parent_box.top - element_box.top, 0);
        var element_area = element_box.width * element_box.height;
        var visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    var fixPosition = function fixPosition(refPosition, weights, positions) {
        var best_weight = Math.min.apply(Math, weights);
        var index = weights.indexOf(best_weight);
        var position = positions[index];

        setPosition.call(this, refPosition, position);

        var parent_box = this.element.parentElement.getBoundingClientRect();
        var element_box = this.element.getBoundingClientRect();

        if (element_box.bottom > parent_box.bottom) {
            this.element.style.top = "";
            this.element.style.bottom = "10px";
            element_box = this.element.getBoundingClientRect();
        }

        if (element_box.top < parent_box.top) {
            this.element.style.top = "10px";
        }
    };

    var searchBestPosition = function searchBestPosition(refPosition, positions) {
        var i = 0, weights = [];

        do {
            setPosition.call(this, refPosition, positions[i]);
            weights.push(standsOut.call(this));
            i += 1;
        } while (weights[i - 1] > 0 && i < positions.length);

        if (weights[i - 1] > 0) {
            fixPosition.call(this, refPosition, weights, positions);
        }
    };

    var _show = function _show(refPosition) {

        if ('Wirecloud' in window) {
            Wirecloud.UserInterfaceManager._registerTooltip(this);
        }

        if (this.visible) {
            this.element.classList.add('in');
            this.repaint();
            return;
        }

        if ('getBoundingClientRect' in refPosition) {
            refPosition = refPosition.getBoundingClientRect();
        }

        this.element = builder.parse(template, {
            content: this.options.content
        }).elements[0];
        this.element.addEventListener('transitionend', _hide.bind(this));

        var baseelement = utils.getFullscreenElement() || document.body;
        baseelement.appendChild(this.element);

        searchBestPosition.call(this, refPosition, this.options.placement);
        this.element.classList.add('in');

        return this;
    };

    var Tooltip = function Tooltip(options) {
        var defaultOptions = {
            'content': '',
            'class': '',
            'placement': ['right', 'bottom', 'left', 'top']
        };
        Object.defineProperty(this, 'options', {value: utils.merge(defaultOptions, options)});

        StyledElements.StyledElement.call(this, []);

        Object.defineProperties(this, {
            element: {value: null, writable: true},
            visible: {
                get: function () {
                    return this.element != null;
                }
            }
        });
    };
    utils.inherit(Tooltip, StyledElements.StyledElement);

    Tooltip.prototype.destroy = function destroy() {
        this.hide();
    };

    Tooltip.prototype.bind = function bind(element) {
        element.addEventListener('focus', this.show.bind(this, element), false);
        element.addEventListener('blur', this.hide.bind(this), false);
        element.addEventListener('mouseenter', this.show.bind(this, element), false);
        element.addEventListener('mouseleave', this.hide.bind(this), false);
        element.addEventListener('click', this.hide.bind(this), false);
    };

    Tooltip.prototype.toggle = function toggle(refElement) {
        if (this.visible) {
            return this.hide();
        } else {
            return _show.call(this, refElement);
        }
    };

    Tooltip.prototype.show = function show(refElement) {
        return _show.call(this, refElement);
    };

    var _hide = function _hide() {
        if (this.element != null && !this.element.classList.contains('in')) {
            this.element.remove();
            this.element = null;
            if ('Wirecloud' in window) {
                Wirecloud.UserInterfaceManager._unregisterTooltip(this);
            }
        }
    };

    Tooltip.prototype.hide = function hide() {
        var force;

        if (!this.visible) {
            return this;
        }

        force = !this.element.classList.contains('in') || getComputedStyle(this.element).getPropertyValue('opacity') === "0";
        this.element.classList.remove('in');
        if (force) {
            _hide.call(this);
        }

        return this;
    };

    StyledElements.Tooltip = Tooltip;

})(StyledElements.Utils);
