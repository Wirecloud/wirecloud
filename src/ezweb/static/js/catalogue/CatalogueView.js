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
/*global alert, CatalogueResource, CatalogueSearchView, CookieManager, gettext, LayoutManagerFactory, OpManagerFactory, Wirecloud, ResourceDetailsView, ResourcePainter, ShowcaseFactory, StyledElements, URIs*/

var CatalogueView = function (id, options) {
    options.id = 'catalogue';
    StyledElements.Alternative.call(this, id, options);

    this.alternatives = new StyledElements.StyledAlternatives();
    this.appendChild(this.alternatives);

    this.viewsByName = {
        'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: {catalogue: this, resource_painter: ResourcePainter}}),
        'developer': this.alternatives.createAlternative({alternative_constructor: CataloguePublishView, containerOptions: {catalogue: this}}),
        'details': this.alternatives.createAlternative({alternative_constructor: ResourceDetailsView, containerOptions: {catalogue: this}})
    };

    this.view_all_template = new Template(URIs.GET_POST_RESOURCES + '/#{starting_page}/#{resources_per_page}');
    this.simple_search_template = new Template(URIs.GET_RESOURCES_SIMPLE_SEARCH + '/simple_or/#{starting_page}/#{resources_per_page}');

};
CatalogueView.prototype = new StyledElements.Alternative();

CatalogueView.prototype.getLabel = function () {
    return gettext('wirecloud marketplace');
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

        this.callback(data);
    }
};

CatalogueView.prototype.search = function (callback, options) {
    var params, url, context;

    params = {
        'orderby': options.order_by,
        'search_criteria': options.search_criteria,
        'search_boolean': options.search_boolean,
        'scope': options.scope
    };

    context = {
        'callback': callback
    };

    if (options.search_criteria.strip() === '') {
        url = this.view_all_template.evaluate({'starting_page': options.starting_page, 'resources_per_page': options.resources_per_page});
    } else {
        url = this.simple_search_template.evaluate({'starting_page': options.starting_page, 'resources_per_page': options.resources_per_page});
    }
    Wirecloud.io.makeRequest(url, {
        method: 'GET',
        parameters: params,
        onSuccess: this._onSearchSuccess.bind(context)
    });
};

CatalogueView.prototype.instanciate = function (resource) {
    if (resource.isMashup()) {
        // Ask if the user want to create a new workspace or merge it with the current one
        (new Wirecloud.ui.InstanciateMashupWindowMenu(resource)).show();
    } else {
        ShowcaseFactory.getInstance().addGadget(resource.getVendor(),
            resource.getName(),
            resource.getVersion().text,
            resource.getUriTemplate()
        );
    }
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

CatalogueView.prototype.changeCurrentView = function (view_name) {
    if (!(view_name in this.viewsByName)) {
        throw new TypeError();
    }

    this.alternatives.showAlternative(this.viewsByName[view_name]);
};

CatalogueView.prototype.home = function () {
    this.changeCurrentView('search');
};

CatalogueView.prototype.show_upload_view = function show_upload_view () {
    this.changeCurrentView('developer');
};

CatalogueView.prototype.createUserCommand = function(command) {
    return this.ui_commands[command].apply(this, Array.prototype.slice.call(arguments, 1));
};

CatalogueView.prototype.ui_commands = {};

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

CatalogueView.prototype.ui_commands.delete = function (resource) {
    var url, success_callback, error_callback, doRequest, msg, context;

    url = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion().text;

    success_callback = function (response) {
        // processing command
        var layoutManager, result, opManager, i, gadgetId;

        layoutManager = LayoutManagerFactory.getInstance();
        result = JSON.parse(response.responseText);

        layoutManager.logSubTask(gettext('Removing affected iGadgets'));
        opManager = OpManagerFactory.getInstance();
        for (i = 0; i < result.removedIGadgets.length; i += 1) {
            opManager.removeInstance(result.removedIGadgets[i], true);
        }

        layoutManager.logSubTask(gettext('Purging gadget info'));
        gadgetId = resource.getVendor() + '_' + resource.getName() + '_' + resource.getVersion().text;
        ShowcaseFactory.getInstance().deleteGadget(gadgetId);

        layoutManager._notifyPlatformReady();
        this.home();
        this.refresh_search_results();
    };

    error_callback = function (transport, e) {
        var logManager, layoutManager, msg;

        logManager = LogManagerFactory.getInstance();
        layoutManager = LayoutManagerFactory.getInstance();

        msg = logManager.formatError(gettext("Error deleting the Gadget: %(errorMsg)s."), transport, e);

        logManager.log(msg);
        layoutManager._notifyPlatformReady();
        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
    };

    doRequest = function () {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Deleting gadget resource from catalogue"), 3);
        layoutManager.logSubTask(gettext('Requesting server'));

        // Send request to delete de gadget
        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            onSuccess: success_callback.bind(this),
            onFailure: error_callback,
            onException: error_callback
        });
    };

    // First ask the user
    msg = gettext('Do you really want to remove the "%(name)s" (vendor: "%(vendor)s", version: "%(version)s") gadget?');
    context = {
        name: resource.getName(),
        vendor: resource.getVendor(),
        version: resource.getVersion().text
    };

    msg = interpolate(msg, context, true);
    return function () {
        LayoutManagerFactory.getInstance().showYesNoDialog(msg, doRequest.bind(this));
    }.bind(this);
};

CatalogueView.prototype.refresh_search_results = function () {
    this.viewsByName.search._search();
};
