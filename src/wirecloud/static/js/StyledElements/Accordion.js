/*globals EzWebExt, StyledElements */

(function () {

    "use strict";

    var Accordion = function Accordion(options) {
        var defaultOptions = {
            'class': '',
            'exclusive': true
        };
        options = EzWebExt.merge(defaultOptions, options);

        this.exclusive = options.exclusive;
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = EzWebExt.appendWord(options['class'], "styled_accordion");
    };
    Accordion.prototype = new StyledElements.StyledElement();

    Accordion.prototype.createContainer = function createContainer(options) {
        var defaultOptions = {
            'listenOnTitle': true
        };
        options = EzWebExt.merge(defaultOptions, options);
        var expander = new StyledElements.Expander(options);
        expander.insertInto(this.wrapperElement);

        if (this.exclusive) {
            expander.addEventListener('expandChange', EzWebExt.bind(function (expanded) {
                if (expanded) {
                    if (this.currentContainer) {
                        this.currentContainer.setExpanded(false);
                    }
                    this.currentContainer = expander;
                } else {
                    this.currentContainer = null;
                }
                this.repaint();
            }, this));
        }

        return expander;
    };

    Accordion.prototype.repaint = function repaint(temporal) {
        var height;

        if (!this.currentContainer) {
            return;
        }

        height = this._getUsableHeight();
        if (height == null) {
            return; // nothing to do
        }
    };

    StyledElements.Accordion = Accordion;
})();
