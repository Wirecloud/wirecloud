/**
 *
 * Eventos que soporta este componente:
 *      - click: evento lanzado cuando se pulsa el botón.
 */
StyledElements.StyledButton = function(options) {
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

    if (options.title) {
        button.setAttribute('title', options.title);
    }

    if (options.icon != null) {
        this.icon = document.createElement("img");
        this.icon.className = "icon";
        this.icon.style.width = options['iconWidth'] + 'px';
        this.icon.style.height = options['iconHeight'] + 'px';
        this.icon.src = options.icon;
        button.appendChild(this.icon);
    }


    if (options.text !== null) {
        this.label = document.createElement('span');
        this.label.appendChild(document.createTextNode(options.text));
        button.appendChild(this.label);
    }

    /* Event handlers */
    EzWebExt.addEventListener(button, 'mousedown', EzWebExt.stopPropagationListener, true);
    EzWebExt.addEventListener(button, 'click', EzWebExt.bind(this._clickCallback, this), true);
    this.buttonElement = button;
};
StyledElements.StyledButton.prototype = new StyledElements.StyledElement();

StyledElements.StyledButton.prototype._clickCallback = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.enabled) {
        this.events['click'].dispatch(this);
    }
};

StyledElements.StyledButton.prototype.setLabel = function(label) {
    this.label.textContent = label;
};

StyledElements.StyledButton.prototype.setTitle = function(title) {
    this.buttonElement.setAttribute('title', title);
};
