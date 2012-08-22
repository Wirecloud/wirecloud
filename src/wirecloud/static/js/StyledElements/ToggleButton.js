/*globals EzWebExt, StyledElements */

(function () {

    "use strict";

    StyledElements.ToggleButton = function ToggleButton(options) {
        var defaultOptions = {
            'initiallyChecked': false
        };
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledButton.call(this, options);

        if (options.checkedIcon == null) {
            options.checkedIcon = options.icon;
        }

        if (options.checkedText == null) {
            options.checkedText = options.text;
        }

        this._icon = options.icon;
        this._checkedIcon = options.checkedIcon;

        this._text = options.text;
        this._checkedText = options.checkedText;

        this._checked = false;
        this.setChecked(options.initiallyChecked);
    };
    StyledElements.ToggleButton.prototype = new StyledElements.StyledButton({extending: true});

    StyledElements.ToggleButton.prototype.isChecked = function isChecked(checked) {
        return this._checked;
    };

    StyledElements.ToggleButton.prototype.setChecked = function setChecked(checked) {
        if (checked == this.isChecked()) {
            return; // Nothing to do
        }

        if (checked) {
            EzWebExt.addClassName(this.wrapperElement, 'checked');
            if (this.icon) {
                this.icon.src = this._checkedIcon;
            }
            if (this.label) {
                EzWebExt.setTextContent(this.label, this._checkedText);
            }
        } else {
            EzWebExt.removeClassName(this.wrapperElement, 'checked');
            if (this.icon) {
                this.icon.src = this._icon;
            }
            if (this.label) {
                EzWebExt.setTextContent(this.label, this._text);
            }
        }
        this._checked = checked;
    };

    StyledElements.ToggleButton.prototype._clickCallback = function _clickCallback(event) {
        if (!this.enabled) {
            return;
        }

        event.stopPropagation();
        this.setChecked(!this.isChecked());
        this.events.click.dispatch(this);
    };

})();
