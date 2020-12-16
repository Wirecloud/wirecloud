/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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


(function (se, utils) {

    "use strict";

    const defaultOptions = {
        class: '',
        exclusive: true,
        full: true
    };

    se.Accordion = class Accordion extends se.StyledElement {

        constructor(options) {
            options = StyledElements.Utils.merge(defaultOptions, options);

            this.exclusive = options.exclusive;
            this.full = options.full;
            this.children = [];
            this.wrapperElement = document.createElement("div");
            this.wrapperElement.className = StyledElements.Utils.appendWord(options.class, "styled_accordion");
        }

        createContainer(options) {
            options = utils.merge({
                'listenOnTitle': true
            }, options);

            const expander = new StyledElements.Expander(options);
            expander.insertInto(this.wrapperElement);

            if (this.exclusive) {
                expander.addEventListener('expandChange', (expander, expanded) => {
                    if (expanded) {
                        const old_expander = this.currentContainer;
                        this.currentContainer = expander;

                        if (old_expander) {
                            old_expander.setExpanded(false);
                            old_expander.wrapperElement.style.height = '';
                        }
                    } else if (this.currentContainer === expander) {
                        expander.wrapperElement.style.height = '';
                        this.currentContainer = null;
                    }
                    this.repaint();
                });
            } else if (this.full) {
                expander.addEventListener('expandChange', (expanded) => {
                    this.repaint();
                });
            }

            this.children.push(expander);

            if (this.currentContainer == null) {
                expander.setExpanded(true);
            }

            return expander;
        }

        repaint(temporal) {
            let height = this._getUsableHeight();
            if (height == null || this.currentContainer == null) {
                return; // nothing to do
            }

            for (let i = 0; i < this.children.length; i += 1) {
                if (this.children[i] === this.currentContainer) {
                    continue;
                }

                const computedStyle = document.defaultView.getComputedStyle(this.currentContainer.wrapperElement, null);

                height -= this.children[i].wrapperElement.offsetHeight;
                height -= computedStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX);
                height -= computedStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);
            }

            const computedStyle = document.defaultView.getComputedStyle(this.currentContainer.wrapperElement, null);

            height -= computedStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('border-bottom-width').getFloatValue(CSSPrimitiveValue.CSS_PX);

            this.currentContainer.wrapperElement.style.height = height + 'px';
            this.currentContainer.repaint(temporal);
        }

        destroy() {
            this.children.forEach((child) => {child.destroy()});
            this.children = null;

            super.destroy();
        }

    }

})(StyledElements, StyledElements.Utils);
