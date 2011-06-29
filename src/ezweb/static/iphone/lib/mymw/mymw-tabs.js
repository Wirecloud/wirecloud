/*jslint white: true, onevar: true, undef: true, nomen: false, eqeqeq: false, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global MYMW, update, updateClass */
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

(function () {
    var MAX_SLOTS = 5,
        p;

    MYMW.ui.TabView = function (nid, attr) {
        this._tabs = [];
        this._attr = attr || {};
        this._slots = [null, null, null, null, null]; // MAX_SLOTS

        // create initial empty content slots
        var navHTML = "",
            contentHTML = "",
            i;
        for (i = 0; i < MAX_SLOTS; i += 1) {
            navHTML += "<li id='mymw-nav-" + i + "' class='mymw-inactive'></li>";
            contentHTML += "<div id='mymw-slot-" + i + "' class='mymw-inactive'></div> ";
        }
        update('mymw-nav', navHTML);
        update('mymw-content', contentHTML);

        for (i in attr) {
            this.set(i, attr[i]);
        }
    };

    p = MYMW.ui.TabView.prototype;

    p.addTab = function (tab) {

        if (this._tabs.length === this.get('maxTabs')) {
            this.removeTab(this._LRU());
        }

        this._tabs[this._tabs.length] = tab;

        // assign a free slot
        for (var i = 0; i < this._slots.length; i += 1) {
            if (this._slots[i] === null) {
                this._slots[i] = tab;
                tab.assignSlot(i);
                break;
            }
        }

        // It this is the first tab, activate it
        if (this._tabs.length === 1) {
            this.set('activeIndex', 0); // set includes rendering
        }

        // this._renderHead();
        // this._renderBody();
    };

    p.removeTab = function (index) {
        var tab = this._tabs[index];
        this._slots[tab._slot] = null;

        tab.assignSlot();

        this._tabs.splice(index, 1);

        // If the active tab is removed, activate the first tab.
        if (this.get('activeIndex') === index && this._tabs.length > 0) {
            this.set('activeIndex', 0); // set includes rendering
        }

        // this._renderHead();
        // this._renderBody();
    };

    p.getTab = function (index) {
        return this._tabs[index];
    };

    // name in ['activeId', 'activeTab', 'activeIndex', 'maxTabs']
    p.set = function (name, value) {
        this._attr[name] = value;
        var i;
        switch (name) {
        case 'activeId' :
            this.set('activeIndex', this.getTabIndexById(value));
            break;
        case 'activeTab' :
            for (i = 0; i < this._tabs.length; i += 1) {
                if (this._tabs[i] === value) {
                    this.set('activeIndex', i);
                    break;
                }
            }
            break;
        case 'activeIndex' :
            for (i = 0; i < this._tabs.length; i += 1) {
                if (this._tabs[i].get('active') === true) {
                    if (i !== value) {
                        this._tabs[i].set('active', false);
                    }
                } else {
                    if (i === value) {
                        this._tabs[i].set('active', true);
                    }
                }
            }
            break;
        case 'maxTabs' :
            while (this._tabs.length > value) {
                this.removeTab(this._LRU());
            }
            break;
        }
    };

    p.get = function (name) {
        return this._attr[name];
    };

    // not in YUI
    p.clear = function (id) {
        var n = this._tabs.length,
            i;
        for (i = 0; i < n; i += 1) {
            this.removeTab(0);
        }
    };

    // not in YUI
    p.removeTabById = function (id) {
        var index = this.getTabIndexById(id);
        if (index >= 0) {
            this.removeTab(index);
        }
    };

    // not in YUI
    p.getTabIndexById = function (id) {
        var index, i;
        for (i = 0; i < this._tabs.length; i += 1) {
            if (this._tabs[i].get('id') === id) {
                index = i;
                break;
            }
        }
        return index;
    };

    p._renderHead = function () {
        var innerHTML = "",
            i;
        for (i = 0; i < this._tabs.length; i += 1) {
            this._tabs[i]._renderHead(); // delegate rendering
        }
    };

    p._renderBody = function () {
        for (var i = 0; i < this._tabs.length; i += 1) {
            this._tabs[i]._renderBody(); // delegate rendering
        }
    };

    p._LRU = function () {
        var result,
            minTime = Number.MAX_VALUE,
            i;
        for (i = 0; i < this._tabs.length; i += 1) {
            if (this._tabs[i]._dateActivation < minTime) {
                minTime = this._tabs[i]._dateActivation;
                result = i;
            }
        }
        return result;
    };

    MYMW.ui.Tab = function (attr) {
        this._loaded = false;
        this._disposed = false;
        // this._head = "";
        // this._body = "";
        this._slot = undefined;
        this._dateActivation = undefined;

        this._attr = attr || {};

        for (var i in attr) {
            this.set(i, attr[i]);
        }
    };
    p = MYMW.ui.Tab.prototype;

    p.assignSlot = function (slot) {
        if (slot != undefined) {
            this._slot = slot;
            this._renderBody();
            this._renderHead();
        } else {
            this._disposed = true;
            this._renderBody();
            this._renderHead();
            this._slot = slot;
        }
    };

    // name in ['active', 'label', 'content', 'dataSrc', 'cacheData', 'id', 'highlight', 'onclick']
    p.set = function (name, value) {
        this._attr[name] = value;
        switch (name) {
        case 'active' :
            if (value === true) {
                this._dateActivation = new Date();
                this.__show();
            } else {
                this.__hide();
            }
            //this._renderBody();
            break;
        case 'highlight' :
            if (this._attr.active === true) {
                this._attr.highlight = false;
            }
        case 'onclick' :
        case 'label' :
            this._renderHead();
            break;
        case 'content' :
            this._renderBody();
            break;
        }
    };

    p.get = function (name) {
        switch (name) {
        case 'content':
            var dataSrc = this.get('dataSrc'),
                handle_ok, params;
            if (dataSrc && this.get('active') && (!this._loaded || !this.get('cacheData'))) {
                handle_ok = function (txt) {
                    this._loaded = true;
                    this.set('content', txt);
                };
                params = "_mymw_rnd=" + Math.random(); // random param to avoid caching
                ajax.apply(this, [dataSrc, handle_ok, null, params, true]);
            }
            break;
        }

        return this._attr[name];
    };

    p.__show = function () {
        if (this._slot != undefined) {
            if (!this._loaded) {
                this.get('content');
            }
            updateClass('mymw-slot-' + this._slot, '');
            updateClass('mymw-nav-' + this._slot, 'mymw-selected');
        }
    };

    p.__hide = function () {
        if (this._slot != undefined) {
            updateClass('mymw-slot-' + this._slot, 'mymw-inactive');
            updateClass('mymw-nav-' + this._slot, '');
        }
    };

    p._renderHead = function () {
        if (this._disposed === false) {
            if (this._slot != undefined) {
                this.__updateHead();
                update('mymw-nav-' + this._slot, this._head);
                updateClass('mymw-nav-' + this._slot, this.get('active') ? 'mymw-selected' : this.get('highlight') ? 'mymw-highlight' : '');
            }

            try {
                var onclick = this.get('onclick'),
                    tabid = this.get('id'),
                    fn = function () {
                        if (onclick) {
                            onclick();
                        }
                        // TODO the name of the variable "tabview" is hardcoded !
                        tabview.set("activeId", tabid);
                    };
                id('mymw-link-' + this._slot).onclick = fn;
            } catch (e) {
                // browsers that do not allow dynamic binding for events will fail silently
            }
        } else {
            update('mymw-nav-' + this._slot, "");
            updateClass('mymw-nav-' + this._slot, 'mymw-inactive');
        }
    };

    p._renderBody = function () {
        if (this._disposed === false) {
            if (this._slot != undefined) {
                this.__updateBody();
                update('mymw-slot-' + this._slot, this._body); // asynch call, so we sinchronize UI
            }
        } else {
            update('mymw-slot-' + this._slot, "");
        }
    };

    p.__updateHead = function () {
        // TODO the name of the variable "tabview" is hardcoded !
        var onclick = 'javascript:tabview.set("activeId","' + this.get('id') + '");',
            label = this.get('label');
        this._head = "<a id='mymw-link-" + this._slot + "' href='#' onclick='" + onclick + "'>" + label + "</a>";
    };

    p.__updateBody = function () {
        this._body = this.get('content');
    };
})();