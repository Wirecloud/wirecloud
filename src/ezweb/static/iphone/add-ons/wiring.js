/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global Wiring */
"use strict";

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

// Special function to retrieve the related gadgets (used in the iphone prototype)
Wiring.prototype.getRelatedIgadgets = function (iGadgetId) {
    var events = this.iGadgets[iGadgetId].events,
        related = [],
        slots, slot, i, j;

    for (i = 0; i < events.length; i += 1) {
        slots = events[i].getFinalSlots();
        for (j = 0; j < slots.length; j += 1) {
            slot = slots[j];
            if (!related.elementExists(slot.iGadget)) {
                related.push(slot.iGadget);
            }
       }
    }

    return related;
};
