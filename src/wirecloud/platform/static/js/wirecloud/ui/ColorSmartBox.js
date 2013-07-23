/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global */
(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/

    var ColorSmartBox = function ColorSmartBox(connections, mainDiv, type) {
        var i, newBox, subBoxesList, width, leftDiv, rightDiv, southDiv,
            northDiv, subBox, subBoxesByConnectionId;

        // Main Box
        this.wrapperElement = mainDiv;
        this.wrapperElement.classList.add('smartBox');

        // SubBoxes
        subBoxesList = [];
        subBoxesByConnectionId = {};
        for (i = 0; i < connections.length; i += 1) {
            // Create SubSmartBox
            newBox = document.createElement('div');
            newBox.classList.add('subSmartBox');
            newBox.textContent = connections[i];

            // Assign color
            newBox.classList.add('previewColor' + (connections[i] % 12));
            subBoxesList.push(newBox);

            // Add the box to subBoxesByConnectionId
            subBoxesByConnectionId[connections[i]] = newBox;
        }

        // Only 1 color
        if (subBoxesList.length == 1) {
            subBoxesList[0].classList.add('full');
            this.wrapperElement.appendChild(subBoxesList[0]);

        // Only 2 colors
        } else if (subBoxesList.length == 2) {
            this.wrapperElement.appendChild(subBoxesList[0]);
            subBoxesList[0].classList.add('half');
            this.wrapperElement.appendChild(subBoxesList[1]);
            subBoxesList[1].classList.add('half');

        // 3 colors or more
        } else {

            // Odd
            if ((subBoxesList.length % 2) == 1) {
                subBox = subBoxesList.pop();
                this.wrapperElement.appendChild(subBox);
                subBox.classList.add('half');
            }

            rightDiv = document.createElement('div');
            rightDiv.classList.add('rightDiv');
            this.wrapperElement.appendChild(rightDiv);

            northDiv = document.createElement('div');
            northDiv.classList.add("northDiv");
            rightDiv.appendChild(northDiv);

            southDiv = document.createElement('div');
            southDiv.classList.add("southDiv");
            rightDiv.appendChild(southDiv);

            for (i = subBoxesList.length - 1; i >= 0; i -= 1) {
                if ((i % 2) === 1) {
                    // Odd
                    northDiv.appendChild(subBoxesList[i]);
                } else {
                    // Pair
                    southDiv.appendChild(subBoxesList[i]);
                }
            }
        }
        return subBoxesByConnectionId;
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/


    /*************************************************************************
     * Public methods
     *************************************************************************/


    /*************************************************************************
     * Make WiringPreview public
     *************************************************************************/
    Wirecloud.ui.ColorSmartBox = ColorSmartBox;

})();
