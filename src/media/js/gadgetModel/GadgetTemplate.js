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
//                 TEMPLATE                 //
//////////////////////////////////////////////

function GadgetTemplate(variables_, size_) {

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    var variableList = variables_;
    var width = size_.width;
    var height = size_.height;

    //preferences section
    var prefs =  null;
    var sharedPrefs = null;
    var gadgetPrefs = null;
    var connectables = null;

    // ******************
    //  PUBLIC FUNCTIONS
    // ******************

    this.getWidth = function () {
        return width;
    }

    this.getHeight = function () {
        return height;
    }

    this.getVariables = function (iGadget) {
        return variableList;
    }

    this._newUserPref = function(rawVar){

        switch (rawVar.type) {
            case UserPref.prototype.TEXT:
                return new TextUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value);
            case UserPref.prototype.INTEGER:
                return new IntUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value);
            case UserPref.prototype.BOOLEAN:
                return new BoolUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value);
            case UserPref.prototype.DATE:
                return new DateUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value);
            case UserPref.prototype.PASSWORD:
                return new PasswordUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value);
            case UserPref.prototype.LIST:
                return new ListUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value, rawVar.value_options);
        }
    }

    this._generateUserPrefs = function () {

        prefs = [];
        sharedPrefs = [];
        gadgetPrefs = [];

        var rawVar, pref, i;

        for (i in variableList) {
            rawVar = variableList[i];
            if (rawVar.aspect == Variable.prototype.USER_PREF) {
                prefs.push(rawVar);
            }
        }

        prefs = prefs.sort(this._sortVariables);

        for (i = 0; i < prefs.length; i += 1) {
            pref = this._newUserPref(prefs[i]);

            if (!prefs[i].shareable) {
                // add it to the user-only prefs
                gadgetPrefs.push(pref);
            } else {
                // add it to the shared prefs
                sharedPrefs.push(pref);
            }

            // Replace the hash with a UserPref
            prefs[i] = pref;
        }

        return prefs;
    };

    this.getUserPrefs = function () {
        if (!prefs) {
            this._generateUserPrefs();
        }
        return prefs;
    };

    this.getSharedPrefs = function () {
        if (!sharedPrefs) {
            this._generateUserPrefs();
        }
        return sharedPrefs;
    };

    this.getGadgetPrefs = function () {
        if (!gadgetPrefs) {
            this._generateUserPrefs();
        }
        return gadgetPrefs;
    };

    this.getExternalContextVars = function (igadget_) {

        // JSON-coded Template-Variables mapping
        // Constructing the structure

        var objVars = [];
        var rawVars = variableList;
        var rawVar = null;
        var currentContextVar = null;
        for (var i in rawVars) {
            rawVar = rawVars[i];
            switch (rawVar.aspect) {
                case Variable.prototype.EXTERNAL_CONTEXT:
                    currentContextVar = new ContextVar(igadget_, rawVar.name, rawVar.concept)
                    objVars.push(currentContextVar);
                    break;
                default:
                    break;
            }
        }
        return objVars;
    }

    this.getGadgetContextVars = function (igadget_) {

        // JSON-coded Template-Variables mapping
        // Constructing the structure

        var objVars = [];
        var rawVars = variableList;
        var rawVar = null;
        var currentContextVar = null;
        for (var i in rawVars) {
            rawVar = rawVars[i];
            switch (rawVar.aspect) {
                case Variable.prototype.GADGET_CONTEXT:
                    currentContextVar = new ContextVar(igadget_, rawVar.name, rawVar.concept);
                    objVars.push(currentContextVar);
                    break;
                default:
                    break;
            }
        }
        return objVars;
    }

    this.getUserPrefsId = function () {

        // JSON-coded Template-UserPrefs mapping
        // Constructing the structure

        var objVars = [];
        var rawVars = variableList;
        var rawVar = null;
        for (var i in rawVars) {
            rawVar = rawVars[i];
            if (rawVar.aspect == Variable.prototype.USER_PREF)
            {
                    objVars.push(rawVar.name);
            }
        }
        return objVars;
    }

    

    this.getConnectables = function () {

        var var_name, rawVar;

        if (connectables === null) {
            connectables = {
                'events': [],
                'slots': []
            };

            for (var_name in variableList) {
                rawVar = variableList[var_name];
                switch (rawVar.aspect) {
                case Variable.prototype.EVENT:
                    connectables.events.push(rawVar);
                    break;
                case Variable.prototype.SLOT:
                    connectables.slots.push(rawVar);
                    break;
                default:
                }
            }

            connectables.events = connectables.events.sort(this._sortVariables);
            connectables.slots = connectables.slots.sort(this._sortVariables);
        }

        return connectables;
    }


    this.getPropertiesId = function () {

        // JSON-coded Template-UserPrefs mapping
        // Constructing the structure

        var objVars = [];
        var rawVars = variableList;
        var rawVar = null;
        for (var i in rawVars) {
            rawVar = rawVars[i];
            if (rawVar.aspect == Variable.prototype.PROPERTY)
            {
                    objVars.push(rawVar.name);
            }
        }
        return objVars;
    }

    /*
     * CONSTRUCTOR
     */
    var varname, variable;

    for (varname in variableList) {
        variable = variableList[varname];
        if (typeof variable.label === 'undefined' || variable.label === null || variable.label === '') {
            variable.label = variable.name;
        }
    }
}

GadgetTemplate.prototype._sortVariables = function (var1, var2) {
    return var1.order - var2.order;
};
