/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    /**
     *
     */
    var MenuItem = function MenuItem(text, handler, context) {
        StyledElements.StyledElement.call(this, ['click', 'mouseover', 'mouseout']);

        this.wrapperElement = document.createElement("div");
        EzWebExt.addClassName(this.wrapperElement, "menu_item");

        var span = document.createElement("span");
        span.appendChild(document.createTextNode(text));
        this.wrapperElement.appendChild(span);

        this.run = handler;
        this.context = context;

        // Internal events
        this._mouseoverEventHandler = EzWebExt.bind(function (event) {
            if (this.enabled) {
                EzWebExt.addClassName(this.wrapperElement, "hovered");
                this.events.mouseover.dispatch(this);
            }
        }, this);
        EzWebExt.addEventListener(this.wrapperElement, "mouseover", this._mouseoverEventHandler, false);
        this._mouseoutEventHandler = EzWebExt.bind(function (event) {
            if (this.enabled) {
                EzWebExt.removeClassName(this.wrapperElement, "hovered");
                this.events.mouseout.dispatch(this);
            }
        }, this);
        EzWebExt.addEventListener(this.wrapperElement, "mouseout", this._mouseoutEventHandler, false);

        this._clickHandler = EzWebExt.bind(function (event) {
            event.stopPropagation();
            if (this.enabled) {
                EzWebExt.removeClassName(this.wrapperElement, "hovered");
                this.events.mouseout.dispatch(this);
                this.events.click.dispatch(this);
            }
        }, this);
        EzWebExt.addEventListener(this.wrapperElement, "click", this._clickHandler, true);
    };
    MenuItem.prototype = new StyledElements.StyledElement();

    MenuItem.prototype.destroy = function destroy() {
        if (EzWebExt.XML.isElement(this.wrapperElement.parentNode)) {
            EzWebExt.removeFromParent(this.wrapperElement);
        }
        EzWebExt.removeEventListener(this.wrapperElement, "mouseover", this._mouseoverEventHandler, false);
        EzWebExt.removeEventListener(this.wrapperElement, "mouseout", this._mouseoutEventHandler, false);
        EzWebExt.removeEventListener(this.wrapperElement, "click", this._clickHandler, true);

        this._mouseoverEventHandler = null;
        this._mouseoutEventHandler = null;
        this._clickHandler = null;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.MenuItem = MenuItem;

})();
