/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    /**
     *
     */
    var PopupMenu = function PopupMenu(options) {
        StyledElements.PopupMenuBase.call(this, options);

        this._disableCallback = EzWebExt.bind(function (e) {
            var boundingBox = this.wrapperElement.getBoundingClientRect();

            if (e.clientX < boundingBox.left || e.clientX > boundingBox.right || e.clientY < boundingBox.top || e.clientY > boundingBox.bottom) {
                setTimeout(this.hide.bind(this), 0);
            }
        }, this);
    };
    PopupMenu.prototype = new StyledElements.PopupMenuBase({extending: true});

    PopupMenu.prototype.show = function show(refPosition) {
        document.addEventListener("click", this._disableCallback, true);
        document.addEventListener("contextmenu", this._disableCallback, true);

        StyledElements.PopupMenuBase.prototype.show.call(this, refPosition);
    };

    PopupMenu.prototype.hide = function hide() {
        StyledElements.PopupMenuBase.prototype.hide.call(this);

        document.removeEventListener("click", this._disableCallback, true);
        document.removeEventListener("contextmenu", this._disableCallback, true);
    };

    PopupMenu.prototype.destroy = function destroy() {
        this._disableCallback = null;

        StyledElements.PopupMenuBase.prototype.destroy.call(this);
    };

    StyledElements.PopupMenu = PopupMenu;
})();
