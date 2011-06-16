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
        outputs, i;

    for (i = 0; i < events.length; i += 1) {
        outputs = events[i].outputs; //gadget outputs
        this.getRelatedOutputs(outputs, related);

    }

    return related;
};

Wiring.prototype.getRelatedOutputs = function (outputs, related) {
    var o, id, channelOutputs, j, k;

    for (j = 0; j < outputs.length; j += 1) {
        o = outputs[j];
        if (o.outputs) { //it is a channel
            channelOutputs = o.outputs;
            for (k = 0; k < channelOutputs.length; k += 1) { //channel outputs -> slots or channels
                if (channelOutputs[k].outputs) { //it is a channel
                    this.getRelatedOutputs([channelOutputs[k]], related);
                } else { //it is a slot
                    id = channelOutputs[k].variable.iGadget;
                    if (!related.elementExists(id)) { //the iGadgetId is not in the related list already
                        related.push(id); //add to the related igadgets list the iGadgetId associated with the channel outputs
                    }
                }
            }
        }
    }
};
