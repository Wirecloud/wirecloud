/*global gettext, LayoutManagerFactory, LogManagerFactory, OpManagerFactory, ShowcaseFactory, Widget, Wirecloud*/

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

    var uninstallSuccessCallback = function uninstallSuccessCallback(transport) {
        var layoutManager, result, opManager, i, widgetId;

        if (this.resource.getType() === 'widget') {

            layoutManager = LayoutManagerFactory.getInstance();
            result = JSON.parse(transport.responseText);

            layoutManager.logSubTask(gettext('Removing affected iWidgets'));
            opManager = OpManagerFactory.getInstance();
            for (i = 0; i < result.removedIWidgets.length; i += 1) {
                opManager.removeInstance(result.removedIWidgets[i], true);
            }

            layoutManager.logSubTask(gettext('Purging widget info'));
            ShowcaseFactory.getInstance().deleteWidget('/widgets/' + this.resource.getURI());
        }

        this.onSuccess();
    };

    var uninstallErrorCallback = function uninstallErrorCallback(transport, e) {
        var msg, logManager;

        logManager = LogManagerFactory.getInstance();
        msg = logManager.formatError(gettext("Error deleting the Widget: %(errorMsg)s."), transport, e);

        logManager.log(msg);

        this.onError(msg);
    };

    LocalCatalogue.uninstallResource = function uninstallResource(resource, options) {
        var url, context;

        url = Wirecloud.URLs.LOCAL_RESOURCE_ENTRY.evaluate({
            vendor: resource.getVendor(),
            name: resource.getName(),
            version: resource.getVersion().text
        });

        context = {
            catalogue: this,
            resource: resource,
            onSuccess: options.onSuccess,
            onError: options.onFailure
        };

        // Send request to uninstall de widget
        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            onSuccess: uninstallSuccessCallback.bind(context),
            onFailure: uninstallErrorCallback.bind(context),
            onException: uninstallErrorCallback.bind(context),
            onComplete: options.onComplete
        });
    };

    LocalCatalogue.addResourceFromURL = function addResourceFromURL(url, options) {
        if (typeof options != 'object') {
            options = {};
        }

        Wirecloud.io.makeRequest(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION, {
            method: 'POST',
            parameters: {'template_uri': url, packaged: !!options.packaged, force_create: !!options.forceCreate},
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
