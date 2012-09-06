/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/**
 * @author aarranz
 */
function UserPref(varName, type, options) {
    Object.defineProperty(this, 'varName', {value: varName});
    Object.defineProperty(this, 'type', {value: type});
    Object.defineProperty(this, 'label', {value: options.label});
    Object.defineProperty(this, 'description', {value: options.description});
    Object.defineProperty(this, 'options', {value: options});

    if (options.default_value == null) {
        Object.defineProperty(this, 'defaultValue', {value: ''});
    } else {
        Object.defineProperty(this, 'defaultValue', {value: options.default_value});
    }
}

/**
 * Checks whether this preference is hidden for the given iWidget
 *
 * @param {VariableManager} varManager
 * @param {Number} iWidgetId id of the iWidget to check
 */
UserPref.prototype.isHidden = function (iWidget) {
    var varManager, variable;

    varManager = iWidget.layout.dragboard.workspace.varManager;
    variable = varManager.getVariableByName(iWidget.getId(), this.varName);

    return variable.hidden;
};

UserPref.prototype.getInterfaceDescription = function getInterfaceDescription (iWidget) {
    // TODO
    var varManager = iWidget.layout.dragboard.workspace.varManager;

    var variable, desc;

    variable = varManager.getVariableByName(iWidget.getId(), this.varName);

    desc = EzWebExt.merge(this.options, {
        'type': this.type,
        'disabled': variable.readOnly,
        'initialValue': variable.get(),
        'required': true,
    });

    if (this.type === 'select') {
        desc.initialEntries = this.options.value_options;
    }

    return desc;
};

//////////////////////////////////////////////
// PUBLIC CONSTANTS
//////////////////////////////////////////////
UserPref.prototype.TEXT    = "S"; // "S"tring
UserPref.prototype.INTEGER = "N"; // "N"umber
UserPref.prototype.DATE    = "D"; // "D"ate
UserPref.prototype.LIST    = "L"; // "L"ist
UserPref.prototype.BOOLEAN = "B"; // "B"oolean
UserPref.prototype.PASSWORD = "P"; // "P"assword
