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
 * @author luismarcos.ayllon
 */

// This module provides a set of widgets which can be deployed into dragboard as widget instances
var ShowcaseFactory = function () {

    // *********************************
    // SINGLETON INSTANCE
    // *********************************
    var instance = null;

    // *********************************
    // CONSTRUCTOR
    // *********************************
    function Showcase () {

        // ******************
        // STATIC VARIABLES
        // ******************
        Showcase.prototype.MODULE_HTML_ID = "showcase";
        Showcase.prototype.NUM_CELLS = 4;

        // ****************
        // CALLBACK METHODS
        // ****************

        this.parseWidgets = function (receivedData_) {
            var i, jsonWidgetList, jsonWidget, widget, widgetId, widgetFullId,
                currentWidgetVersions, sortedWidgets, key;

            jsonWidgetList = JSON.parse(receivedData_.responseText);
            this.widgets = {};
            this.widgetVersions = {};

            // Load all widgets from persitence system
            for (i = 0; i < jsonWidgetList.length; i += 1) {
                jsonWidget = jsonWidgetList[i];

                widget = new Widget(jsonWidget, null);
                widgetId = widget.getVendor() + '/' + widget.getName()
                widgetFullId = widget.getId();

                if (this.widgetVersions[widgetId] === undefined) {
                    this.widgetVersions[widgetId] = [];
                }
                this.widgetVersions[widgetId].push(widget);

                // Insert widget object in showcase object model
                this.widgets[widgetFullId] = widget;
            }

            for (key in this.widgetVersions) {
                currentWidgetVersions = this.widgetVersions[key];
                sortedWidgets = currentWidgetVersions.sort(function(widget1, widget2) {
                    return -widget1.getVersion().compareTo(widget2.getVersion());
                });

                for (i = 0; i < currentWidgetVersions.length; i += 1) {
                    widget = currentWidgetVersions[i];
                    widget.setLastVersion(sortedWidgets[0].getVersion());
                }
            }
        }

        Showcase.prototype.reload = function (workspace_id) {

            var id = workspace_id;

            var onSuccess = function (receivedData_) {

                this.parseWidgets(receivedData_);

                opManager = OpManagerFactory.getInstance();

                opManager.changeActiveWorkspace(opManager.workspaceInstances.get(id));
            }

            var onError = function (transport, e) {
                var msg, logManager = LogManagerFactory.getInstance();
                msg = logManager.formatError(gettext("Error retrieving showcase data: %(errorMsg)s."), transport, e);
                logManager.log(msg);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }

            // Initial load from persitence system
            Wirecloud.io.makeRequest(Wirecloud.URLs.WIDGET_COLLECTION, {
                method: 'GET',
                onSuccess: onSuccess.bind(this),
                onFailure: onError,
                onException: onError
            });
        }

        Showcase.prototype.init = function () {

            // Load widgets from persistence system
            var onSuccess = function (receivedData_) {

                this.parseWidgets(receivedData_);
            }

            // Error callback (empty widget list)
            var onError = function (transport, e) {
                var msg, logManager = LogManagerFactory.getInstance();
                msg = logManager.formatError(gettext("Error retrieving showcase data: %(errorMsg)s."), transport, e);
                logManager.log(msg);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }

            // Initial load from persitence system
            Wirecloud.io.makeRequest(Wirecloud.URLs.WIDGET_COLLECTION, {
                method: 'GET',
                onSuccess: onSuccess.bind(this),
                onFailure: onError.bind(this),
                onException: onError.bind(this)
            });
        };


        // *******************************
        // PRIVATE METHODS AND VARIABLES
        // *******************************
        this.widgets = {};
        this.opManager = OpManagerFactory.getInstance();

        // ****************
        // PUBLIC METHODS
        // ****************

        // Add a new parameterized widget from Internet
        // Help:
        //     - iwidget_name_: String. New name for the iWidget
        //     - variable_values_: Object. New values for the user preferences.
        //         Example:
        //             variable_values = {"var1":"value1", "var2": "value2"};
        Showcase.prototype.addParameterizedWidget = function (vendor_, name_, version_, iwidget_name_, variable_values_, url_) {
            var url_ = (url_)?url_:null;
            var options = {
                "iwidgetName": iwidget_name_,
                "setDefaultValues" : function(iwidgetId_){
                    var varManager = OpManagerFactory.getInstance().activeWorkspace.getVarManager();
                    $H(variable_values_).each(function(pair) {
                        var msg = "";
                        var variable = varManager.getVariableByName(iwidgetId_, pair.key);
                        if (variable) {
                            if(variable.vardef.aspect == Variable.prototype.USER_PREF) {
                                variable.annotate(pair.value);
                                variable.set(pair.value);
                            }
                            else {
                                msg = gettext("\"%(variable)s\" variable is not an User Preference");
                            }
                        }
                        else {
                            msg = gettext("\"%(variable)s\" variable doesn't exists");
                        }
                        if (msg != "") {
                            msg = interpolate(msg, {"variable": pair.key}, true);
                            OpManagerFactory.getInstance().logIWidgetError(iwidgetId_, msg, Constants.Logging.WARN_MSG);
                        }
                    });
                }
            }
            this.addWidget(vendor_, name_, version_, url_, options);
        }

        // Insert widget object in showcase object model
        Showcase.prototype.widgetToShowcaseWidgetModel = function(widget_, options_) {
            var widgetId = widget_.getId();

            this.widgets[widgetId] = widget_;
            this.opManager.addInstance(widgetId, options_);
        }

        //Get all the widgets name and vendor
        Showcase.prototype.getWidgetsData = function () {
            var widget_key, g, data = [];

            for (widget_key in this.widgets) {
                g = this.widgets[widget_key];
                data.push({
                    "name": g.getName(),
                    "vendor": g.getVendor(),
                    "version": g.getVersion().text
                });
            }
            return data;
        }

        //Get all the widgets name and vendor
        Showcase.prototype.setWidgetsState = function (data) {
            var i, j, key, resource, versions, last_version, currentWidgets, updated = false;

            for (i = 0; i < data.length; i += 1) {
                resource = data[i];
                key = resource.getVendor() + '/' + resource.getName();
                if (key in this.widgetVersions) {
                    last_version = resource.getLastVersion();

                    currentWidgets = this.widgetVersions[key];
                    for (j = 0; j < currentWidgets.length; j += 1) {
                        updated = currentWidgets[j].setLastVersion(last_version) || updated;
                    }
                }
            }

            if (updated) {
                this.opManager.checkForWidgetUpdates();
            }
        }

        // Set widget properties (User Interface)
        Showcase.prototype.setWidgetProperties = function (widgetId_, imageSrc_, tags_) {
            var widget = this.widgets[widgetId_];

            widget.setImage(imageSrc_);
            widget.setTags(tags_);
        };

        // Add a tag to a Showcase widget
        Showcase.prototype.tagWidget = function (widgetId_, tags_) {
            for (var i = 0; i < tags_.length; i++) {
                var tag = tags_[i];
                this.widgets[widgetId_].addTag(tag);
            }
        };

        // Deploy a Showcase widget into dragboard as widget instance
        Showcase.prototype.addInstance = function (widgetId_) {
            var widget = this.widgets[widgetId_];
            this.opManager.addInstance (widget);
        };
    }

    // *********************************
    // SINGLETON GET INSTANCE
    // *********************************
    return new function() {
        this.getInstance = function() {
            if (instance == null) {
                instance = new Showcase();
            }
            return instance;
        }
    }
}();
