/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    const tutorials = [];
    const tutorialsById = {};

    const TutorialCatalogue = {};

    TutorialCatalogue.add = function add(id, tutorial) {
        if (!(tutorial instanceof Wirecloud.ui.Tutorial)) {
            throw new TypeError('tutorial must be an instance of Wirecloud.ui.Tutorial');
        }

        tutorials.push(tutorial);
        tutorialsById[id] = tutorial;
    };

    Object.defineProperty(TutorialCatalogue, 'tutorials', {
        get: function () { return tutorials; }
    });
    Object.defineProperty(TutorialCatalogue, 'get', {
        value: function get(id) { return tutorialsById[id]; }
    });
    Object.defineProperty(TutorialCatalogue, 'buildTutorialReferences', {
        value: function buildTutorialReferences(tutorial_list) {
            const description = document.createElement('p');
            description.textContent = utils.gettext('If you prefer, you can follow some of these tutorials:');

            const list = document.createElement('ul');
            for (let i = 0; i < tutorial_list.length; i++) {
                const tutorial = this.get(tutorial_list[i]);
                const item = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = tutorial.label;
                link.addEventListener('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.start();
                }.bind(tutorial));
                item.appendChild(link);
                list.appendChild(item);
            }
            return new StyledElements.Fragment([description, list]);
        }
    });
    Object.freeze(TutorialCatalogue);

    Wirecloud.TutorialCatalogue = TutorialCatalogue;

})(Wirecloud.Utils);
