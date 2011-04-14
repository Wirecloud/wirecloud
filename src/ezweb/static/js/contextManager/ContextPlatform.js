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

function ContextVar(igadgetId_, varName_, conceptName_) {
	this._igadgetId = igadgetId_;
	this._varName = varName_;
	this._conceptName = conceptName_;
	this._varManager = null;
	this._value = null;
}

ContextVar.prototype.getName = function () {
	return this._varName;
}

ContextVar.prototype.getIGadgetId = function () {
	return this._igadgetId;
}

ContextVar.prototype.getConceptName = function () {
	return this._conceptName;
}

ContextVar.prototype.getValue = function () {
	return this._value;
}

ContextVar.prototype.propagateValue = function () {
	this.setValue(this._value);
}

ContextVar.prototype.setValue = function (newValue_) {
	this._value = newValue_;
	if (this._varManager != null) {
		var variable = this._varManager.getVariableByName(this._igadgetId, this._varName)

		variable.annotate(newValue_);
		variable.set(newValue_);
	}
}

ContextVar.prototype._clearHandler = function () {
	if (this._varManager != null) {
		var variable = this._varManager.getVariableByName(this._igadgetId, this._varName)

		variable.setHandler(null);
	}
}

ContextVar.prototype.setVarManager = function (varManager_) {
	this._varManager = varManager_;
}

ContextVar.prototype.unload = function () {
	delete this._igadgetId;
	delete this._varName;
	delete this._conceptName;
	delete this._varManager;
	delete this._value;
}

//////////////////////////////////////////////////////////
// Concept
//////////////////////////////////////////////////////////
function Concept(semanticConcept, type, adaptor) {
	this._semanticConcept = semanticConcept;
	this._type = type;
	this._adaptor = adaptor;
	this._value = null;
	this._initialValue = null;

	this._igadgetVars = new Object();
}

// Known concept types
Concept.prototype.EXTERNAL = 'ECTX';
Concept.prototype.IGADGET = 'GCTX';

// Known concepts
Concept.prototype.USERNAME = "username";
Concept.prototype.LANGUAGE = "language";
Concept.prototype.WIDTH = "width";
Concept.prototype.WIDTHINPIXELS = "widthInPixels";
Concept.prototype.HEIGHT = "height";
Concept.prototype.HEIGHTINPIXELS = "heightInPixels";
Concept.prototype.XPOSITION = "xPosition";
Concept.prototype.YPOSITION = "yPosition";
Concept.prototype.LOCKSTATUS = "lockStatus";
Concept.prototype.ORIENTATION = "orientation";
Concept.prototype.TWITTERAUTH = "twitterauth";
Concept.prototype.THEME = "theme";

/**
 * @private
 */
Concept.prototype._initAdaptor = function (ivar_) {
	if (ivar_ == null) {
		// Adaptor of External Context variable doesn't receives any parameter
		eval ('new ' + this._adaptor + "()");
	} else {
		// Adaptor of Gadget Context variable receives the IGadget as parameter
		eval ('new ' + this._adaptor + "("+ ivar_.getIGadgetId() +")");
	}
}

Concept.prototype.getSemanticConcept = function () {
	return this._semanticConcept;
}

Concept.prototype.getAdaptor = function () {
	return this._adaptor;
}

Concept.prototype.getValue = function () {
	if (this._type == Concept.prototype.EXTERNAL) {
		return this._value;
	}
	throw gettext("Concept does not have value, this is a Gadget Concept.");
}

Concept.prototype.setValue = function (value_) {
	switch (this._type) {
		case Concept.prototype.IGADGET:
			throw gettext("Concept does not have value, this is a Gadget Concept.");
			break;
		default:
			this._value = value_;
			for (var i = 0; i < this._igadgetVars.length; i++){
				var ivar = this._igadgetVars[i];
				ivar.setValue(value_);
			}
			break;
	}
}

/**
 * This function only can be used with platform concepts
 *
 * @private
 */
Concept.prototype._setInitialValue = function (initialValue) {
	this._value = initialValue;
}

Concept.prototype.propagateIGadgetVarValues = function (iGadget) {
	var ivar = this._igadgetVars[iGadget.getId()];
	if (ivar != null)
		ivar.propagateValue();
}

Concept.prototype.addIGadgetVar = function (ivar) {
	switch (this._type) {
		case Concept.prototype.EXTERNAL:
			var iGadgetId = ivar.getIGadgetId();
			/* FIXME error control
			if (this._igadgetVars[iGadgetId] !== null)
				
			*/
			this._igadgetVars[iGadgetId] = ivar;

			if (this._value != null) {
				ivar.setValue(this._value);
			} else {
				if (this._adaptor)
					this._initAdaptor(null);
			}
			break;
		case Concept.prototype.IGADGET:
			var iGadgetId = ivar.getIGadgetId();
			/* FIXME error control
			if (this._igadgetVars[iGadgetId] !== null)
				
			*/
			this._igadgetVars[iGadgetId] = ivar;
			if (this._adaptor)
				this._initAdaptor(ivar);
			break;
		default:
			throw gettext("Unexpected igadget variables. Concept does not have type yet.");
			break;
	}
}

Concept.prototype.deleteIGadgetVars = function (iGadgetId) {
	delete this._igadgetVars[iGadgetId];
}

/**
 * Returns the iGadget variable assigned to this concept. This method will
 * return <code>null</code> if the given iGadget does not have any variable
 * assigend to this concept.
 *
 * @param {Number} iGadgetId id of the igadget
 * @return {ContextVar}
 */
Concept.prototype.getIGadgetVar = function (iGadgetId) {
	switch (this._type) {
		case Concept.prototype.EXTERNAL:
		case Concept.prototype.IGADGET:
			var ivar = this._igadgetVars[iGadgetId];
			return ivar;
		default:
			throw gettext("Concept does not have type yet.");
	}
}

Concept.prototype.unload = function () {
	// Delete all the igadget variables related to this concept
	for (var iGadgetId in this._igadgetVars)
		this._igadgetVars[keys[i]].unload();
}
