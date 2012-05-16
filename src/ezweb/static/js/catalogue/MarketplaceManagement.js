/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50 */
/*global gettext, StyledElements*/

var MarketplaceManagement = function() {

}

MarketplaceManagement.prototype = new StyledElements.Alternative();

MarketplaceManagement.prototype._onSearchSuccess = function(transport){
	var raw_data;
	raw_data = JSON.parse(transport.responseText);
	this.callback(raw_data);
}

MarketplaceManagement.prototype.getMarkets = function(callback) {
	var url;
	url='/wirecloud/markets'

	context ={
		'callback':callback
	};

	Wirecloud.io.makeRequest(url, {
        method: 'GET',
		onSuccess: this._onSearchSuccess.bind(context)
	});
};

MarketplaceManagement.prototype.deleteMarket = function(marketplace,callback){
	var url = '/wirecloud/markets/' + marketplace;

	LayoutManagerFactory.getInstance()._startComplexTask(gettext("Deleting marketplace"), 1);
    LayoutManagerFactory.getInstance().logSubTask(gettext('Deleting marketplace'));

	Wirecloud.io.makeRequest(url, {
		method: 'DELETE',
		onSuccess: function (transport) {
            LayoutManagerFactory.getInstance().logSubTask(gettext('Marketplace deleted successfully'));
            LayoutManagerFactory.getInstance().logStep('');
            callback();
        },
		onFailure: function (transport) {
            var msg = LogManagerFactory.getInstance().formatError(gettext("Error deleting marketplace: %(errorMsg)s."), transport);
            LogManagerFactory.getInstance().log(msg);
            LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            LayoutManagerFactory.getInstance().log(msg);
        },
		onComplete: function () {
            LayoutManagerFactory.getInstance()._notifyPlatformReady();
        }
	});
};

MarketplaceManagement.prototype.addMarket = function (market_info,callback) {
	var url;
	url = '/wirecloud/markets/';

	LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding marketplace"), 1);
    LayoutManagerFactory.getInstance().logSubTask(gettext('Adding marketplace'));

    Wirecloud.io.makeRequest(url, {
        method: 'POST',
        contentType:'application/json',
        postBody: JSON.stringify(market_info),

		onSuccess: function (transport) {
            LayoutManagerFactory.getInstance().logSubTask(gettext('Marketplace added successfully'));
            LayoutManagerFactory.getInstance().logStep('');
			callback();
        },
		onFailure: function (transport) {
            var msg = LogManagerFactory.getInstance().formatError(gettext("Error adding marketplace: %(errorMsg)s."), transport);
            LogManagerFactory.getInstance().log(msg);
            LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            LayoutManagerFactory.getInstance().log(msg);
        },
		onComplete: function () {
            LayoutManagerFactory.getInstance()._notifyPlatformReady();
        }
	});
};

MarketplaceManagement.prototype.getMarketTypes = function(callback){
    var url;
    url='/wirecloud/markets/types'

    context ={
        'callback':callback
    };

    Wirecloud.io.makeRequest(url, {
        method: 'GET',
        onSuccess: this._onSearchSuccess.bind(context)
    });
};
