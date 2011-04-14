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

var ResponseCommand = function (response_command_processor, caller) {
  this.processor = response_command_processor;
  this.caller = caller;
  this.id = null;
  this.data = null;
}

// SETTERS
ResponseCommand.prototype.set_id = function (command_id) {
  this.id = command_id;
}

ResponseCommand.prototype.set_data = function (command_data) {
  this.data = command_data;
}

// GETTERS
ResponseCommand.prototype.get_id = function (command_id) {
  return this.id;
}

ResponseCommand.prototype.get_data = function (command_data) {
  return this.data;
}

// Process command
ResponseCommand.prototype.process = function () {
  this.processor.process(this);
}

