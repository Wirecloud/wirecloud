/*
 *     Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements, Wirecloud*/

(function () {

    "use strict";

    /**
     * Este componente permite crear un contenedor en el que añadir otros
     * componentes.
     *
     * @param options
     * @param events
     */
    var Container = function Container(options, events) {
        var defaultOptions = {
            'extending': false,
            'class': '',
            'useFullHeight': false
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        // Necesario para permitir herencia
        if (options.extending) {
            return;
        }

        StyledElements.StyledElement.call(this, events);

        this.useFullHeight = options.useFullHeight;
        this.wrapperElement = document.createElement("div");
        this.children = [];

        if (options.id) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.wrapperElement.className = StyledElements.Utils.prependWord(options['class'], "container");
    };
    Container.prototype = new StyledElements.StyledElement();

    Container.prototype.appendChild = function appendChild(element, refElement) {
        if (element instanceof StyledElements.StyledElement) {
            element.insertInto(this.wrapperElement, refElement);
            this.children.push(element);
        } else {
            if (refElement instanceof StyledElements.StyledElement) {
                refElement = refElement.wrapperElement;
            }

            if (refElement != null) {
                this.wrapperElement.insertBefore(element, refElement);
            } else {
                this.wrapperElement.appendChild(element);
            }
        }
    };

    Container.prototype.removeChild = function appendChild(element) {
        var index;
        if (element instanceof StyledElements.StyledElement) {
            index = this.children.indexOf(element);
            this.children.splice(index, 1);
            this.wrapperElement.removeChild(element.wrapperElement);
        } else {
            this.wrapperElement.removeChild(element);
        }
    };

    Container.prototype.repaint = function repaint(temporal) {
        temporal = temporal !== undefined ? temporal : false;

        if (this.useFullHeight) {
            if (this.wrapperElement.classList.contains('hidden')) {
                this.wrapperElement.style.height = "";
                return;
            }

            var height = this._getUsableHeight();
            if (height == null) {
                return; // nothing to do
            }

            this.wrapperElement.style.height = (height + "px");
        }

        for (var i = 0; i < this.children.length; i++) {
            this.children[i].repaint(temporal);
        }

        if (this.disabledLayer != null) {
            this.disabledLayer.style.height = this.wrapperElement.scrollHeight + 'px';
            this.disabledLayer.style.lineHeight = this.wrapperElement.clientHeight + 'px';
        }
    };

    /**
     * Elimina el contenido de este contenedor.
     */
    Container.prototype.clear = function clear() {
        this.children = [];
        this.wrapperElement.innerHTML = "";
        if (this.disabledLayer != null) {
            this.wrapperElement.appendChild(this.disabledLayer);
        }
    };

    /**
     * Devuelve <code>true</code> si este Componente está deshabilitado.
     */
    Container.prototype.isDisabled = function isDisabled() {
        return this.disabledLayer != null;
    };

    /**
     * Deshabilita/habilita este contenedor. Cuando un contenedor
     */
    Container.prototype.setDisabled = function setDisabled(disabled) {
        if (this.isDisabled() == disabled) {
            // Nothing to do
            return;
        }

        if (disabled) {
            this.disabledLayer = document.createElement('div');
            this.disabledLayer.className = 'disable-layer';

            this.disabled_icon = document.createElement('i');
            this.disabled_icon.className = 'disable-icon icon-spin icon-spinner';
            this.disabledLayer.appendChild(this.disabled_icon);

            this.wrapperElement.appendChild(this.disabledLayer);
            this.wrapperElement.classList.add('disabled');
            this.disabledLayer.style.height = this.wrapperElement.scrollHeight + 'px';
            this.disabledLayer.style.lineHeight = this.wrapperElement.clientHeight + 'px';
        } else {
            this.wrapperElement.classList.remove('disabled');
            this.disabledLayer.parentNode.removeChild(this.disabledLayer);
            this.disabledLayer = null;
            this.disable_icon = null;
        }
        this.enabled = !disabled;
    };

    Container.prototype.enable = function enable() {
        this.setDisabled(false);
    };

    Container.prototype.disable = function disable() {
        this.setDisabled(true);
    };

    StyledElements.Container = Container;

})();
