/* 
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */



//////////////////////////////////////////////
//                  GADGET                  //
//////////////////////////////////////////////


function WidgetVersion(version, source) {
    if (typeof version == 'string') {
        this.text = version;
        this.array = version.split('.').map(function(x) { return parseInt(x); });
    } else if (version instanceof Array) {
        this.array = version;
        this.text = version.join('.');
    } else {
        throw new TypeError();
    }
    this.source = source;
};

WidgetVersion.prototype.compareTo = function(version) {
    var len, value1, value2;

    len = Math.max(this.array.length, version.array.length);

    for (i = 0; i < len; i += 1) {
        value1 = this.array[i] != undefined ? this.array[i] : 0;
        value2 = version.array[i] != undefined ? version.array[i] : 0;

        if (value1 !== value2) {
            return value1 - value2;
        }
    }

    return 0;
};


function Widget(widget_, url_, options_) {

    // ******************
    //  PUBLIC FUNCTIONS
    // ******************
    var _this = this;

    this.getVendor = function() { return state.getVendor(); }
    this.getName = function() { return state.getName(); }
    this.getDisplayName = function() { return state.getDisplayName(); }
    this.getVersion = function() { return state.getVersion(); }
    this.getTemplate = function() { return state.getTemplate(); }
    this.getInfoString = function() { return state.getInfoString(); }
    this.getUriWiki = function() { return state.getUriWiki();}
    this.getImage = function() { return state.getImage(); }
    this.setImage = function(image_) { state.setImage(image_); }
    this.getIcon = function() { return state.getIcon(); }
    this.getIPhoneImageURI = function() { return state.getIcon(); }
    this.isUpToDate = function() { return state.isUpToDate(); }
    this.setLastVersion = function(lastVersion) { return state.setLastVersion(lastVersion); }
    this.getLastVersion = function(){return state.getLastVersion();}
    Object.defineProperty(this, 'code_url', {get: function () { return state.code_url}});

    // *******************
    //  PRIVATE FUNCTIONS
    // *******************
    var _solicitarWidget = function(url_) {

        // ******************
        //  CALLBACK METHODS
        // ******************

        var onError = function(transport, e) {
            var logManager = LogManagerFactory.getInstance();
            var msg = logManager.formatError(gettext("The widget could not be added to the showcase: %(errorMsg)s."), transport, e);
            logManager.log(msg);
            var layoutManager = LayoutManagerFactory.getInstance();
            layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
        }

        var loadWidget = function(transport) {
            var response = transport.responseText;
            var objRes = JSON.parse(response);
            state = new WidgetState(objRes);
            ShowcaseFactory.getInstance().widgetToShowcaseWidgetModel(_this, options_);
        }

        var workspaceId_ = OpManagerFactory.getInstance().getActiveWorkspaceId();
        // Post Widget to PersistenceEngine. Asyncrhonous call!
        // params: url of the template, id of the current workspace to check if it is shared
        // and with who it is shared.
        var params = {url: url_, workspaceId: workspaceId_, packaged: options_.packaged};
        Wirecloud.io.makeRequest(Wirecloud.URLs.WIDGET_COLLECTION, {
            method: 'POST',
            parameters: params,
            onSuccess: loadWidget,
            onFailure: onError,
            onException: onError
        });
    }

    this.getId = function() {
        return '/widgets/' + this.getVendor() + '/' + this.getName() + '/' + this.getVersion().text;
    }

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    var state = null;

    if (url_ != null) {
        _solicitarWidget(url_);
    } else {
        state = new WidgetState(widget_);
    }
}

//////////////////////////////////////////////
//       GADGETSTATE (State Object)         //
//////////////////////////////////////////////

function WidgetState(widget_) {

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    // JSON-coded Widget mapping
    // Constructing the structure
    var vendor = widget_.vendor;
    var name = widget_.name;
    var version = new WidgetVersion(widget_.version, 'showcase');
    var displayName = widget_.displayName
    var template = new WidgetTemplate(widget_.variables, widget_.size);
    var image = widget_.imageURI;
    var icon = widget_.iPhoneImageURI;
    var capabilities = widget_.capabilities;
    var uriwiki = widget_.wikiURI;
    var lastVersion = version;
    var showcaseLastVersion = version;
    var catalogueLastVersion = null;
    var upToDate = true;
    var code_url = Wirecloud.URLs.WIDGET_CODE_ENTRY.evaluate({
        vendor: vendor,
        name: name,
        version: version.text
    });
    Object.defineProperty(this, 'code_url', {value: code_url});

    // ******************
    //  PUBLIC FUNCTIONS
    // ******************

    this.getCapabilities = function() { return capabilities; }
    this.getVendor = function() { return vendor; }
    this.getName = function() { return name; }
    this.getDisplayName = function() { return displayName; }
    this.getVersion = function() { return version; }
    this.getTemplate = function() { return template; }
    this.getInfoString = function() {
        var transObj = {vendor: vendor, name: name, version: version};
        var msg = gettext("[WidgetVendor: %(vendor)s, WidgetName: %(name)s, WidgetVersion: %(version)s]");
        return interpolate(msg, transObj, true);
    }
    this.getUriWiki = function () {return uriwiki;}
    this.getImage = function() { return image; }
    this.setImage = function(image_) { image = image_; }
    this.getIcon = function() { return (icon!="") ? icon :  image;  }
    this.isUpToDate = function() { return upToDate; }
    this.getLastVersion = function() {
        if (lastVersion == null) {
            if (catalogueLastVersion == null || showcaseLastVersion.compareTo(catalogueLastVersion) >= 0) {
                lastVersion = showcaseLastVersion;
            } else {
                lastVersion = catalogueLastVersion;
            }
        }
        return lastVersion;
    };
    this.setLastVersion = function(v) {
        var oldVersion = this.getLastVersion();

        if (v.source === 'showcase') {
            showcaseLastVersion = v;
        } else {
            catalogueLastVersion = v;
        }
        lastVersion = null;

        newVersion = this.getLastVersion();
        upToDate = version.compareTo(newVersion) === 0;

        return oldVersion.compareTo(newVersion) !== 0;
    };
}
