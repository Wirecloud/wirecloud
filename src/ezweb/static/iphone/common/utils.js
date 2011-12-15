/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global setTimeout, window, PersistenceEngineFactory, loaded:true, document, OpManagerFactory, clearInterval, updateInterval */
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

/******GENERAL UTILS **********/

/* Slide utility function */
var percent = 100;
var slideSpeed = 20;
var timer;
var percent;

function slide(backwards, element) {
    percent -= slideSpeed;
    if (percent <= 0) {
        percent = 0;
    }
    element.style.left = (backwards ? -percent : percent) + "%";
    if (percent !== 0) {
        setTimeout(function () {
            slide(backwards, element);
        }, 0);
    } else {
        percent = 100;
    }
}

/* language selection */
function setLanguage(language) {
    var onSuccess, onError, persistenceEngine, params;

    onSuccess = function () {
        window.location.reload();
    };
    onError = function () {};

    persistenceEngine = PersistenceEngineFactory.getInstance();
    params = {
        language: language
    };
    persistenceEngine.send_post("/i18n/setlang/", params, window, onSuccess, onError);
    return false;
}

/* layout change function (landscape or portrait) */
function updateLayout() {
    var orient = (window.orientation === 0 || window.orientation === 180) ? "portrait" : "landscape";
    if (!loaded) {
        /*Use it to test the iphone rotation in a browser
        * if (window.innerWidth != _currentWidth || !loaded)
        {
            _currentWidth = window.innerWidth;
            var orient = _currentWidth <= 320 ? "portrait" : "landscape";
        */
        // change the orientation properties
        document.body.setAttribute("orient", orient);
        document.body.className = orient;
        if (OpManagerFactory.getInstance().loadCompleted) {
            loaded = true;
            clearInterval(updateInterval);
            OpManagerFactory.getInstance().activeWorkSpace.updateLayout(orient);
        } else {
            loaded = false;
        }
    } else {
        //the onorientationchange has hapenned
        document.body.setAttribute("orient", orient);
        document.body.className = orient;
        OpManagerFactory.getInstance().activeWorkSpace.updateLayout(orient);
    }
}

/* tab change function */
function checkTab() {
    if (OpManagerFactory.getInstance().visibleLayer === "tabs_container") {
        var xoffset = window.pageXOffset,
            tabWidth = window.innerWidth,
            halfTabWidth = tabWidth / 2,
            scroll, STEP_H, steps, step, i;

        if (xoffset < halfTabWidth) {
            scroll = - xoffset;
        } else {
            scroll = - (xoffset - halfTabWidth) % tabWidth + halfTabWidth;
        }

        if (scroll !== 0) {
            STEP_H = tabWidth / 52;
            steps = Math.abs(scroll / STEP_H);
            step = scroll < 0 ? - STEP_H : STEP_H;

            for (i = 0; i < steps; i += 1) {
                window.scrollBy(step, 0);
            }
            window.scrollTo(xoffset + scroll, 1);

            //update the visible Tab
            OpManagerFactory.getInstance().activeWorkSpace.updateVisibleTab(Math.round(window.pageXOffset / tabWidth));
        }
    } else if (OpManagerFactory.getInstance().visibleLayer === "dragboard") { // dragboard
        window.scrollTo(0, 1);
    }
}
