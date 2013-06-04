/*global Constants, EzWebExt, gettext, LayoutManagerFactory, LogManagerFactory, Wirecloud*/

(function () {

    "use strict";

    /**
     * Specific class for publish windows
     */
    var PublishResourceWindowMenu = function PublishResourceWindowMenu(resource, origin_market) {

        this.resource = resource;

        var fields = this._loadAvailableMarkets(origin_market);
        Wirecloud.ui.FormWindowMenu.call(this, fields, gettext('Publish Application'), 'publish_resource', {legend: false});

        // fill a warning message
        var warning = document.createElement('div');
        warning.addClassName('alert');
        warning.innerHTML = gettext("<strong>Warning!</strong> Configured and stored data in your workspace (properties and preferences except passwords) will be shared by default!");
        this.windowContent.insertBefore(warning, this.form.wrapperElement);
    };
    PublishResourceWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    PublishResourceWindowMenu.prototype._loadAvailableMarkets = function _loadAvailableMarkets(origin_market) {
        // Take available marketplaces from the instance of marketplace view
        var views = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName;
        var key, marketInfo = [];

        for (key in views) {
            if (key !== origin_market) {
                marketInfo = marketInfo.concat(views[key].getPublishEndpoint());
            }
        }
        return marketInfo;
    };

    PublishResourceWindowMenu.prototype.show = function show(parentWindow) {
        Wirecloud.ui.FormWindowMenu.prototype.show.call(this, parentWindow);
    };

    PublishResourceWindowMenu.prototype.setFocus = function setFocus() {
        this.form.fieldInterfaces.name.focus();
    };

    PublishResourceWindowMenu.prototype._createMarketplaceData = function _createMarketplaceData(data) {
        var views = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName;
        var key, marketplaces = [];
        for (key in views) {
            if (data[key] === true) {
                marketplaces = marketplaces.concat(views[key].getPublishData(data));
            }
        }
        return marketplaces;
    };

    PublishResourceWindowMenu.prototype.executeOperation = function executeOperation(data) {
        var url = Wirecloud.URLs.PUBLISH_ON_OTHER_MARKETPLACE;

        data.marketplaces = this._createMarketplaceData(data);
        data.resource = this.resource.getURI();

        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Publishing resource"), 3);
        layoutManager.logSubTask(gettext('Publishing resource'));

        Wirecloud.io.makeRequest(url, {
            method: 'POST',
            contentType: 'application/json',
            postBody: Object.toJSON(data),
            onSuccess: function () {
                layoutManager.logSubTask(gettext('Resource published successfully'));
                layoutManager.getInstance().logStep('');
            },
            onFailure: function (transport) {
                var msg = LogManagerFactory.getInstance().formatError(gettext("Error publishing resource: %(errorMsg)s."), transport, null);
                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                LogManagerFactory.getInstance().log(msg);
            },
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    Wirecloud.ui.PublishResourceWindowMenu = PublishResourceWindowMenu;
})();
