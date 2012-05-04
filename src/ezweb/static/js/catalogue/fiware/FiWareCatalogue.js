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

var example_data = {"resources": 
[{"vendor": "Morfeo", 
"name": "Amazon", 
"versions": [{ 
"shortDescription": "Busqueda de productos en Amazon", 
"longDescription": "", 
"created":"2012-03-01",
"modified":"2012-04-04",
"uriImage": "http://demo.ezweb.morfeo-project.org/repository/amazon/amazon.jpg", 
"version": "1.0", 
"uriTemplate": "http://demo.ezweb.morfeo-project.com/repository/amazon/amazonGadget.xml",
"legal":[{	"type":"TermsAndConditions",
			"label": "Basic Legal Profile",
			"description":"Terms and conditions for the use",
			"clauses":[{"name":"Warranty",
						"text":"We make no warranty of any kind, either express or implied"},
						{"name":"Privacy and Data Protection",
						 "text":"Your personal information and utilization data and \nmay share such data with third party service providers"}]}],
"pricing":[{"label":"Price plan",
			"description":"this is an example price plan",
			"priceComponents":[{"title":"price component",
								"description":"example price component",
								"currency":"euros",
								"value":"10",
								"unit":"per month"},
								{"title":"price component 2",
								"description":"example price component 2",
								"currency":"euros",
								"value":"5",
								"unit":"per month"}],
	
		
			"taxes":[			{"title":"tax",
								"description":"example tax over ths final price",
								"currency":"euros",
								"value":"5",
								"unit":"per 10 downloads"}		 
					]}],
"sla":[{	"type":"GuaranteedState",
			"name":"Number of service calls",
			"description":"",
			"slaExpresions":[{"name":"Number of calls limit",
							  "description":"For demonstration purposes the number of calls to the services is restricted in order to avoid overloading the small demonstration installation",
							  "variables":[{"label":"Number of calls",
											"type":"QuantitativeValue",
											"value":"1000",
											"unit":"per day"},
										{	"label":"Number of calls",
											"type":"QuantitativeValue",
											"value":"500",
											"unit":"per day"}]}],

			"obligatedParty":"provider"}]}]
}, 

{"vendor": "Morfeo", 
"name": "Map Viewer", 
"versions": [{
"shortDescription": "Este gadget presenta la ubicacion en el plano de una determinada direccion o coordenadas UTM. Si se le pasa la precision, dibuja un circulo con el area seleccionada", 
"longDescription":"",
"created":"2012-03-01",
"modified":"2012-04-04",
"uriImage": "http://demo.ezweb.morfeo-project.org/repository/localizador/google_maps.jpg", 
"version": "1.2", 
"uriTemplate": "http://demo.ezweb.morfeo-project.com/repository/localizador/localizadorPequeno1.2.xml",
"legal":[],
"sla":[],
"pricing":[]}]}]};

var example2 = {"resources": [
{"vendor":"Morfeo","type":"gadget","name":"Amazon","versions":[{"votes":{"user_vote":0,"popularity":"0","votes_number":0},"displayName":"Amazon","description":"Busqueda de productos en Amazon","tags":[],"author":"jmartin","uriImage":"http://demo.ezweb.morfeo-project.org/repository/amazon/amazon.jpg","capabilities":[],"uriWiki":"http://trac.morfeo-project.org/trac/ezwebplatform/wiki/Amazon","ieCompatible":false,"added_by_user":false,"version":"1.0","id":1,"mail":"jjmr@tid.es","slots":[{"friendcode":"keyword"}],"events":[],"uriTemplate":"http://demo.ezweb.morfeo-project.com/repository/amazon/amazonGadget.xml"}]}
]};

var FiWareCatalogue = function (catalogue) {
	this.catalogue = catalogue;
};

FiWareCatalogue.prototype = new StyledElements.Alternative();

FiWareCatalogue.prototype._onSearchSuccess = function(transport){
	var raw_data;
	raw_data = JSON.parse(transport.responseText);
	this.callback(raw_data);
}

