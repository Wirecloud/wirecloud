/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global Hash, $, OpManagerFactory, ShowcaseFactory, IGadget */
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

/**
* @author aarranz
*/
function Dragboard(tab, workSpace, dragboardElement) {
    // *********************************
    // PRIVATE VARIABLES
    // *********************************
    this.loaded = false;
    this.currentCode = 1;

    // HTML Elements
    this.dragboardElement = $('dragboard');
    this.tabNameElement = $('tab_name');
    this.barElement = $('bar');

    //Atributes
    this.iGadgets = new Hash();
    this.tab = tab;
    this.tabId = tab.tabInfo.id;
    this.workSpace = workSpace;
    this.workSpaceId = workSpace.workSpaceState.id;

    // ****************
    // PUBLIC METHODS
    // ****************

    Dragboard.prototype.paint = function (iGadgetId) {
        var iGadget = this.getIGadget(iGadgetId);

        this.workSpace.notebook.goToTab(iGadget.getTab());

        if (OpManagerFactory.getInstance().visibleLayer !== "dragboard") {
            //Paints the dragboard and the visibleIGadget and hide the gadget menu
            this.workSpace.hide();
            this.dragboardElement.setStyle({
                height: "",
                overflow: ""
            });

            //show the bar element
            this.barElement.setStyle({
                display: "block"
            });
        }
        this.workSpace.notebook.repaint();
    };

    Dragboard.prototype.paintRelatedIGadget = function (iGadgetId) {
        var tabId = this.getIGadget(iGadgetId).getTabId(),
            tabIndex = this.workSpace.tabView.getTabIndexById(tabId);

        if (tabIndex !== null && tabIndex !== undefined) { // the gadget-tab is already visible
            this.setVisibleIGadget(iGadgetId);
            this.workSpace.tabView.set('activeTab', this.workSpace.tabView.getTab(tabIndex));
        } else {
            this.paint(iGadgetId);
        }
    };

    Dragboard.prototype.hide = function () {
        //hide and clean the dragboard layer
        this.dragboardElement.setStyle({
            height: "0px",
            overflow: "hidden"
        });

        //clean the bar and the content
        this.barElement.setStyle({
            display: "none"
        });
    };


    Dragboard.prototype.markRelatedIgadget = function (iGadgetId) {
        $("related_" + iGadgetId).addClassName("active");

        // highlight related tabs
        var igadget = this.getIGadget(iGadgetId),
            tabId, tabIndex;
        if (igadget) {
            tabId = igadget.getTabId();
            tabIndex = this.workSpace.tabView.getTabIndexById(tabId);
            if (tabIndex !== null && tabIndex !== undefined) { // the tab is already visible
                this.workSpace.tabView.getTab(tabIndex).set('highlight', true);
            }
        }
    };

    /**
    * Removes the mark on the related igadget. It has to be called at least:
    * - when the user clicks on the tab containing that igadget
    * - when the user clicks on the related gadget icon
    */
    Dragboard.prototype.unmarkRelatedIgadget = function (iGadgetId) {
        var r = $("related_" + iGadgetId);
        if (r) {
            r.removeClassName("active");
        }
    };

    Dragboard.prototype.parseTab = function (tabInfo) {
        var curIGadget, position, width, height, igadget, gadget, gadgetid, minimized, i,
            opManager = OpManagerFactory.getInstance();

        this.currentCode = 1;
        this.iGadgets = new Hash();

        // For controlling when the igadgets are totally loaded!
        this.igadgets = tabInfo.igadgetList;
        for (i = 0; i < this.igadgets.length; i += 1) {
            curIGadget = this.igadgets[i];

            // Parse gadget id
            gadgetid = curIGadget.gadget.split("/");
            gadgetid = gadgetid[2] + "_" + gadgetid[3] + "_" + gadgetid[4];
            // Get gadget model
            gadget = ShowcaseFactory.getInstance().getGadget(gadgetid);

            // Create instance model
            igadget = new IGadget(gadget, curIGadget.id, curIGadget.code, curIGadget.name, this);
            this.iGadgets.set(curIGadget.id, igadget);

            if (curIGadget.code >= this.currentCode) {
                this.currentCode =  curIGadget.code + 1;
            }
        }
        this.loaded = true;
    };

    Dragboard.prototype.igadgetLoaded = function (iGadgetId) {
        //DO NOTHING
    };

    Dragboard.prototype.destroy = function () {
        var keys = this.iGadgets.keys(),
            i, igadget;

        //disconect and delete the connectables and variables of all tab iGadgets
        for (i = 0; i < keys.length; i += 1) {
            this.workSpace.removeIGadgetData(keys[i]);

            igadget = this.iGadgets.get(keys[i]);
            igadget.destroy();
            this.iGadgets.unset(keys[i]);
        }
        //TODO: have all references been removed?,delete the object
    };

    Dragboard.prototype.saveConfig = function (iGadgetId) {
        var igadget = this.iGadgets.get(iGadgetId);
        try {
            igadget.saveConfig();

            this.setConfigurationVisible(igadget.getId(), false);
        } catch (e) {
        }
    };

    Dragboard.prototype.showInstance = function (igadget) {
        igadget.paint(this.dragboardElement, this.dragboardStyle);
    };

    Dragboard.prototype.getIGadgets = function () {
        return this.iGadgets.values();
    };

    Dragboard.prototype.getIGadget = function (iGadgetId) {
        return this.iGadgets.get(iGadgetId);
    };

    Dragboard.prototype.getWorkspace = function () {
        return this.workSpace;
    };

    Dragboard.prototype._updateIGadgetInfo = function (iGadget) {
        this.tabNameElement.textContent = this.tab.tabInfo.name;
        this.workSpace.updateVisibleTab(this.tab.index);
    };

    // *******************
    // INITIALIZING CODE
    // *******************

    this.parseTab(tab.tabInfo);
}
