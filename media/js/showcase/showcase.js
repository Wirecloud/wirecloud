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

// This module provides a set of gadgets which can be deployed into dragboard as gadget instances
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

        this.parseGadgets = function (receivedData_) {
            var i, jsonGadgetList, jsonGadget, gadget, gadgetId, gadgetFullId,
                currentGadgetVersions, sortedGadgets, key;

            jsonGadgetList = JSON.parse(receivedData_.responseText);
            this.gadgets = new Hash();
            this.gadgetVersions = {};

            // Load all gadgets from persitence system
            for (i = 0; i < jsonGadgetList.length; i += 1) {
                jsonGadget = jsonGadgetList[i];

                gadget = new Gadget(jsonGadget, null);
                gadgetId = gadget.getVendor() + '_' + gadget.getName()
                gadgetFullId = gadgetId + '_' + gadget.getVersion().text;

                if (this.gadgetVersions[gadgetId] === undefined) {
                    this.gadgetVersions[gadgetId] = [];
                }
                this.gadgetVersions[gadgetId].push(gadget);

                // Insert gadget object in showcase object model
                this.gadgets[gadgetFullId] = gadget;
            }

            for (key in this.gadgetVersions) {
                currentGadgetVersions = this.gadgetVersions[key];
                sortedGadgets = currentGadgetVersions.sort(function(gadget1, gadget2) {
                    return -gadget1.getVersion().compareTo(gadget2.getVersion());
                });

                for (i = 0; i < currentGadgetVersions.length; i += 1) {
                    gadget = currentGadgetVersions[i];
                    gadget.setLastVersion(sortedGadgets[0].getVersion());
                }
            }
        }

        Showcase.prototype.reload = function (workspace_id) {

            var id = workspace_id;

            var onSuccess = function (receivedData_) {

                this.parseGadgets(receivedData_);

                opManager = OpManagerFactory.getInstance();

                opManager.changeActiveWorkSpace(opManager.workSpaceInstances[id]);
            }

            var onError = function (transport, e) {
                var msg, logManager = LogManagerFactory.getInstance();
                msg = logManager.formatError(gettext("Error retrieving showcase data: %(errorMsg)s."), transport, e);
                logManager.log(msg);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }

            // Initial load from persitence system
            this.persistenceEngine.send_get(URIs.GET_GADGETS, this, onSuccess, onError);
        }

        Showcase.prototype.init = function () {

            // Load gadgets from persistence system
            var onSuccess = function (receivedData_) {

                this.parseGadgets(receivedData_);

                // Showcase loaded
                this.opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);

            }

            // Error callback (empty gadget list)
            var onError = function (receivedData_) {
                var msg, logManager = LogManagerFactory.getInstance();
                msg = logManager.formatError(gettext("Error retrieving showcase data: %(errorMsg)s."), transport, e);
                logManager.log(msg);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }

            // Initial load from persitence system
            this.persistenceEngine.send_get(URIs.GET_GADGETS, this, onSuccess, onError);
        }


        // *******************************
        // PRIVATE METHODS AND VARIABLES
        // *******************************
        this.gadgets = new Hash();
        this.opManager = OpManagerFactory.getInstance();
        this.persistenceEngine = PersistenceEngineFactory.getInstance();

        // ****************
        // PUBLIC METHODS
        // ****************

        // Add a new gadget from Internet
        Showcase.prototype.addGadget = function (vendor_, name_, version_, url_, options_) {
            var gadgetId = vendor_ + '_' + name_ + '_' + version_;
            var gadget = this.gadgets[gadgetId];

            if (gadget == null) {
                gadget = new Gadget (null, url_, options_);
            } else {
                this.opManager.addInstance(gadgetId, options_);
            }
        }

        // Add a new parameterized gadget from Internet
        // Help:
        //     - igadget_name_: String. New name for the iGadget
        //     - variable_values_: Object. New values for the user preferences.
        //         Example:
        //             variable_values = {"var1":"value1", "var2": "value2"};
        Showcase.prototype.addParameterizedGadget = function (vendor_, name_, version_, igadget_name_, variable_values_, url_) {
            var url_ = (url_)?url_:null;
            var options = {
                "igadgetName": igadget_name_,
                "setDefaultValues" : function(igadgetId_){
                    var varManager = OpManagerFactory.getInstance().activeWorkSpace.getVarManager();
                    $H(variable_values_).each(function(pair) {
                        var msg = "";
                        var variable = varManager.getVariableByName(igadgetId_, pair.key);
                        if (variable) {
                            if(variable.aspect == Variable.prototype.USER_PREF) {
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
                            OpManagerFactory.getInstance().logIGadgetError(igadgetId_, msg, Constants.Logging.WARN_MSG);
                        }
                    });
                }
            }
            this.addGadget(vendor_, name_, version_, url_, options);
        }

        // Insert gadget object in showcase object model
        Showcase.prototype.gadgetToShowcaseGadgetModel = function(gadget_, options_) {
            var gadgetId = gadget_.getId();

            this.gadgets[gadgetId] = gadget_;
            this.opManager.addInstance(gadgetId, options_);
        }

        // Remove a Showcase gadget
        Showcase.prototype.deleteGadget = function (gadgetId_) {
            var gadget = this.gadgets.remove(gadgetId_);
            //gadget.remove();
        }

        // Update a Showcase gadget
        Showcase.prototype.updateGadget = function (gadgetId_, url_) {
            this.remove(gadgetId_);
            this.addGadget(url_);
        }

        // Get a gadget by its gadgetID
        Showcase.prototype.getGadget = function (gadgetId_) {
            return this.gadgets[gadgetId_];
        }

        //Get all the gadgets name and vendor
        Showcase.prototype.getGadgetsData = function () {
            var data = [];
            var keys = this.gadgets.keys();
            for (var i=0;i<keys.length;i++){
                var g = this.gadgets[keys[i]];
                data.push({"name":g.getName(), "vendor":g.getVendor(), "version":g.getVersion().text});
            }
            return data;
        }

        //Get all the gadgets name and vendor
        Showcase.prototype.setGadgetsState = function (data) {
            var i, j, key, resource, versions, sortedVersions, currentGadgets, updated = false;

            for (i = 0; i < data.length; i += 1) {
                resource = data[i];
                key = resource.getVendor() + '_' + resource.getName();
                if (key in this.gadgetVersions) {
                    versions = resource.getAllVersions().map(function(version) {return new GadgetVersion(version, 'catalogue');});
                    sortedVersions = versions.sort(function(version1, version2) {
                        return -version1.compareTo(version2);
                    });

                    currentGadgets = this.gadgetVersions[key];
                    for (j = 0; j < currentGadgets.length; j += 1) {
                        updated = currentGadgets[j].setLastVersion(sortedVersions[0]) || updated;
                    }
                }
            }

            if (updated) {
                this.opManager.checkForGadgetUpdates();
            }
        }

        // Set gadget properties (User Interface)
        Showcase.prototype.setGadgetProperties = function (gadgetId_, imageSrc_, tags_) {
            var gadget = this.gadgets[gadgetId_];

            gadget.setImage(imageSrc_);
            gadget.setTags(tags_);
        }

        // Add a tag to a Showcase gadget
        Showcase.prototype.tagGadget = function (gadgetId_, tags_) {
            for (var i = 0; i<tags_.length; i++) {
                var tag = tags_[i];
                this.gadgets[gadgetId_].addTag(tag);
            }
        }

        // Deploy a Showcase gadget into dragboard as gadget instance
        Showcase.prototype.addInstance = function (gadgetId_) {
            var gadget = this.gadgets[gadgetId_];
            this.opManager.addInstance (gadget);
        }
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
