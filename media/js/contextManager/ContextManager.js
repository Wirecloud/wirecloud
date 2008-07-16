/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2004 Telefónica Investigación y Desarrollo 
 *     S.A.Unipersonal (Telefónica I+D) 
 * 
 * Info about members and contributors of the MORFEO project 
 * is available at: 
 * 
 *   http://morfeo-project.org/
 * 
 * This program is free software; you can redistribute it and/or modify 
 * it under the terms of the GNU General Public License as published by 
 * the Free Software Foundation; either version 2 of the License, or 
 * (at your option) any later version. 
 * 
 * This program is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
 * GNU General Public License for more details. 
 * 
 * You should have received a copy of the GNU General Public License 
 * along with this program; if not, write to the Free Software 
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
 * 
 * If you want to use this software an plan to distribute a 
 * proprietary application in any way, and you are not licensing and 
 * distributing your source code under GPL, you probably need to 
 * purchase a commercial license of the product.  More info about 
 * licensing options is available at: 
 * 
 *   http://morfeo-project.org/
 */


function ContextManager (workspace_, workSpaceInfo_) {
	
	
	// ***********************
	// PRIVATED FUNCTIONS 
	// ***********************
	
	// Adds all variables from workspace data model
	this._addContextVarsFromTemplate = function (cVars_, type_) {
		for (var i = 0; i < cVars_.size(); i++){
			var cVar = cVars_[i];
			cVar.setVarManager(this._workspace.getVarManager());
			if (this._name2Concept[cVar.getConceptName()] == null){
				var msg = interpolate(gettext("Context variable") + " [" + cVar.getName() + "] " + gettext("without related concept. Its value cannot be established: %(errorMsg)s."), {errorMsg: transport.status}, true);
				LogManagerFactory.getInstance().log(msg);
				return;
			}
			var relatedConcept = this._concepts[this._name2Concept[cVar.getConceptName()]];
			relatedConcept.setType(type_);
			relatedConcept.addIGadgetVar(cVar);							
		}
	}

	// Loads all concept from workspace data model. 
	this._loadConceptsFromWorkspace = function (workSpaceInfo_) {
		
		this._concepts = new Hash();
		this._name2Concept = new Hash();
		
		var conceptsJson = workSpaceInfo_['workspace']['concepts'];

		// Parses concepts json
		for (var i = 0; i < conceptsJson.length; i++) {
			var curConcept = conceptsJson[i];
			// Creates the concept
			if (curConcept.adaptor){
				var concept = new Concept(curConcept.concept, curConcept.adaptor);
			} else {
				var concept = new Concept(curConcept.concept, null);
			}
			this._concepts[curConcept.concept] = concept;

			// Sets the concept value
			if (curConcept.value){
				concept.setInitialValue(curConcept.value)
			}			 
			
			// Relates the concept name to all its concept
			for (var j = 0; j < curConcept.names.length; j++) {
				var cname = curConcept.names[j];
				
				if (this._name2Concept[cname] != null){
					var msg = interpolate(gettext("WARNING: concept name") + " '" + cname + "' " + gettext("is already related to") + " '" + this._name2Concept[cname] + "'. " + gettext("New related concept is") + " '" + curConcept.concept + "' %(errorMsg)s.", {errorMsg: transport.status}, true);
					LogManagerFactory.getInstance().log(msg);
				}
				this._name2Concept[cname] = curConcept.concept;	
			}	
		}
	}
	
	// Load igadget's context variables from workspace data model
	this._loadIGadgetContextVarsFromWorkspace = function (workSpaceInfo) {
		
		var tabs = workSpaceInfo['workspace']['tabList'];
		
		// Tabs in workspace
		for (var i=0; i<tabs.length; i++) {
			var currentTab = tabs[i]; 
			var igadgets = currentTab.igadgetList;
			
			// igadgets in tab
			for (var j=0; j<igadgets.length; j++) {
				var currentIGadget = igadgets[j];
				var variables = currentIGadget['variables'];
				
				// Variables of igadgets
				for (var k = 0; k < variables.length; k++) {
				var currentVar = variables[k];
					switch (currentVar.aspect) {
					case Variable.prototype.EXTERNAL_CONTEXT:
					case Variable.prototype.GADGET_CONTEXT:
						var contextVar = new ContextVar(currentIGadget.id, currentVar.name, currentVar.concept)
						contextVar.setVarManager(this._workspace.getVarManager());
						var relatedConcept = this._concepts[this._name2Concept[currentVar.concept]];
						if (relatedConcept){
							relatedConcept.setType(currentVar.aspect);
							relatedConcept.addIGadgetVar(contextVar);								
						}
						break;
					default:
						break;
					}
				}
			}
		}
		
		// Continues loading next module								
		this._loaded = true;
	}
	
	// ****************
	// PUBLIC METHODS 
	// ****************
	
	ContextManager.prototype.addInstance = function (iGadget_, template_) {
		if (!this._loaded)
		    return;
		
		if (template_ == null)
			return;

		this._addContextVarsFromTemplate(template_.getExternalContextVars(iGadget_.id), Concept.prototype.EXTERNAL);
		this._addContextVarsFromTemplate(template_.getGadgetContextVars(iGadget_.id), Concept.prototype.IGADGET);
	}
	
	
	ContextManager.prototype.propagateInitialValues = function (iGadgetId_) {
		if (! this._loaded)
		    return;
	
		var keys = this._concepts.keys();
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			this._concepts[key].propagateIGadgetVarValues(iGadgetId_);
		}
	}

	ContextManager.prototype.removeInstance = function (iGadgetId_) {
		if (! this._loaded)
		    return;
	
		var keys = this._concepts.keys();
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			this._concepts[key].deleteIGadgetVars(iGadgetId_);
		}
	}

	ContextManager.prototype.notifyModifiedConcept = function (concept_, value_) {
		if (! this._loaded)
		    return;
			
		if (! this._concepts[concept_])
			return;
			
		this._concepts[concept_].setValue(value_);
	}
	
	ContextManager.prototype.notifyModifiedGadgetConcept = function (igadgetid_, concept_, value_, preLoaded_) {
		if (! this._loaded)
		    return;
			
		if (! this._concepts[concept_])
			return;
			
		try{
			if (preLoaded_){
				this._concepts[concept_].getIGadgetVar(igadgetid_).setPreloadedValue(value_);
			}else{
				this._concepts[concept_].getIGadgetVar(igadgetid_).setValue(value_);	
			}
		}catch(e){
			// Do nothing, igadget has not variables related to this concept
		}
	}
	
	ContextManager.prototype.getWorkspace = function () {
		return this._workspace;
	}	


	ContextManager.prototype.unload = function () {

		// Delete all concept names
		var namekeys = this._name2Concept.keys();
		for (var i=0; i<namekeys.length; i++) {
			delete this._name2Concept[namekeys[i]];
		}
		delete this._name2Concept;
		
		// Delete all the concepts
		var conceptkeys = this._concepts.keys();
		for (var j=0; i<conceptkeys.length; j++) {
			this._concepts[conceptkeys[j]].unload();
			delete this._concepts[conceptkeys[j]];		
		}
		delete this._concepts;

		// Delete all the ContextManager attributes
		delete this._loaded;
		delete this._workspace;

		delete this;
	}


	// *********************************************
	// PRIVATE VARIABLES AND CONSTRUCTOR OPERATIONS
	// *********************************************

	this._loaded = false;
	this._concepts = new Hash();     // a concept is its adaptor an its value
	this._name2Concept = new Hash(); // relates the name to its concept
	this._workspace = workspace_;
		
	// Load all igadget context variables and concepts (in this order!)
	this._loadConceptsFromWorkspace (workSpaceInfo_);
	this._loadIGadgetContextVarsFromWorkspace (workSpaceInfo_);
}