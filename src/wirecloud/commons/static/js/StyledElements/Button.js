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

/*global StyledElements, Wirecloud*/

(function () {

    "use strict";

    var clickCallback = function clickCallback(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.enabled) {
            this.events.click.dispatch(this);
        }
    };

    var keydownCallback = function keydownCallback(e) {
        if (this.enabled && e.keyCode === 13) {
            this.events.click.dispatch(this);
        }
    };

    var onmouseenter = function onmouseenter() {
        this.events.mouseenter.dispatch(this);
    };

    var onmouseleave = function onmouseleave() {
        this.events.mouseleave.dispatch(this);
    };

    var onfocus = function onfocus() {
        this.events.focus.dispatch(this);
    };

    var onblur = function onblur() {
        this.events.blur.dispatch(this);
    };

    /**
     *
     * Eventos que soporta este componente:
     *      - click: evento lanzado cuando se pulsa el botón.
     */
    var StyledButton = function StyledButton(options) {
        var defaultOptions = {
            'text': null,
            'title': '',
            'class': '',
            'plain': false,
            'iconHeight': 24,
            'iconWidth': 24,
            'icon': null,
            'iconClass': null,
            'usedInForm': false
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        // Necesario para permitir herencia
        if (options.extending) {
            return;
        }

        StyledElements.StyledElement.call(this, ['click', 'focus', 'blur', 'mouseenter', 'mouseleave']);

        if (options.usedInForm) {
            this.wrapperElement = document.createElement("button");
            this.wrapperElement.setAttribute('type', 'button');
        } else {
            this.wrapperElement = document.createElement("div");
        }
        this.wrapperElement.setAttribute('tabindex', '0');
        this.wrapperElement.className = StyledElements.Utils.appendWord(options['class'], "styled_button");

        if (options.id != null) {
            this.wrapperElement.setAttribute('id', options.id);
        }

        if (options.plain) {
            this.wrapperElement.classList.add('plain');
        }

        if (options.icon != null) {
            this.icon = document.createElement("img");
            this.icon.className = "icon";
            this.icon.style.width = options.iconWidth + 'px';
            this.icon.style.height = options.iconHeight + 'px';
            this.icon.src = options.icon;
            this.wrapperElement.appendChild(this.icon);
        }

        if (options.text != null || options.iconClass != null) {
            this.label = document.createElement('span');
            if (options.text != null) {
                this.label.appendChild(document.createTextNode(options.text));
            }
            if (options.iconClass != null) {
                this.label.classList.add(options.iconClass);
            }
            this.wrapperElement.appendChild(this.label);
        }

        if (options.title) {
            this.setTitle(options.title);
        }

        /* Event handlers */
        this._clickCallback = clickCallback.bind(this);
        this._keydownCallback = keydownCallback.bind(this);

        this.wrapperElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.addEventListener('click', this._clickCallback, true);
        this.wrapperElement.addEventListener('keydown', this._keydownCallback, false);
        this.wrapperElement.addEventListener('focus', onfocus.bind(this), true);
        this.wrapperElement.addEventListener('blur', onblur.bind(this), true);
        this.wrapperElement.addEventListener('mouseenter', onmouseenter.bind(this), false);
        this.wrapperElement.addEventListener('mouseleave', onmouseleave.bind(this), false);
    };
    StyledButton.prototype = new StyledElements.StyledElement();

    StyledButton.prototype.Tooltip = StyledElements.Tooltip;

    StyledButton.prototype.focus = function focus() {
        this.wrapperElement.focus();
    };

    StyledButton.prototype.blur = function blur() {
        this.wrapperElement.blur();
    };

    StyledButton.prototype.setLabel = function setLabel(label) {
        this.label.textContent = label;

        return this;
    };

    StyledButton.prototype.clearClassName = function clearClassName() {
        this.wrapperElement.className = 'styled_button';

        return this;
    };

    StyledButton.prototype.addIconClassName = function addIconClassName(classname) {
        this.label.classList.add(classname);
    };

    StyledButton.prototype.removeIconClassName = function removeIconClassName(classname) {
        this.label.classList.remove(classname);
    };

    StyledButton.prototype.setTitle = function setTitle(title) {
        if (title == null || title === '') {
            if (this.tooltip != null) {
                this.tooltip.destroy();
                this.tooltip = null;
            }
        } else {
            if (this.tooltip == null) {
                this.tooltip = new this.Tooltip({content: title, placement: ['bottom', 'top', 'right', 'left']});
                this.tooltip.bind(this);
            }
            this.tooltip.options.content = title;
        }
    };

    StyledButton.prototype.click = function click() {
        if (this.enabled) {
            this.events.click.dispatch(this);
        }
    };

    StyledButton.prototype.destroy = function destroy() {

        this.wrapperElement.removeEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.removeEventListener('click', this._clickCallback, true);
        this.wrapperElement.removeEventListener('keydown', this._keydownCallback, false);

        delete this._clickCallback;
        delete this._keydownCallback;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.StyledButton = StyledButton;
})();
