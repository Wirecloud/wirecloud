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
/*global alert, CatalogueResource, CatalogueSearchView, CookieManager, gettext, LayoutManagerFactory, OpManagerFactory, PersistenceEngineFactory, ResourceDetailsView, ResourcePainter, ShowcaseFactory, StyledElements, URIs*/

var CatalogueView = function (id, options) {
    options.id = 'catalogue';
    StyledElements.Alternative.call(this, id, options);

    this.alternatives = new StyledElements.StyledAlternatives();
    this.appendChild(this.alternatives);

    this.viewsByName = {
        'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: {catalogue: this}}),
        'developer': this.alternatives.createAlternative(),
        'details': this.alternatives.createAlternative({alternative_constructor: ResourceDetailsView, containerOptions: {catalogue: this}})
    };

    this.view_all_template = new Template(URIs.GET_POST_RESOURCES + '/#{starting_page}/#{resources_per_page}');
    this.simple_search_template = new Template(URIs.GET_RESOURCES_SIMPLE_SEARCH + '/simple_or/#{starting_page}/#{resources_per_page}');

    this.resource_painter = new ResourcePainter(this, $('catalogue_resource_template').getTextContent(), this.wrapperElement.getElementsByClassName('resource_list')[0]);
};
CatalogueView.prototype = new StyledElements.Alternative();

CatalogueView.prototype.getLabel = function () {
    return gettext('local');
};

CatalogueView.prototype._onShow = function () {
};

CatalogueView.prototype._onSearchSuccess = function (transport) {
    var preferred_versions, i, data, key, raw_data, resources, resource;

    raw_data = JSON.parse(transport.responseText);

    if (raw_data.resources) {
        preferred_versions = CookieManager.readCookie('preferred_versions', true);
        if (preferred_versions === null) {
            preferred_versions = {};
        }

        resources = [];

        for (i = 0; i < raw_data.resources.length; i += 1) {
            resource = new CatalogueResource(raw_data.resources[i]);
            resources.push(resource);
            key = resource.getVendor() + '/' + resource.getName();
            if (key in preferred_versions) {
                resource.changeVersion(preferred_versions[key]);
            }
        }

        data = {
            'resources': resources,
            'preferred_versions': preferred_versions,
            'query_results_number': resources.length,
            'resources_per_page': 10,
            'current_page': 1
        };

        this.resource_painter.paint(data);
    }
};

CatalogueView.prototype.search = function (options) {
    var params, url, context;

    params = {
        'orderby': options.order_by,
        'search_criteria': options.search_criteria,
        'search_boolean': options.search_boolean,
        'scope': options.scope
    };

    context = {
        'resource_painter': this.resource_painter,
        'user_command_manager': this.user_command_manager
    };

    if (options.search_criteria.strip() === '') {
        url = this.view_all_template.evaluate({'starting_page': options.starting_page, 'resources_per_page': options.resources_per_page});
    } else {
        url = this.simple_search_template.evaluate({'starting_page': options.starting_page, 'resources_per_page': options.resources_per_page});
    }
    PersistenceEngineFactory.getInstance().send(url, {
        method: 'GET',
        parameters: params,
        onSuccess: this._onSearchSuccess.bind(context)
    });
};

CatalogueView.prototype.instanciate = function (resource) {
    //is mashup?
    if (resource.isMashup()) {
        LayoutManagerFactory.getInstance().showWindowMenu(
            "addMashup",
            function () {
                OpManagerFactory.getInstance().addMashupResource(this);
            }.bind(resource),
            function () {
                OpManagerFactory.getInstance().mergeMashupResource(this);
            }.bind(resource));

        return;
    }

    // Normal instantiation!
    ShowcaseFactory.getInstance().addGadget(resource.getVendor(), resource.getName(),
        resource.getVersion().text, resource.getUriTemplate());
};

CatalogueView.prototype.getBreadcrum = function () {
    return [
        {
            'label': 'marketplace'
        }
    ];
};

CatalogueView.prototype.getSubMenuItems = function () {
    return [
        {
            'label': gettext('publish'),
            'callback': alert.bind(null, 'hola')
        }
    ];
};

CatalogueView.prototype.home = function () {
    this.alternatives.showAlternative(this.viewsByName.search);
};

CatalogueView.prototype.createUserCommand = function(command) {
    return this.ui_commands[command].apply(this, Array.prototype.slice.call(arguments, 1));
};

CatalogueView.prototype.ui_commands = {};

CatalogueView.prototype.ui_commands.home = function () {
    return function (e) {
        Event.stop(e);
        this.alternatives.showAlternative(this.viewsByName.search);
    }.bind(this)
};

CatalogueView.prototype.ui_commands.instanciate = function (resource) {
    return function (e) {
        Event.stop(e);
        this.instanciate(resource);
        LayoutManagerFactory.getInstance().changeCurrentView('workspace');
    }.bind(this)
};

CatalogueView.prototype.ui_commands.showDetails = function (resource) {
    return function (e) {
        Event.stop(e);
        this.viewsByName.details.paint(resource);
        this.alternatives.showAlternative(this.viewsByName.details);
    }.bind(this)
};