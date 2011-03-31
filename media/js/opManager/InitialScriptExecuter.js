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

// This module provides a set of gadgets which can be deployed into dragboard as gadget instances
var ScriptManagerFactory = function () {

    // *********************************
    // SINGLETON INSTANCE
    // *********************************
    var instance = null;

    // *********************************
    // CONSTRUCTOR
    // *********************************
    function ScriptManager () {

        // ****************
        // PUBLIC METHODS
        // ****************

        ScriptManager.prototype.parse_script = function () {
            if (this.initial_script ==  null)
                return;

            for (var i=0; i<this.initial_script.length; i++) {
                var command_object = this.initial_script[i];

                if (command_object['command'] == 'load_workspace') {
                    var ws_id = command_object['ws_id'];

                    this.ws_id = ws_id;
                }

                if (command_object['command'] == 'change_theme') {
                    var theme = command_object['theme'];

                    this.theme = theme;
                }
            }
        }

        ScriptManager.prototype.get_ws_id = function () {
            return this.ws_id;
        }

        ScriptManager.prototype.get_theme = function () {
            return this.theme;
        }

        ScriptManager.prototype.run_script = function(workspace) {

            if (this.initial_script == null) {
                return;
            }

            for (var i=0; i<this.initial_script.length; i++) {
                var command_object = this.initial_script[i];

                if (command_object['command'] == 'instantiate_resource') {
                    var vendor_name = command_object['vendor_name'];
                    var name = command_object['name'];
                    var version = command_object['version'];
                    var template = command_object['template'];

                    if (vendor_name && name && version && template) {
                        ShowcaseFactory.getInstance().addGadget(vendor_name, name, version, template);
                    }
                }
            }
        }

        // *******************************
        // PRIVATE METHODS AND VARIABLES
        // *******************************
        this.initial_script = null;
        this.ws_id = null;
        this.theme = null;

        if (! (post_load_script && post_load_script != '')) {
            // There is not post_load_script! Finishing!
            return;
        }

        this.initial_script = JSON.parse(post_load_script);
        this.parse_script();
    }

    // *********************************
    // SINGLETON GET INSTANCE
    // *********************************
    return new function() {
        this.getInstance = function() {
            if (instance == null) {
                instance = new ScriptManager();
            }
            return instance;
        }
    }

}();

