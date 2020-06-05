/* globals StyledElements */


(function () {

    "use strict";

    /**
     *
     */
    StyledElements.DynamicMenuItems = function DynamicMenuItems(build) {
        if (build != null) {
            this.build = build;
        }
    };

    StyledElements.DynamicMenuItems.prototype.build = function build() {
        return [];
    };

})();
