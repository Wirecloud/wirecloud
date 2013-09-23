/*
 *     Copyright (c) 2012 CoNWeT Lab., Universidad Politécnica de Madrid
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

(function () {

    var PolicyManager = {}, policy = {};

    Object.defineProperty(PolicyManager, 'evaluate', {
        value: function evaluate(context, action) {
            var context;

            // TODO: throw exceptions if policy info for a given context/action is not found.

            if (context in policy) {
                context = policy[context];
            } else {
                return true;
            }

            if (action in context) {
                return context[action];
            } else {
                return true;
            }
        }
    });

    Object.preventExtensions(PolicyManager);
    Object.defineProperty(Wirecloud, 'PolicyManager', {value: PolicyManager});

})();
