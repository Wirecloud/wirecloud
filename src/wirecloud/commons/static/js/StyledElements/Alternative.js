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

/*global StyledElements*/

(function () {

    "use strict";

    /**
     * Este compontente representa al contenedor para una alternativa usable por el
     * componente StyledAlternatives.
     */
    var Alternative = function Alternative(id, options) {
        var defaultOptions;

        if (arguments.length == 0) {
            return;
        }

        defaultOptions = {
            useFullHeight: true
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        this.altId = id;

        /* call to the parent constructor */
        StyledElements.Container.call(this, options, ['show', 'hide']);

        this.wrapperElement.classList.add("hidden"); // TODO
    };
    Alternative.prototype = new StyledElements.Container({extending: true});

    Alternative.prototype.setVisible = function setVisible(newStatus) {
        if (newStatus) {
            this.wrapperElement.classList.remove("hidden");
            this.repaint(false);
            this.events['show'].dispatch(this);
        } else {
            this.wrapperElement.classList.add("hidden");
            this.repaint(false);
            this.events['hide'].dispatch(this);
        }
    };

    Alternative.prototype.isVisible = function isVisible(newStatus) {
        return !this.wrapperElement.classList.contains("hidden");
    };

    Alternative.prototype.getId = function getId() {
        return this.altId;
    };

    StyledElements.Alternative = Alternative;

})();
