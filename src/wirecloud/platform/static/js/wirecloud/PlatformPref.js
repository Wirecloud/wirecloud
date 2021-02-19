/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

/* globals Wirecloud */


(function () {

    "use strict";

    /**
     * abstract
     * @author jmostazo-upm
     *
     * @param {Wirecloud.PreferenceDef} preferenceDef
     * @param {Wirecloud.Preferences}   manager The preference Group this preference belongs to
     * @param {Boolean}       inherit Use the value from the parent preference group
     * @param {Object}        value   Current value
     */
    Wirecloud.PlatformPref = class PlatformPref {

        constructor(manager, preferenceDef, inherit, value) {
            Object.defineProperty(this, 'meta', {value: preferenceDef});
            Object.defineProperty(this, 'manager', {value: manager});

            this.inherit = inherit;
            if (value != null) {
                this.value = Wirecloud.ui.InputInterfaceFactory.parse(preferenceDef.options.type, value);
            } else {
                this.value = preferenceDef.default;
            }

            this.handlers = [];
        }

        getEffectiveValue() {
            if (this.inherit) {
                return this.manager.getParentValue(this.meta.name);
            }

            return this.value;
        }

        addHandler(handler) {
            this.handlers.push(handler);
        }

        _propagate() {
            // Handlers
            for (var i = 0; i < this.handlers.length; i++) {
                try {
                    this.handlers[i](this.scope, this.name, this.value);
                } catch (e) {
                    // FIXME
                }
            }
        }

        setDefaultValue() {
            this.setValue(this.definition.inputInterface.getDefaultValue());
        }

    }

})();
