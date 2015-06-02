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

        Object.defineProperty(this, 'active', {
            set: function (active) {
                active = !!active;

                if (this.active === active) {
                    return; // Nothing to do
                }

                if (active) {
                    this.wrapperElement.classList.add('active');
                    if (this.icon) {
                        this.icon.src = this._checkedIcon;
                    }
                    if (this.label) {
                        this.label.textContent = this._checkedText;
                    }
                } else {
                    this.wrapperElement.classList.remove('active');
                    if (this.icon) {
                        this.icon.src = this._icon;
                    }
                    if (this.label) {
                        this.label.textContent = this._text;
                    }
                }
            },
            get: function() {
                return this.wrapperElement.classList.contains('active');
            }
        });

        // Init status
        this.active = options.initiallyChecked;
    };
    StyledElements.ToggleButton.prototype = new StyledElements.StyledButton({extending: true});

    StyledElements.ToggleButton.prototype._clickCallback = function _clickCallback(event) {
        if (!this.enabled) {
            return;
        }

        event.stopPropagation();
        this.active = !this.active;
        this.events.click.dispatch(this);
    };

})();
