/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    /**
     *
     * Eventos que soporta este componente:
     *      - click: evento lanzado cuando se pulsa el botón.
     */
    var StyledButton = function StyledButton(options) {
        var button, defaultOptions = {
            'text': null,
            'title': '',
            'class': '',
            'plain': false,
            'iconHeight': 24,
            'iconWidth': 24,
            'icon': null,
            'usedInForm': false
        };
        options = EzWebExt.merge(defaultOptions, options);

        // Necesario para permitir herencia
        if (options.extending) {
            return;
        }

        StyledElements.StyledElement.call(this, ['click']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = EzWebExt.appendWord(options['class'], "styled_button");

        if (options.usedInForm) {
            button = document.createElement("button");
            button.setAttribute('type', 'button');
            this.wrapperElement.appendChild(button);
        } else if (options.plain) {
            button = this.wrapperElement;
            EzWebExt.addClassName(this.wrapperElement, 'plain');
        } else {
            button = document.createElement("div");
            this.wrapperElement.appendChild(button);
        }
        button.setAttribute('tabindex', '0');

        if (options.title) {
            button.setAttribute('title', options.title);
        }

        if (options.icon != null) {
            this.icon = document.createElement("img");
            this.icon.className = "icon";
            this.icon.style.width = options.iconWidth + 'px';
            this.icon.style.height = options.iconHeight + 'px';
            this.icon.src = options.icon;
            button.appendChild(this.icon);
        }


        if (options.text != null) {
            this.label = document.createElement('span');
            this.label.appendChild(document.createTextNode(options.text));
            button.appendChild(this.label);
        }

        /* Event handlers */
        EzWebExt.addEventListener(button, 'mousedown', EzWebExt.stopPropagationListener, true);
        EzWebExt.addEventListener(button, 'click', EzWebExt.bind(this._clickCallback, this), true);
        this.buttonElement = button;
    };
    StyledButton.prototype = new StyledElements.StyledElement();

    StyledButton.prototype._clickCallback = function _clickCallback(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.enabled) {
            this.events.click.dispatch(this);
        }
    };

    StyledButton.prototype.focus = function focus() {
        this.buttonElement.focus();
    };

    StyledButton.prototype.setLabel = function setLabel(label) {
        this.label.textContent = label;
    };

    StyledButton.prototype.setTitle = function setTitle(title) {
        this.buttonElement.setAttribute('title', title);
    };

    StyledElements.StyledButton = StyledButton;
})();
