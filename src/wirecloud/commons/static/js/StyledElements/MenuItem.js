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
        this._mouseoverEventHandler = function (event) {
            if (this.enabled) {
                EzWebExt.addClassName(this.wrapperElement, "hovered");
                this.events.mouseover.dispatch(this);
            }
        }.bind(this);
        this.wrapperElement.addEventListener("mouseover", this._mouseoverEventHandler, false);
        this._mouseoutEventHandler = function (event) {
            if (this.enabled) {
                EzWebExt.removeClassName(this.wrapperElement, "hovered");
                this.events.mouseout.dispatch(this);
            }
        }.bind(this);
        this.wrapperElement.addEventListener("mouseout", this._mouseoutEventHandler, false);

        this._clickHandler = function (event) {
            event.stopPropagation();
            if (this.enabled) {
                EzWebExt.removeClassName(this.wrapperElement, "hovered");
                this.events.mouseout.dispatch(this);
                this.events.click.dispatch(this);
            }
        }.bind(this);
        this.wrapperElement.addEventListener("click", this._clickHandler, true);
    };
    MenuItem.prototype = new StyledElements.StyledElement();

    MenuItem.prototype.destroy = function destroy() {
        if (EzWebExt.XML.isElement(this.wrapperElement.parentNode)) {
            EzWebExt.removeFromParent(this.wrapperElement);
        }
        this.wrapperElement.removeEventListener("mouseover", this._mouseoverEventHandler, false);
        this.wrapperElement.removeEventListener("mouseout", this._mouseoutEventHandler, false);
        this.wrapperElement.removeEventListener("click", this._clickHandler, true);

        this._mouseoverEventHandler = null;
        this._mouseoutEventHandler = null;
        this._clickHandler = null;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.MenuItem = MenuItem;

})();
