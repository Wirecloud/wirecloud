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


function Widget(widget_) {

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
    Object.defineProperty(this, 'code_content_type', {get: function () { return state.code_content_type}});

    this.getId = function() {
        return this.getVendor() + '/' + this.getName() + '/' + this.getVersion().text;
    }

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    var state = new WidgetState(widget_);
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
    var version = new Wirecloud.Version(widget_.version, 'showcase');
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
    Object.defineProperty(this, 'code_content_type', {value: widget_.code_content_type});

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
