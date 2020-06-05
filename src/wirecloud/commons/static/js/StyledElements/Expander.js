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

/* globals CSSPrimitiveValue, StyledElements */


(function (utils) {

    "use strict";

    var Expander = function Expander(options) {
        var defaultOptions = {
            'buttonFloat': 'left',
            'class': '',
            'expandButton': true,
            'listenOnTitle': false,
            'state': 'default',
            'title': null
        };
        options = utils.merge(defaultOptions, options);
        if (!options.expandButton && !options.listenOnTitle) {
            throw new TypeError();
        }

        StyledElements.StyledElement.call(this, ['expandChange']);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = utils.appendWord("panel se-expander", options.class);

        if (options.state != null && options.state.trim() !== "") {
            this.addClassName('panel-' + options.state);
        }

        var header = document.createElement('div');
        header.className = 'panel-heading';
        this.wrapperElement.appendChild(header);

        this.toggleButton = null;
        if (options.expandButton) {
            this.toggleButton = new StyledElements.ToggleButton({
                class: 'icon-expand',
                iconClass: 'fas',
                plain: true
            });
            this.toggleButton.insertInto(header);
        }

        this.titleContainer = new StyledElements.Container({'class': 'title'});
        this.titleContainer.insertInto(header);
        if (options.title) {
            this.titleContainer.appendChild(document.createTextNode(options.title));
        }

        this.contentContainer = new StyledElements.Container({'class': 'panel-body'});
        this.contentContainer.insertInto(this.wrapperElement);

        // Internal event handlers
        var callback = function () {
            this.setExpanded(!this.isExpanded());
        }.bind(this);

        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', callback);
        }
        if (options.listenOnTitle) {
            header.style.cursor = "pointer";
            header.addEventListener('click', callback, false);
        }
    };
    utils.inherit(Expander, StyledElements.StyledElement);

    Expander.prototype.repaint = function repaint(temporal) {
        var height, computedStyle;

        if (this.isExpanded()) {

            height = this.wrapperElement.clientHeight;
            if (height == null) {
                return; // nothing to do
            }

            computedStyle = document.defaultView.getComputedStyle(this.titleContainer.wrapperElement, null);

            height -= this.titleContainer.wrapperElement.offsetHeight;
            height -= computedStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);

            computedStyle = document.defaultView.getComputedStyle(this.contentContainer.wrapperElement, null);
            height -= computedStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('border-bottom-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);

            if (height < 0) {
                height = 0;
            }

            this.contentContainer.wrapperElement.style.height = height + 'px';
            this.contentContainer.repaint(temporal);
        }
    };

    Expander.prototype.isExpanded = function isExpanded() {
        return this.hasClassName('expanded');
    };

    Expander.prototype.setExpanded = function setExpanded(expanded) {
        // Force boolean value
        expanded = !!expanded;

        if (this.isExpanded() === expanded) {
            return;
        }

        if (expanded) {
            this.addClassName('expanded');
        } else {
            this.removeClassName('expanded');
            this.contentContainer.wrapperElement.style.height = '';
        }
        if (this.toggleButton) {
            this.toggleButton.active = expanded;
        }

        this.dispatchEvent('expandChange', expanded);
    };

    Expander.prototype.getTitleContainer = function getTitleContainer() {
        return this.titleContainer;
    };

    Expander.prototype.appendChild = function appendChild(element) {
        this.contentContainer.appendChild(element);
    };

    Expander.prototype.removeChild = function removeChild(element) {
        this.contentContainer.removeChild(element);
    };

    Expander.prototype.clear = function clear() {
        this.contentContainer.clear();
    };

    StyledElements.Expander = Expander;

})(StyledElements.Utils);
