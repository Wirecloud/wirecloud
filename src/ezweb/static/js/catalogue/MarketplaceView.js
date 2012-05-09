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
    this.appendChild(this.alternatives);

    this.viewsByName = {
        'cat-local': this.alternatives.createAlternative({alternative_constructor: CatalogueView, containerOptions: {catalogue: this}})
    };

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
