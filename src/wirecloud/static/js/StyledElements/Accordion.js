/*globals EzWebExt, StyledElements */

(function () {

    "use strict";

    var Accordion = function Accordion(options) {
        var defaultOptions = {
            'class': '',
            'exclusive': true,
            'full': true
        };
        options = EzWebExt.merge(defaultOptions, options);

        this.exclusive = options.exclusive;
        this.full = options.full;
        this.children = [];
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = EzWebExt.appendWord(options['class'], "styled_accordion");
    };
    Accordion.prototype = new StyledElements.StyledElement();

    Accordion.prototype.createContainer = function createContainer(options) {
        var expander, defaultOptions = {
            'listenOnTitle': true
        };
        options = EzWebExt.merge(defaultOptions, options);
        expander = new StyledElements.Expander(options);
        expander.insertInto(this.wrapperElement);

        if (this.exclusive) {
            expander.addEventListener('expandChange', EzWebExt.bind(function (expander, expanded) {
                var old_expander;

                if (expanded) {
                    old_expander = this.currentContainer;
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
            }, this));
        } else if (this.full) {
            expander.addEventListener('expandChange', EzWebExt.bind(function (expanded) {
                this.repaint();
            }, this));
        }

        this.children.push(expander);

        if (this.currentContainer == null) {
            expander.setExpanded(true);
        }

        return expander;
    };

    Accordion.prototype.repaint = function repaint(temporal) {
        var height, computedStyle;

        height = this._getUsableHeight();
        if (height == null) {
            return; // nothing to do
        }

        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i] == this.currentContainer) {
                continue;
            }

            computedStyle = document.defaultView.getComputedStyle(this.currentContainer.wrapperElement, null);

            height -= this.children[i].wrapperElement.offsetHeight;
            height -= computedStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX);
            height -= computedStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);
        }

        computedStyle = document.defaultView.getComputedStyle(this.currentContainer.wrapperElement, null);

        height -= computedStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX);
        height -= computedStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);
        height -= computedStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX);
        height -= computedStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);
        height -= computedStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
        height -= computedStyle.getPropertyCSSValue('border-bottom-width').getFloatValue(CSSPrimitiveValue.CSS_PX);

        this.currentContainer.wrapperElement.style.height = height + 'px';
        this.currentContainer.repaint(temporal);
    };

    Accordion.prototype.destroy = function destroy() {
        var i;

        for (i = 0; i < this.children.length; i +=1) {
            this.children[i].destroy();
        }
        this.children = null;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.Accordion = Accordion;
})();
