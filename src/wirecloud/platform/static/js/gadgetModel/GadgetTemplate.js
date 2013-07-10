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

function WidgetTemplate(data) {

    // *******************
    //  PRIVATE VARIABLES
    // *******************

    var variableList = {};

    //preferences section
    var prefs =  null;
    var connectables = null;

    // ******************
    //  PUBLIC FUNCTIONS
    // ******************

    this.getVariables = function (iWidget) {
        return variableList;
    }

    this._generateUserPrefs = function () {

        prefs = [];

        var rawVar, pref, i;

        for (i in variableList) {
            rawVar = variableList[i];
            if (rawVar.aspect == Variable.prototype.USER_PREF) {
                prefs.push(rawVar);
            }
        }

        prefs = prefs.sort(this._sortVariables);

        for (i = 0; i < prefs.length; i += 1) {
            prefs[i] = new UserPref(prefs[i].name, prefs[i].type, prefs[i]);
        }

        return prefs;
    };

    this.getUserPrefs = function () {
        if (!prefs) {
            this._generateUserPrefs();
        }
        return prefs;
    };

    this.getConnectables = function () {

        var var_name, rawVar;

        if (connectables === null) {
            connectables = {
                'outputs': [],
                'inputs': []
            };

            for (var_name in variableList) {
                rawVar = variableList[var_name];
                switch (rawVar.aspect) {
                case Variable.prototype.EVENT:
                    connectables.outputs.push(rawVar);
                    break;
                case Variable.prototype.SLOT:
                    connectables.inputs.push(rawVar);
                    break;
                default:
                }
            }

            connectables.outputs = connectables.outputs.sort(this._sortVariables);
            connectables.inputs = connectables.inputs.sort(this._sortVariables);
        }

        return connectables;
    }

    /*
     * CONSTRUCTOR
     */
    var i, varname, variable;

    for (i = 0; i < data.wiring.inputs.length; i += 1) {
        variableList[data.wiring.inputs[i].name] = data.wiring.inputs[i];
        variableList[data.wiring.inputs[i].name].aspect = 'SLOT';
    }

    for (i = 0; i < data.wiring.outputs.length; i += 1) {
        variableList[data.wiring.outputs[i].name] = data.wiring.outputs[i];
        variableList[data.wiring.outputs[i].name].aspect = 'EVEN';
    }

    for (i = 0; i < data.preferences.length; i += 1) {
        variableList[data.preferences[i].name] = data.preferences[i];
        variableList[data.preferences[i].name].aspect = 'PREF';
    }

    for (i = 0; i < data.properties.length; i += 1) {
        variableList[data.properties[i].name] = data.properties[i];
        variableList[data.properties[i].name].aspect = 'PROP';
    }

    for (i = 0; i < data.context.length; i += 1) {
        variableList[data.context[i].name] = data.context[i];
    }

    for (varname in variableList) {
        variable = variableList[varname];
        if (typeof variable.label === 'undefined' || variable.label === null || variable.label === '') {
            variable.label = variable.name;
        }
    }
}

WidgetTemplate.prototype._sortVariables = function (var1, var2) {
    return var1.order - var2.order;
};
