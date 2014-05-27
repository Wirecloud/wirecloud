(function () {

    "use strict";

    /**
     * @experimental
     *
     */
    var Separator = function Separator() {
        StyledElements.StyledElement.call(this, []);

        this.wrapperElement = document.createElement("hr");
    };
    Separator.prototype = new StyledElements.StyledElement();

    Separator.prototype.destroy = function destroy() {
        if (Wirecloud.Utils.XML.isElement(this.wrapperElement.parentNode)) {
            Wirecloud.Utils.removeFromParent(this.wrapperElement);
        }

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.Separator = Separator;

})();
