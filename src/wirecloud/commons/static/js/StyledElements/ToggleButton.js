/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*globals StyledElements */

(function () {

    "use strict";

    StyledElements.ToggleButton = function ToggleButton(options) {
        var defaultOptions = {
            'initiallyChecked': false
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        // Support hirerarchy
        if (options.extending) {
            return;
        }

        StyledElements.Button.call(this, options);

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

        Object.defineProperty(this, 'active', {
            get: function get() {
                return this.hasClassName('active');
            },
            set: function set(value) {
                this.toggleClassName('active', value)
                    ._onactive(value);
            }
        });

        // Init status
        this.active = options.initiallyChecked;
    };
    StyledElements.ToggleButton.prototype = new StyledElements.Button({extending: true});

    StyledElements.ToggleButton.prototype._onactive = function _onactive(active) {

        if (this.active !== active) {
            if (this.icon) {
                this.icon.src = active ? this._checkedIcon : this._icon;
            }

            if (this.label) {
                this.label.textContent = active ? this._checkedText : this._text;
            }
        }

        return this;
    };

    StyledElements.ToggleButton.prototype._clickCallback = function _clickCallback(event) {
        event.stopPropagation();
        this.click();
    };

    StyledElements.ToggleButton.prototype.click = function click() {

        if (this.enabled) {
            this.active = !this.active;
            this.trigger('click');
        }

        return this;
    };

})();
