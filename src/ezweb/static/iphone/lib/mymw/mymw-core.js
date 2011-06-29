/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: false, newcap: true, immed: true, strict: true */
/*global document, navigator, node, window */
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


if (typeof window.MYMW === "undefined" || !window.MYMW) {
    window.MYMW = {};
    window.MYMW.ui = {};
}

String.prototype.supplant = function (o) {
    return this.replace(/\{([^{}]*)\}/g, function (a, b) {
            var r = o[b];
            return typeof r === 'string' ? r : a;
        }
    );
};

// Detect clients
var ua =  navigator.userAgent;
var isOpera = ua.indexOf("Opera") > 0;
var isGecko = ua.indexOf("Gecko") > 0;
var isWmobile = !isOpera && !isGecko && (ua.indexOf("PPC") > 0 || ua.indexOf("IEMobile") > 0);

function id(nid) {
    return isWmobile ? document.all[nid] : document.getElementById(nid);
}

function hasClass(nid, classStr) {
    return (" " + id(node).className + " ").indexOf(" " + classStr + " ") >= 0;
}

function update(nid, content) {
    id(nid).innerHTML = content;
}

function after(nid, content) {
    var el = id(nid);
    el.innerHTML = el.innerHTML + content;
}

function before(nid, content) {
    var el = id(nid);
    el.innerHTML = content + el.innerHTML;
}

function updateClass(nid, className) {
    id(nid).className = className;
}

/*
// not working for IEM
HTMLElement.prototype.update = function( txt ) {
    this.innerHTML = txt;
}
*/

/*
function getElementsByClassName(classStr) {
    var r=[];
    var els=(document.getElementsByTagName)?document.getElementsByTagName("*"):document.all;

    for (var i=0; i<els.length; i++) {
        var tmp=els[i].className.split(" ");
        for (var j=0; j<tmp.length; j++) {
            if (tmp[j] == classStr) {
                r[r.length] = els[i];
            }
        }
    }

    return r
}
*/

/*
var dump = function(obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            alert(i + " => " + obj[i]);
        }
    }
}
*/