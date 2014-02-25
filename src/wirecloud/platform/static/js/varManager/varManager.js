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


function VarManager (_workspace) {

    VarManager.prototype.MAX_BUFFERED_REQUESTS = 10

    // ****************
    // PUBLIC METHODS
    // ****************

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
        }

        function onError(transport, e) {
            Wirecloud.GlobalLogManager.formatAndLog(gettext("Error saving variables to persistence: %(errorMsg)s."), transport, e);
        }

        // Max lenght of buffered requests have been reached. Uploading to server!
        if (this.iwidgetModifiedVars.length > 0) {
            var uri = Wirecloud.URLs.VARIABLE_COLLECTION.evaluate({workspace_id: this.workspace.id});

            var options = {
                method: 'POST',
                asynchronous: async,
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify(this.iwidgetModifiedVars),
                onSuccess: onSuccess.bind(this),
                onFailure: onError.bind(this),
                onException: onError.bind(this)
            };
            Wirecloud.io.makeRequest(uri, options);
            this.resetModifiedVariables();
        }
    }

    VarManager.prototype.removeIWidgetVariables = function (iwidget) {
        var i, variable_id, variable;

        for (variable_id in iwidget.properties) {
            variable = iwidget.properties[variable_id];
            for (i = 0; i < this.iwidgetModifiedVars.length; i++) {
                if (this.iwidgetModifiedVars[i].id == variable.id) {
                    this.iwidgetModifiedVars.splice(i, 1);
                }
            }
        }
    }

    VarManager.prototype.commitModifiedVariables = function() {
        //If it have not been buffered all the requests, it's not time to send a PUT request
        if (!this.force_commit && this.buffered_requests < VarManager.prototype.MAX_BUFFERED_REQUESTS) {
            this.buffered_requests++;
            return
        }

        this.sendBufferedVars();
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
        for (var j = 0; j < variables.length; j++) {
            var variable = variables[j];

            var modVar = this.findVariableInCollection(this.iwidgetModifiedVars, variable.id)
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

            this.iwidgetModifiedVars.push(varInfo);
        }
    }

    VarManager.prototype.resetModifiedVariables = function () {
        this.buffered_requests = 0;
        this.iwidgetModifiedVars = [];
        this.force_commit = false;
    }

    VarManager.prototype.forceCommit = function(){
        this.force_commit = true;
    }

    // *********************************
    // PRIVATE VARIABLES AND CONSTRUCTOR
    // *********************************

    this.workspace = _workspace;

    this.workspace.addEventListener('iwidgetremoved', function (iwidget) {
        this.removeIWidgetVariables(iwidget);
    }.bind(this));

    this.resetModifiedVariables();
}
