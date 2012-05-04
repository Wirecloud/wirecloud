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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50, prototypejs: true */
/*global EzWebExt, gettext, StyledElements*/

var FiWareCataloguePublishView = function (id, options) {
    options.class = 'fiware_publish_view';
    this.catalogue = options.catalogue;
    StyledElements.Alternative.call(this, id, options);

    this.wrapperElement.innerHTML = $('fiware_catalogue_publish_interface').getTextContent();

    this.wrapperElement.getElementsByClassName('usdl_submit_form')[0].onsubmit = this._submit_usdl.bind(this);

    setTimeout(function () {
        EzWebExt.addEventListener(this.wrapperElement.getElementsByClassName('back_to_resource_list')[0], 'click', this.catalogue.home.bind(this.catalogue));
    }.bind(this), 0);
};
FiWareCataloguePublishView.prototype = new StyledElements.Alternative();

FiWareCataloguePublishView.prototype._submit_usdl = function(e){
	var store_name,url;

	e.stopPropagation();
	e.preventDefault();

	LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding resource to the marketplace"), 1);
    LayoutManagerFactory.getInstance().logSubTask(gettext('Sending usdl description to marketplace'));

	url = 'http://localhost:8000/marketAdaptor/' + this.catalogue.getCurrentStore();

	Wirecloud.io.makeRequest(url, {
        method: 'POST',
        parameters: {'url': $('usdl_url').value,
					 'name': $('service_name').value},
        onSuccess: function (transport) {
            LayoutManagerFactory.getInstance().logSubTask(gettext('Resource uploaded successfully'));
            LayoutManagerFactory.getInstance().logStep('');
			this.catalogue.refresh_search_results();
        }.bind(this),
        onFailure: function (transport) {
            var msg = LogManagerFactory.getInstance().formatError(gettext("Error uploading resource: %(errorMsg)s."), transport);
            LogManagerFactory.getInstance().log(msg);
            LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            LayoutManagerFactory.getInstance().log(msg);
        },
        onComplete: function () {
            LayoutManagerFactory.getInstance()._notifyPlatformReady();
			this.catalogue.home();
        }.bind(this)
    });
};


