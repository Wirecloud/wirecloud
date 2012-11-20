/*global gettext, LogManagerFactory, ShowcaseFactory, Widget, Wirecloud*/

(function () {

    "use strict";

    var processWidget = function processWidget(widget_data) {
        var widget, widgetId, widgetFullId;

        widget = new Widget(widget_data, null);
        widgetId = widget.getVendor() + '/' + widget.getName();
        widgetFullId = widget.getId();

        if (this.widgetVersions[widgetId] === undefined) {
            this.widgetVersions[widgetId] = [];
        }
        this.widgetVersions[widgetId].push(widget);

        // Insert widget object in showcase object model
        this.widgets[widgetFullId] = widget;
    };

    var LocalCatalogue = new Wirecloud.WirecloudCatalogue({name: 'local'});

    LocalCatalogue.addResourceFromURL = function addResourceFromURL(url, options) {
        if (typeof options != 'object') {
            options = {};
        }

        Wirecloud.io.makeRequest(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION, {
            method: 'POST',
            parameters: {'template_uri': url, packaged: !!options.packaged},
            onSuccess: function (transport) {
                var resource_data = JSON.parse(transport.responseText);
                switch (resource_data.type) {
                case "operator":
                    Wirecloud.wiring.OperatorFactory.addOperator(resource_data);
                    break;
                case "widget":
                    processWidget.call(ShowcaseFactory.getInstance(), resource_data);
                    break;
                case "mashup":
                    break;
                }

                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            }.bind(this),
            onFailure: function (transport) {
                var msg = LogManagerFactory.getInstance().formatError(gettext("Error adding resource from URL: %(errorMsg)s."), transport);
                LogManagerFactory.getInstance().log(msg);

                if (typeof options.onFailure === 'function') {
                    options.onFailure(msg);
                }
            },
            onComplete: function () {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    LocalCatalogue.resourceExists = function resourceExists(resource) {
        var id, widget;

        id = [resource.getVendor(), resource.getName(), resource.getVersion().text].join('/');

        widget = ShowcaseFactory.getInstance().getWidget('/widgets/' + id);
        return widget || id in Wirecloud.wiring.OperatorFactory.getAvailableOperators();
    };

    Wirecloud.LocalCatalogue = LocalCatalogue;
})();
