/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global interpolate, gettext, LogManagerFactory, URIs, GadgetTemplate, XHtml, ShowcaseFactory, PersistenceEngineFactory */
"use strict";

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
//       GADGETSTATE (State Object)         //
//////////////////////////////////////////////

function GadgetState(gadget_vble) {

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    var vendor = null,
        name = null,
        version = null,
        template = null,
        xhtml = null,
        image = null,
        imageURI = null,
        iPhoneImageURI = null;

    // JSON-coded Gadget mapping
    // Constructing the structure
    vendor = gadget_vble.vendor;
    name = gadget_vble.name;
    version = gadget_vble.version;
    template = new GadgetTemplate(gadget_vble.variables, gadget_vble.size);
    xhtml = new XHtml(gadget_vble.xhtml);
    image = gadget_vble.image;
    imageURI = gadget_vble.imageURI;
    iPhoneImageURI = gadget_vble.iPhoneImageURI;

    // ******************
    //  PUBLIC FUNCTIONS
    // ******************

    this.getVendor = function () {
        return vendor;
    };
    this.getName = function () {
        return name;
    };
    this.getVersion = function () {
        return version;
    };
    this.getTemplate = function () {
        return template;
    };
    this.getXHtml = function () {
        return xhtml;
    };
    this.getInfoString = function () {
        var transObj, msg;
        transObj = {
            vendor: vendor,
            name: name,
            version: version
        };
        msg = gettext("[GadgetVendor: %(vendor)s, GadgetName: %(name)s, GadgetVersion: %(version)s]");
        return interpolate(msg, transObj, true);
    };

    this.getImage = function () {
        return image;
    };
    this.setImage = function (image_param) {
        image = image_param;
    };

    this.getImageURI = function () {
        return imageURI;
    };
    this.getIPhoneImageURI = function () {
        return (iPhoneImageURI !== "") ? iPhoneImageURI :  imageURI;
    };
}

//////////////////////////////////////////////
//                  GADGET                  //
//////////////////////////////////////////////

function Gadget(gadget_vble, url_vble) {

    // ******************
    //  PUBLIC FUNCTIONS
    // ******************
    var privatethis = this,
        solicitarGadget,
        state = null;

    this.getVendor = function () {
        return state.getVendor();
    };
    this.getName = function () {
        return state.getName();
    };
    this.getVersion = function () {
        return state.getVersion();
    };
    this.getTemplate = function () {
        return state.getTemplate();
    };
    this.getXHtml = function () {
        return state.getXHtml();
    };
    this.getInfoString = function () {
        return state.getInfoString();
    };
    this.getImage = function () {
        return state.getImage();
    };
    this.setImage = function (image) {
        state.setImage(image);
    };
    this.getImageURI = function () {
        return state.getImageURI();
    };
    this.getIPhoneImageURI = function () {
        return state.getIPhoneImageURI();
    };


    // *******************
    //  PRIVATE FUNCTIONS
    // *******************

    solicitarGadget = function (url_vble) {
        var onError,
            loadGadget,
            persistenceEngine,
            param;

        // ******************
        //  CALLBACK METHODS
        // ******************

        // Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.

        onError = function (transport, e) {
            var msg;
            if (e) {
                msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"), {
                    errorFile: e.fileName,
                    errorLine: e.lineNumber,
                    errorDesc: e
                }, true);
            } else if (transport.responseXML) {
                msg = transport.responseXML.documentElement.textContent;
            } else {
                msg = "HTTP Error " + transport.status + " - " + transport.statusText;
            }

            msg = interpolate(gettext("The gadget could not be added to the showcase: %(errorMsg)s."), {
                errorMsg: msg
            }, true);
            LogManagerFactory.getInstance().log(msg);
        };

        loadGadget = function (transport) {
            var response = transport.responseText,
                objRes = JSON.parse(response);
            state = new GadgetState(objRes);
            ShowcaseFactory.getInstance().gadgetToShowcaseGadgetModel(privatethis);
        };

        persistenceEngine = PersistenceEngineFactory.getInstance();
        // Post Gadget to PersistenceEngine. Asyncrhonous call!
        param = {
            url: url_vble
        };

        persistenceEngine.send_post(URIs.GET_GADGETS, param, this, loadGadget, onError);
    };

    this.getId = function () {
        return this.getVendor() + '_' + this.getName() + '_' + this.getVersion();
    };

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    if (url_vble !== null && url_vble !== undefined) {
        solicitarGadget(url_vble);
    } else {
        state = new GadgetState(gadget_vble);
    }
}
