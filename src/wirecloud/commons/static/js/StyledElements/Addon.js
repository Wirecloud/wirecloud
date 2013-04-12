/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    var clickCallback = function clickCallback(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this._related_input) {
            this._related_input.focus();
        }
    };

    var Addon = function Addon(options) {
        var button, defaultOptions = {
            'text': null,
            'title': '',
            'class': ''
        };
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledElement.call(this, []);

        this.wrapperElement = document.createElement("span");
        this.wrapperElement.className = EzWebExt.appendWord(options['class'], "add-on");

        if (options.title) {
            this.setTitle(options.title);
        }

        /* Event handlers */
        this._clickCallback = clickCallback.bind(this);

        EzWebExt.addEventListener(this.wrapperElement, 'mousedown', EzWebExt.stopPropagationListener, true);
        EzWebExt.addEventListener(this.wrapperElement, 'click', this._clickCallback, true);
    };
    Addon.prototype = new StyledElements.Container();

    Addon.prototype.setTitle = function setTitle(title) {
        this.wrapperElement.setAttribute('title', title);
    };

    Addon.prototype.assignInput = function assignInput(input) {
        this._related_input = input;
    };

    Addon.prototype.destroy = function destroy() {

        this.wrapperElement.removeEventListener('mousedown', EzWebExt.stopPropagationListener, true);
        this.wrapperElement.removeEventListener('click', this._clickCallback, true);

        delete this.wrapperElement;
        delete this._clickCallback;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.Addon = Addon;
})();
