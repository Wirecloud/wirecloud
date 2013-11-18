/*global StyledElements, Wirecloud*/

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
        options = Wirecloud.Utils.merge(defaultOptions, options);

        StyledElements.StyledElement.call(this, []);

        this.wrapperElement = document.createElement("span");
        this.wrapperElement.className = Wirecloud.Utils.appendWord(options['class'], "add-on");

        if (options.title) {
            this.setTitle(options.title);
        }

        if (options.text) {
            this.setLabel(options.text);
        }

        /* Event handlers */
        this._clickCallback = clickCallback.bind(this);

        this.wrapperElement.addEventListener('mousedown', Wirecloud.Utils.stopPropagationListener, true);
        this.wrapperElement.addEventListener('click', this._clickCallback, true);
    };
    Addon.prototype = new StyledElements.Container();

    Addon.prototype.setLabel = function setLabel(label) {
        this.clear();
        this.wrapperElement.textContent = label;
    };

    Addon.prototype.setTitle = function setTitle(title) {
        this.wrapperElement.setAttribute('title', title);
    };

    Addon.prototype.assignInput = function assignInput(input) {
        this._related_input = input;
    };

    Addon.prototype.destroy = function destroy() {

        this.wrapperElement.removeEventListener('mousedown', Wirecloud.Utils.stopPropagationListener, true);
        this.wrapperElement.removeEventListener('click', this._clickCallback, true);

        delete this.wrapperElement;
        delete this._clickCallback;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.Addon = Addon;
})();
