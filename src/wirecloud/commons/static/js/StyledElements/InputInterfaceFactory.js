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

/*global InputInterface, StyledElements*/

(function () {

    "use strict";

    var default_mapping = {
        'boolean': BooleanInputInterface,
        'text': TextInputInterface,
        'version': StyledElements.VersionInputInterface,
        'password': PasswordInputInterface,
        'hidden': HiddenInputInterface,
        'list': ListInputInterface,
        'number': NumberInputInterface,
        'longtext': LongTextInputInterface,
        'url': URLInputInterface,
        'email': EMailInputInterface,
        'select': SelectInputInterface,
        'buttons': ButtonGroupInputInterface,
        'file': FileInputInterface,
        'fieldset': FieldSetInterface,
        'multivalued': MultivaluedInputInterface
    };

    var InputInterfaceFactory = function InputInterfaceFactory() {

        var mapping = StyledElements.Utils.clone(default_mapping);

        this.createInterface = function createInterface(fieldId, fieldDesc) {
            var Class_ = mapping[fieldDesc.type];
            if (Class_ == null) {
                throw new Error(fieldDesc.type);
            }
            var instance = new Class_(fieldId, fieldDesc, this);
            if (fieldDesc.initiallyDisabled) {
                instance.disable();
            }
            return instance;
        };

        this.addFieldType = function addFieldType(type, class_) {
            if (!class_ instanceof InputInterface) {
                throw new TypeError();
            }
            if (mapping[type] !== undefined) {
                throw new Error();
            }

            mapping[type] = class_;
        };

        this.parse = function parse(type, value) {
            if (mapping[type] == null) {
                throw new TypeError('Invalid data type');
            }
            return mapping[type].parse(value);
        };

        this.stringify = function stringify(type, value) {
            if (mapping[type] == null) {
                throw new TypeError('Invalid data type');
            }
            return mapping[type].stringify(value);
        };
    };

    StyledElements.InputInterfaceFactory = InputInterfaceFactory;

})();
