/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    /**
     * Este compontente representa al contenedor para una alternativa usable por el
     * componente Alternatives.
     * @extends {Container}
     *
     * @param {Number} id
     *      [TODO: description]
     * @param {PlainObject} [options]
     *      [TODO: description]
     */
    var Alternative = function Alternative(id, options) {

        se.Container.call(this, options, ['hide', 'show']);

        this.addClassName('hidden');

        Object.defineProperties(this, {
            altId: {
                value: id
            }
        });
    };

    utils.inherit(Alternative, se.Container);

    /**
     * @override
     */
    Alternative.prototype._onhidden = function _onhidden(hidden) {

        if (!hidden) {
            this.repaint(false);
        }

        return se.Container.prototype._onhidden.call(this, hidden);
    };

    Alternative.prototype.setVisible = function setVisible(visible) {
        return visible ? this.show() : this.hide();
    };

    Alternative.prototype.isVisible = function isVisible() {
        return !this.hidden;
    };

    Alternative.prototype.getId = function getId() {
        return this.altId;
    };

    se.Alternative = Alternative;

})(StyledElements, StyledElements.Utils);
