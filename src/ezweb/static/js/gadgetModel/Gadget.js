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


function GadgetVersion(version, source) {
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

GadgetVersion.prototype.compareTo = function(version) {
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


function Gadget(gadget_, url_, options_) {

    // ******************
    //  PUBLIC FUNCTIONS
    // ******************
    var _this = this;

    this.getVendor = function() { return state.getVendor(); }
    this.getName = function() { return state.getName(); }
    this.getDisplayName = function() { return state.getDisplayName(); }
    this.getVersion = function() { return state.getVersion(); }
    this.getTemplate = function() { return state.getTemplate(); }
    this.getXHtml = function() { return state.getXHtml(); }
    this.getInfoString = function() { return state.getInfoString(); }
    this.getUriWiki = function() { return state.getUriWiki();}
    this.getImage = function() { return state.getImage(); }
    this.setImage = function(image_) { state.setImage(image_); }
    this.getIcon = function() { return state.getIcon(); }
    this.getMenuColor = function() { return state.getMenuColor(); }
    this.isUpToDate = function() { return state.isUpToDate(); }
    this.setLastVersion = function(lastVersion) { return state.setLastVersion(lastVersion); }
    this.getLastVersion = function(){return state.getLastVersion();}

    this.isContratable = function() {
        var capabilities = state.getCapabilities();

        for (var i=0; i<capabilities.length; i++) {
            var capability = capabilities[i];
            if (capability.name == 'Contratable')
                return capability.value.toLowerCase() == "true";
            else
                return false
        }
    }

    // *******************
    //  PRIVATE FUNCTIONS
    // *******************
    var _solicitarGadget = function(url_) {

        // ******************
        //  CALLBACK METHODS
        // ******************

        var onError = function(transport, e) {
            var logManager = LogManagerFactory.getInstance();
            var msg = logManager.formatError(gettext("The gadget could not be added to the showcase: %(errorMsg)s."), transport, e);
            logManager.log(msg);
            var layoutManager = LayoutManagerFactory.getInstance();
            layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
        }

        var loadGadget = function(transport) {
            var response = transport.responseText;
            var objRes = JSON.parse(response);
            state = new GadgetState(objRes);
            ShowcaseFactory.getInstance().gadgetToShowcaseGadgetModel(_this, options_);
        }

        var persistenceEngine = PersistenceEngineFactory.getInstance();
        var workspaceId_ = OpManagerFactory.getInstance().getActiveWorkspaceId();
        // Post Gadget to PersistenceEngine. Asyncrhonous call!
        // params: url of the template, id of the current workspace to check if it is shared
        // and with who it is shared.
        var params = {url: url_, workspaceId: workspaceId_};
        persistenceEngine.send_post(URIs.GET_GADGETS, params, this, loadGadget, onError);
    }

    this.getId = function() {
        return this.getVendor() + '_'+ this.getName() + '_' + this.getVersion().text;
    }

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    var state = null;

    if (url_ != null) {
        _solicitarGadget(url_);
    } else {
        state = new GadgetState(gadget_);
    }
}

//////////////////////////////////////////////
//       GADGETSTATE (State Object)         //
//////////////////////////////////////////////

function GadgetState(gadget_) {

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    // JSON-coded Gadget mapping
    // Constructing the structure
    var vendor = gadget_.vendor;
    var name = gadget_.name;
    var version = new GadgetVersion(gadget_.version, 'showcase');
    var displayName = gadget_.displayName
    var template = new GadgetTemplate(gadget_.variables, gadget_.size);
    var xhtml = new XHtml(gadget_.xhtml);
    var image = gadget_.imageURI;
    var icon = gadget_.iPhoneImageURI;
    var capabilities = gadget_.capabilities;
    var uriwiki = gadget_.wikiURI;
    var menuColor = gadget_.menuColor;
    var lastVersion = version;
    var showcaseLastVersion = version;
    var catalogueLastVersion = null;
    var upToDate = true;

    // ******************
    //  PUBLIC FUNCTIONS
    // ******************

    this.getCapabilities = function() { return capabilities; }
    this.getVendor = function() { return vendor; }
    this.getName = function() { return name; }
    this.getDisplayName = function() { return displayName; }
    this.getVersion = function() { return version; }
    this.getTemplate = function() { return template; }
    this.getXHtml = function() { return xhtml; }
    this.getInfoString = function() {
        var transObj = {vendor: vendor, name: name, version: version};
        var msg = gettext("[GadgetVendor: %(vendor)s, GadgetName: %(name)s, GadgetVersion: %(version)s]");
        return interpolate(msg, transObj, true);
    }
    this.getUriWiki = function () {return uriwiki;}
    this.getImage = function() { return image; }
    this.setImage = function(image_) { image = image_; }
    this.getIcon = function() { return (icon!="") ? icon :  image;  }
    this.getMenuColor = function () {return menuColor;}
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
