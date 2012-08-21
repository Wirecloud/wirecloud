/*globals EzWebExt, StyledElements */

(function () {

    "use strict";

    var Expander = function Expander(options) {
        var defaultOptions = {
            'class': '',
            'listenOnTitle': false,
            'buttonFloat': 'left',
            'title': null
        };
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledElement.call(this, ['expandChange']);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = EzWebExt.appendWord(options['class'], "styled_expander");

        var header = document.createElement('div');
        this.wrapperElement.appendChild(header);

        this.toggleButton = null;
        if (!options.listenOnTitle) {
            this.toggleButton = new StyledElements.ToggleButton({
                'text': '+',
                'checkedText': '-',
                'class': 'expander_button'
            });
            this.toggleButton.insertInto(header);
            if ('cssFloat' in this.toggleButton.wrapperElement.style) {
                this.toggleButton.wrapperElement.style.cssFloat = options.buttonFloat;
            } else {
                this.toggleButton.wrapperElement.style.styleFloat = options.buttonFloat;
            }
        }

        this.titleContainer = new StyledElements.Container({'class': 'title'});
        this.titleContainer.insertInto(header);
        if (options.title) {
            this.titleContainer.appendChild(document.createTextNode(options.title));
        }
        if (options.listenOnTitle) {
            this.titleContainer.wrapperElement.style.cursor = "pointer";
        }

        this.contentContainer = new StyledElements.Container({'class': 'contents'});
        this.contentContainer.insertInto(this.wrapperElement);

        // Internal event handlers
        var callback = EzWebExt.bind(function () {
            this.setExpanded(!this.isExpanded());
        }, this);

        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', callback);
        } else {
            EzWebExt.addEventListener(this.titleContainer.wrapperElement, 'click', callback, false);
        }
    };
    Expander.prototype = new StyledElements.StyledElement();

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
        if (this.isExpanded() == expanded)
            return;

        if (expanded) {
            this.addClassName('expanded');
        } else {
            this.removeClassName('expanded');
            this.contentContainer.wrapperElement.style.height = '';
        }
        if (this.toggleButton) {
            this.toggleButton.setChecked(expanded);
        }

        this.events.expandChange.dispatch(this, expanded);
    };

    Expander.prototype.getTitleContainer = function getTitleContainer() {
        return this.titleContainer;
    };

    Expander.prototype.appendChild = function appendChild(element) {
        this.contentContainer.appendChild(element);
    };

    Expander.prototype.clear = function clear() {
        this.contentContainer.clear();
    };

    StyledElements.Expander = Expander;
})();