FiWareCatalogue.prototype.search = function (callback, options) {
	var url;

	if (options.search_criteria == '' && this.catalogue.getCurrentStore() == 'All stores'){
		url = 'http://localhost:8000/marketAdaptor/resources';
	}else if (options.search_criteria != '' && this.catalogue.getCurrentStore() == 'All stores'){
		url = 'http://localhost:8000/marketAdaptor/search/' + options.search_criteria;
	}else if (options.search_criteria == '' && this.catalogue.getCurrentStore() != 'All stores'){
		url = 'http://localhost:8000/marketAdaptor/resources/' + this.catalogue.getCurrentStore();
	}else{
		url = 'http://localhost:8000/marketAdaptor/search/' + this.catalogue.getCurrentStore() + '/' + options.search_criteria;
	}	

	context ={
		'callback':callback
	};


	Wirecloud.io.makeRequest(url, {
        method: 'GET',
        onSuccess: this._onSearchSuccess.bind(context)
    });
};

FiWareCatalogue.prototype.delete = function (options) {
	var url;

	url = 'http://localhost:8000/marketAdaptor/' + options.store + '/' + options.name;

	LayoutManagerFactory.getInstance()._startComplexTask(gettext("Deleting resource from  marketplace"), 1);
    LayoutManagerFactory.getInstance().logSubTask(gettext('Deleting resource from marketplace'));

	Wirecloud.io.makeRequest(url, {
        method: 'DELETE',
        onSuccess: function (transport) {
            LayoutManagerFactory.getInstance().logSubTask(gettext('Resource deleted successfully'));
            LayoutManagerFactory.getInstance().logStep('');
			this.catalogue.refresh_search_results();
        }.bind(this),
		onFailure: function (transport) {
            var msg = LogManagerFactory.getInstance().formatError(gettext("Error deleting resource: %(errorMsg)s."), transport);
            LogManagerFactory.getInstance().log(msg);
            LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            LayoutManagerFactory.getInstance().log(msg);
        },
		onComplete: function () {
            LayoutManagerFactory.getInstance()._notifyPlatformReady();
			this.catalogue.home();
        }.bind(this)
    });
}

FiWareCatalogue.prototype.getStores = function(callback){
	var url;
	url='http://localhost:8000/marketAdaptor/stores'

	context ={
		'callback':callback
	};

	Wirecloud.io.makeRequest(url, {
        method: 'GET',
		onSuccess: this._onSearchSuccess.bind(context)
	});

};

FiWareCatalogue.prototype.delete_store = function (store) {
	var url = 'http://localhost:8000/marketAdaptor/stores/' + store;

	LayoutManagerFactory.getInstance()._startComplexTask(gettext("Deleting store from  marketplace"), 1);
    LayoutManagerFactory.getInstance().logSubTask(gettext('Deleting store from marketplace'));

	Wirecloud.io.makeRequest(url, {
		method: 'DELETE',
		onSuccess: function (transport) {
            LayoutManagerFactory.getInstance().logSubTask(gettext('Store deleted successfully'));
            LayoutManagerFactory.getInstance().logStep('');
        },
		onFailure: function (transport) {
            var msg = LogManagerFactory.getInstance().formatError(gettext("Error deleting store: %(errorMsg)s."), transport);
            LogManagerFactory.getInstance().log(msg);
            LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            LayoutManagerFactory.getInstance().log(msg);
        },
		onComplete: function () {
            LayoutManagerFactory.getInstance()._notifyPlatformReady();
        }
	});
};

FiWareCatalogue.prototype.add_store = function (store, store_uri,callback) {
	var url;
	url = 'http://localhost:8000/marketAdaptor/stores/' + store;

	LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding store to  marketplace"), 1);
    LayoutManagerFactory.getInstance().logSubTask(gettext('Adding store to marketplace'));

	Wirecloud.io.makeRequest(url, {
		method: 'POST',
		parameters: {'uri': store_uri},

		onSuccess: function (transport) {
            LayoutManagerFactory.getInstance().logSubTask(gettext('Store added successfully'));
            LayoutManagerFactory.getInstance().logStep('');
			callback();
        },
		onFailure: function (transport) {
            var msg = LogManagerFactory.getInstance().formatError(gettext("Error adding store: %(errorMsg)s."), transport);
            LogManagerFactory.getInstance().log(msg);
            LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            LayoutManagerFactory.getInstance().log(msg);
        },
		onComplete: function () {
            LayoutManagerFactory.getInstance()._notifyPlatformReady();
        }
	});

};
