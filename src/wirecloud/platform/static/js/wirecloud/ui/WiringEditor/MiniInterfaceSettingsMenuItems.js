/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2013 Universidad Politécnica de Madrid
 *     Copyright (c) 2012-2013 the Center for Open Middleware
 *
 *     Licensed under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */

/*global gettext, StyledElements, Wirecloud, LayoutManagerFactory*/

(function () {

    "use strict";

    var MiniInterfaceSettingsMenuItems, clickCallback;

    MiniInterfaceSettingsMenuItems = function MiniInterfaceSettingsMenuItems(geinterface) {
        this.geinterface = geinterface;
        if (this.geinterface.ioperator) {
            this.instance = this.geinterface.ioperator;
        } else {
            this.instance = this.geinterface.iwidget;
        }
    };
    MiniInterfaceSettingsMenuItems.prototype = new StyledElements.DynamicMenuItems();

    MiniInterfaceSettingsMenuItems.prototype.build = function build(context) {
        var items, item, label, versions, versionInfo, i, msg, color, allVersions, sortedItems;

        items = {};
        allVersions = [];
        // Widget
        if (!this.geinterface.ioperator) {
            return items;
        }

        // Operator
        versionInfo = this.geinterface.wiringEditor.operatorVersions[this.instance.vendor + '/' + this.instance.name];
        versions = versionInfo.versions;
        for (i = 0; i < versions.length; i++) {
            msg = 'Version ' + versions[i].version.text;
            color = '';
            if (versionInfo.currentVersion.compareTo(versions[i].version) == 0) {
                msg += '*';
                color = 'red';
            }
            if (versionInfo.lastVersion.compareTo(versions[i].version) == 0) {
                color = 'blue';
            }
            item = new StyledElements.MenuItem(gettext(msg), function (version) {
                    this.wiringEditor.setOperatorVersion(this, version);
            }.bind(this.geinterface, versions[i]));
            item.wrapperElement.style.color = color;
            items[versions[i].version.text]= item;
            allVersions.push(versions[i].version);
        }
        allVersions = allVersions.sort(function (version1, version2) {
            return -version1.compareTo(version2);
        });
        sortedItems = [];
        for (i = 0; i < allVersions.length; i++) {
            sortedItems.push(items[allVersions[i].text]);
        }
        return sortedItems;
    };

    Wirecloud.ui.WiringEditor.MiniInterfaceSettingsMenuItems = MiniInterfaceSettingsMenuItems;
})();
