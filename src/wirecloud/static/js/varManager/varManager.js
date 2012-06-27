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


function VarManager (_workSpace) {

    VarManager.prototype.MAX_BUFFERED_REQUESTS = 10

    // ****************
    // PUBLIC METHODS
    // ****************


    VarManager.prototype.parseVariables = function (workSpaceInfo) {
        // Igadget variables!
        var tabs = workSpaceInfo['workspace']['tabList'];

        for (var i=0; i<tabs.length; i++) {
            var igadgets = tabs[i]['igadgetList'];

            for (var j=0; j<igadgets.length; j++) {
                this.parseIGadgetVariables(igadgets[j], this.workSpace.getTabInstance(tabs[i].id));
            }
        }
    }

    /**
     * Saves all modified variables.
     *
     * @param {Boolean} async if true, this method will do some asynchronous
     * tasks. Sometimes these operations cannot be done asynchronously
         * because the browser will not wait for these operations. (default:
         * true)
     */
    VarManager.prototype.sendBufferedVars = function (async) {
        async = async !== false;

        // Asynchronous handlers
        function onSuccess(transport) {
            var response = transport.responseText;
            var modifiedVariables = JSON.parse(response);
            var igadgetVars = modifiedVariables['igadgetVars']

            this.modificationsEnabled = false; //lock the adding of modified variables to the buffer
            for (var i = 0; i < igadgetVars.length; i++) {
                var id = igadgetVars[i].id;
                var variable = this.getVariableById(id);
                variable.annotate(igadgetVars[i].value)
            }
            for (var i = 0; i < igadgetVars.length; i++) {
                var id = igadgetVars[i].id;
                var variable = this.getVariableById(id);
                variable.set(igadgetVars[i].value) //set will not add the variable to the modified variables to be sent due to the 'disableModifications'
            }
            this.modificationsEnabled = true; //unlock the adding of modified variables to the buffer
        }

        function onError(transport, e) {
            var logManager = LogManagerFactory.getInstance();
            var msg = logManager.formatError(gettext("Error saving variables to persistence: %(errorMsg)s."), transport, e);
            logManager.log(msg);
        }

        // Max lenght of buffered requests have been reached. Uploading to server!
        if (this.igadgetModifiedVars.length > 0) {
            var variables = {};

            variables['igadgetVars'] = this.igadgetModifiedVars;

            var uri = URIs.PUT_VARIABLES.evaluate({workspaceId: this.workSpace.getId()});

            var options = {
                method: 'PUT',
                asynchronous: async,
                contentType: 'application/json',
                postBody: Object.toJSON(variables),
                onSuccess: onSuccess.bind(this),
                onFailure: onError.bind(this),
                onException: onError.bind(this)
            };
            Wirecloud.io.makeRequest(uri, options);
            this.resetModifiedVariables();
        }
    }

    VarManager.prototype.parseIGadgetVariables = function (igadget_info, tab) {
        var name, id, variables, variable, igadget, varInfo, aspect, value,
            objVars = {};

        igadget = this.workSpace.getIgadget(igadget_info['id']);
        variables = igadget.gadget.getTemplate().getVariables();

        for (name in variables) {
            variable = variables[name];
            varInfo = name in igadget_info.variables ? igadget_info.variables[name] : {};

            id = varInfo.id;
            aspect = variable.aspect;
            value = 'value' in varInfo ? varInfo.value : '';

            switch (aspect) {
                case Variable.prototype.PROPERTY:
                case Variable.prototype.EVENT:
                    objVars[name] = new RWVariable(id, igadget, variable, this, value, tab);
                    this.variables[id] = objVars[name];
                    break;
                case Variable.prototype.EXTERNAL_CONTEXT:
                case Variable.prototype.GADGET_CONTEXT:
                case Variable.prototype.SLOT:
                    objVars[name] = new RVariable(id, igadget, variable, this, value, tab);
                    this.variables[id] = objVars[name];
                    break;
                case Variable.prototype.USER_PREF:
                    objVars[name] = new RVariable(id, igadget, variable, this, value, tab);
                    objVars[name].readOnly = 'readOnly' in varInfo ? varInfo.readOnly : false;
                    objVars[name].hidden = 'hidden' in varInfo ? varInfo.hidden : false;
                    this.variables[id] = objVars[name];
                    break;
            }
        }

        this.iGadgets[igadget_info['id']] = objVars;
    }

    VarManager.prototype.registerVariable = function (iGadgetId, variableName, handler) {
        var variable = this.findVariable(iGadgetId, variableName);

        if (variable) {
            variable.setHandler(handler);
        } else {
            var transObj = {iGadgetId: iGadgetId, varName: variableName};
            var msg = interpolate(gettext("IGadget %(iGadgetId)s does not have any variable named \"%(varName)s\".\nIf you need it, please insert it into the gadget's template."), transObj, true);
            OpManagerFactory.getInstance().logIGadgetError(iGadgetId, msg, Constants.Logging.ERROR_MSG);
        }
    }

    VarManager.prototype.assignEventConnectable = function (iGadgetId, variableName, wEvent) {
        var variable = this.findVariable(iGadgetId, variableName);
        variable.assignEvent(wEvent);
    }

    VarManager.prototype.getVariable = function (iGadgetId, variableName) {
        var variable = this.findVariable(iGadgetId, variableName);

        // Error control

        return variable.get();
    }

    VarManager.prototype.setVariable = function (iGadgetId, variableName, value, options) {
        var variable = this.findVariable(iGadgetId, variableName);

        if (variable.vardef.aspect !== Variable.prototype.EVENT && typeof(value) !== 'string') {
            var transObj = {iGadgetId: iGadgetId, varName: variableName};
            var msg = interpolate(gettext("IGadget %(iGadgetId)s attempted to establish a non-string value for the variable \"%(varName)s\"."), transObj, true);
            OpManagerFactory.getInstance().logIGadgetError(iGadgetId, msg, Constants.Logging.ERROR_MSG);

            throw new Error();
        }

        variable.set(value, options);
    }

    VarManager.prototype.addPendingVariable = function (iGadget, variableName, value) {
        var variables = this.pendingVariables[iGadget.getId()];
        if (!variables) {
            variables = [];
            this.pendingVariables[iGadget.getId()] = variables;
        }
        variables.push({
            "name": variableName,
            "value": value
        });
    };

    VarManager.prototype.dispatchPendingVariables = function (iGadgetId) {
        var variables, i;

        variables = this.pendingVariables[iGadgetId];
        delete this.pendingVariables[iGadgetId];
        if (variables) {
            for (i = 0; i < variables.length; i += 1) {
                this.setVariable(iGadgetId, variables[i]["name"], variables[i]["value"]);
            }
        }
    };

    VarManager.prototype.addInstance = function (iGadget, igadgetInfo, tab) {
        this.parseIGadgetVariables(igadgetInfo, tab);
    }

    VarManager.prototype.removeInstance = function (iGadgetId) {
        delete this.iGadgets[iGadgetId];

        this.removeIGadgetVariables(iGadgetId);
    }


    VarManager.prototype.removeIGadgetVariables = function (iGadgetId) {
        var variable_id, variable;

        for (variable_id in this.variables) {
            variable = this.variables[variable_id];
            if (variable.iGadget === iGadgetId) {
                this.igadgetModifiedVars.removeById(variable_id);
                delete this.variables[variable_id];
            }
        }
    }

    VarManager.prototype.unload = function () {
    }

    VarManager.prototype.commitModifiedVariables = function() {
        //If it have not been buffered all the requests, it's not time to send a PUT request
        if (!this.force_commit && this.buffered_requests < VarManager.prototype.MAX_BUFFERED_REQUESTS) {
            this.buffered_requests++;
            return
        }

        this.sendBufferedVars();
    }

    VarManager.prototype.initializeInterface = function () {
        // Calling all SLOT vars handler
        var variable;
        var vars;
        var varIndex;
        var gadgetIndex;

        for (gadgetIndex in this.iGadgets) {
        vars = this.iGadgets[gadgetIndex];

            for (varIndex in vars) {
                variable = vars[varIndex];

                if (variable.vardef.aspect == "SLOT" && variable.handler) {
                    try {
                        variable.handler(variable.value);
                    } catch (e) {
                    }
                }
            }

        }
    }

    VarManager.prototype.findVariableInCollection = function(varCollection, id){
        for (var i = 0; i < varCollection.length; i++){
            var modVar = varCollection[i];

            if (modVar.id == id) {
                return modVar
            }
        }
        return null;
    }


    VarManager.prototype.markVariablesAsModified = function (variables) {
        if (this.modificationsEnabled) {

            for (var j = 0; j < variables.length; j++) {
                var variable = variables[j];

                var modVar = this.findVariableInCollection(this.igadgetModifiedVars, variable.id)
                if (modVar) {
                    modVar.value = variable.value;
                    return;
                }

                //It's doesn't exist in the list
                //It's time to create it!
                var varInfo = {
                    'id': variable.id,
                    'value': variable.value
                }

                this.igadgetModifiedVars.push(varInfo);
            }
        }

    }

    VarManager.prototype.incNestingLevel = function() {
        if (this.modificationsEnabled)
            this.nestingLevel++;
    }

    VarManager.prototype.decNestingLevel = function() {
        if (this.modificationsEnabled) {
            this.nestingLevel--;
            if (this.nestingLevel == 0)
                this.commitModifiedVariables();
        }
    }

    VarManager.prototype.resetModifiedVariables = function () {
        this.nestingLevel = 0;
        this.buffered_requests = 0;
        this.igadgetModifiedVars = [];
        this.force_commit = false;
    }

    VarManager.prototype.forceCommit = function(){
        if (this.modificationsEnabled){
            this.force_commit = true;
        }
    }

    VarManager.prototype.getIGadgetVariables = function (iGadgetId) {
        return this.iGadgets[iGadgetId];
    }

    VarManager.prototype.getVariableById = function (varId) {
        return this.variables[varId];
    }

    VarManager.prototype.getVariableByName = function (igadgetId, varName) {
        return this.findVariable(igadgetId, varName);
    }

    VarManager.prototype.getWorkspace = function () {
        return this.workSpace;
    }

    // *********************************
    // PRIVATE VARIABLES AND CONSTRUCTOR
    // *********************************

    VarManager.prototype.findVariable = function (iGadgetId, name) {
        var variables = this.iGadgets[iGadgetId];
        var variable = variables[name];

        return variable;
    }

    this.workSpace = _workSpace;
    this.iGadgets = {};
    this.variables = {};

    // For now workspace variables must be in a separated hash table, because they have a
    // different identifier space and can collide with the idenfiers of normal variables

    this.resetModifiedVariables();

    this.modificationsEnabled = true;

    this.pendingVariables = {}; //to manage igadgets loaded on demand caused by a wiring propagation

    // Creation of ALL Wirecloud variables regarding one workspace
    this.parseVariables(this.workSpace.workSpaceGlobalInfo);
}
