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

var MarketplaceView = function (id, options) {
    options.id = 'marketplace';
    StyledElements.Alternative.call(this, id, options);

    this.alternatives = new StyledElements.StyledAlternatives();
    this.alternatives.addEventListener('postTransition', function() {
        LayoutManagerFactory.getInstance().header.refresh();
    });
	this.market_manager = new MarketplaceManagement();
    this.appendChild(this.alternatives);
	this.generateViews();

    this.marketMenu = new StyledElements.PopupMenu();
    this.marketMenu.append(new Wirecloud.ui.MarketplaceViewMenuItems(this));
};

MarketplaceView.prototype = new StyledElements.Alternative();

MarketplaceView.prototype.view_name = 'marketplace';

MarketplaceView.prototype.getBreadcrum = function () {
    var breadcrum = [
        {
            'label': 'marketplace'
        },
        {
            'label': this.alternatives.getCurrentAlternative().getLabel(),
            'menu': this.marketMenu
        }
    ];

    if (typeof this.alternatives.getCurrentAlternative().getExtraBreadcrum === 'function') {
        breadcrum = breadcrum.concat(this.alternatives.getCurrentAlternative().getExtraBreadcrum());
    }

    return breadcrum;
};

MarketplaceView.prototype.refreshViewInfo = function() {
    this.market_manager.getMarkets(this.addViewInfo.bind(this));
};

MarketplaceView.prototype.addViewInfo = function(view_info) {
    var info,view_element;
	this.number_of_alternatives = 0;
    this.viewsByName = {};
    for(info in view_info){

		view_element = JSON.parse(view_info[info]);

        if(view_element.type === 'wirecloud'){
            this.viewsByName[info]= this.alternatives.createAlternative({alternative_constructor: CatalogueView, containerOptions: {catalogue: this, marketplace: info}})
            this.number_of_alternatives += 1;
        }else if (view_element.type === 'fiware'){
            this.viewsByName[info]=this.alternatives.createAlternative({alternative_constructor: FiWareCatalogueView, containerOptions: {catalogue: this, marketplace: info}})
			this.number_of_alternatives += 1;
        }
        
    }	
};

MarketplaceView.prototype.generateViews = function() {
    this.market_manager.getMarkets(this.addViewInfo.bind(this));
};
