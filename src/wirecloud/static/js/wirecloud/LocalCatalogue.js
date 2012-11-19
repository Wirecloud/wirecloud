/*global ShowcaseFactory, Wirecloud*/

(function () {

    "use strict";

    var LocalCatalogue = {};

    LocalCatalogue.resourceExists = function resourceExists(resource) {
        var id, widget;

        id = [resource.getVendor(), resource.getName(), resource.getVersion().text].join('/');

        widget = ShowcaseFactory.getInstance().getWidget('/widgets/' + id);
        return widget || id in Wirecloud.wiring.OperatorFactory.getAvailableOperators();
    };

    Wirecloud.LocalCatalogue = LocalCatalogue;
})();
