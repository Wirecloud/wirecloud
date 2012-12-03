/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    /**
     *
     */
    var PopupMenu = function PopupMenu(options) {
        StyledElements.PopupMenuBase.call(this, options);

        this._disableCallback = EzWebExt.bind(function (event) {
            event.stopPropagation();
            event.preventDefault();
            this.hide();
        }, this);

        this._disableLayer = document.createElement('div');
        this._disableLayer.className = 'disable-layer';
        EzWebExt.addEventListener(this._disableLayer, "click", this._disableCallback, false);
        EzWebExt.addEventListener(this._disableLayer, "contextmenu", this._disableCallback, false);
    };
    PopupMenu.prototype = new StyledElements.PopupMenuBase({extending: true});

    PopupMenu.prototype.show = function show(refPosition) {
        document.body.appendChild(this._disableLayer);

        StyledElements.PopupMenuBase.prototype.show.call(this, refPosition);
    };

    PopupMenu.prototype.hide = function hide() {
        StyledElements.PopupMenuBase.prototype.hide.call(this);

        if (EzWebExt.XML.isElement(this._disableLayer.parentNode)) {
            EzWebExt.removeFromParent(this._disableLayer);
        }
    };

    PopupMenu.prototype.destroy = function destroy() {
        EzWebExt.removeEventListener(this._disableLayer, "click", this._disableCallback, false);
        EzWebExt.removeEventListener(this._disableLayer, "contextmenu", this._disableCallback, false);
        this._disableCallback = null;

        StyledElements.PopupMenuBase.prototype.destroy.call(this);
    };

    StyledElements.PopupMenu = PopupMenu;
})();
