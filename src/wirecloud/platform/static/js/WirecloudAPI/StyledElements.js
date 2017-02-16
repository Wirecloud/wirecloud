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

/* globals MashupPlatform */


(function () {

    "use strict";

    // StyledElements
    var RealStyledElements = window.parent.StyledElements;
    var platform = window.parent;
    var iwidget = MashupPlatform.priv.resource;

    window.StyledElements = {
        'Accordion': window.parent.StyledElements.Accordion,
        'Addon': window.parent.StyledElements.Addon,
        'Alternatives': window.parent.StyledElements.Alternatives,
        'BorderLayout': window.parent.StyledElements.BorderLayout,
        'ButtonsGroup': window.parent.StyledElements.ButtonsGroup,
        'CheckBox': window.parent.StyledElements.CheckBox,
        'Container': window.parent.StyledElements.Container,
        'DynamicMenuItems': window.parent.StyledElements.DynamicMenuItems,
        'Event': window.parent.StyledElements.Event,
        'Fragment': window.parent.StyledElements.Fragment,
        'Form': window.parent.StyledElements.Form,
        'GUIBuilder': window.parent.StyledElements.GUIBuilder,
        'HorizontalLayout': window.parent.StyledElements.HorizontalLayout,
        'InputElement': window.parent.StyledElements.InputElement,
        'List': window.parent.StyledElements.List,
        'MenuItem': window.parent.StyledElements.MenuItem,
        'NumericField': window.parent.StyledElements.NumericField,
        'ObjectWithEvents': window.parent.StyledElements.ObjectWithEvents,
        'PaginatedSource': window.parent.StyledElements.PaginatedSource,
        'PaginationInterface': window.parent.StyledElements.PaginationInterface,
        'PasswordField': window.parent.StyledElements.PasswordField,
        'RadioButton': window.parent.StyledElements.RadioButton,
        'Select': window.parent.StyledElements.Select,
        'Separator': window.parent.StyledElements.Separator,
        'StaticPaginatedSource': window.parent.StyledElements.StaticPaginatedSource,
        'StyledAlternatives': window.parent.StyledElements.Alternatives, // backward compatibility alias
        'StyledCheckBox': window.parent.StyledElements.CheckBox, // backward compatibility alias
        'StyledElement': window.parent.StyledElements.StyledElement,
        'StyledInputElement': window.parent.StyledElements.InputElement, // backward compatibility alias
        'StyledList': window.parent.StyledElements.List, // backward compatibility alias
        'StyledNumericField': window.parent.StyledElements.NumericField, // backward compatibility alias
        'StyledPasswordField': window.parent.StyledElements.PasswordField, // backward compatibility alias
        'StyledRadioButton': window.parent.StyledElements.RadioButton, // backward compatibility alias
        'StyledSelect': window.parent.StyledElements.Select, // backward compatibility alias
        'StyledTextArea': window.parent.StyledElements.TextArea, // backward compatibility alias
        'StyledTextField': window.parent.StyledElements.TextField, // backward compatibility alias
        'TextArea': window.parent.StyledElements.TextArea,
        'TextField': window.parent.StyledElements.TextField,
        'VerticalLayout': window.parent.StyledElements.VerticalLayout
    };

    var extend = function (parent_class, extra) {
        var new_class = {};

        new_class[parent_class.name] = function () {
            parent_class.apply(this, arguments);
        };
        new_class = new_class[parent_class.name];

        platform.StyledElements.Utils.inherit(new_class, parent_class, extra);
        return new_class;
    };

    var proxy_method = function (wrapper, instance, method) {
        wrapper[method] = function () {
            instance[method].apply(instance, arguments);

            return wrapper;
        };
    };

    var proxy_getter = function (wrapper, instance, method) {
        wrapper[method] = function () {
            return instance[method].apply(instance, arguments);
        };
    };

    /* PopupMenu */
    var PopupMenu = function PopupMenu(options) {
        var menu = new RealStyledElements.PopupMenu(options);

        proxy_method(this, menu, 'append');

        this.show = function show(refPosition) {
            var position = iwidget.wrapperElement.getBoundingClientRect();

            refPosition = {
                top: refPosition.top + position.top + platform.document.body.scrollTop,
                left: refPosition.left + position.left + platform.document.body.scrollLeft,
                width: refPosition.width,
                height: refPosition.height
            };
            refPosition.right = refPosition.left + refPosition.width;
            refPosition.bottom = refPosition.top + refPosition.height;
            Object.freeze(refPosition);

            menu.show(refPosition);

            return this;
        };

        this.moveFocusDown = function moveFocusDown() {
            menu.moveFocusDown();

            return this;
        };

        this.moveFocusUp = function moveFocusUp() {
            menu.moveFocusUp();

            return this;
        };

        this.hasEnabledItem = function hasEnabledItem() {
            return menu.hasEnabledItem();
        };

        proxy_method(this, menu, 'addEventListener');
        proxy_method(this, menu, 'hide');
        proxy_getter(this, menu, 'isVisible');
        proxy_method(this, menu, 'off');
        proxy_method(this, menu, 'on');
        proxy_method(this, menu, 'removeEventListener');

        this.destroy = function destroy() {
            menu = null;
        };
    };
    PopupMenu.prototype = new window.StyledElements.StyledElement();
    window.StyledElements.PopupMenu = PopupMenu;

    /* Popover */

    var Popover = function Popover(options) {
        var popover = new RealStyledElements.Popover(options);

        Object.defineProperty(this, 'visible', {
            get: function () {
                return popover.visible;
            }
        });

        this.show = function show(refPosition) {
            var position = iwidget.wrapperElement.getBoundingClientRect();

            if ('getBoundingClientRect' in refPosition) {
                refPosition = refPosition.getBoundingClientRect();
            }

            refPosition = {
                top: refPosition.top + position.top + platform.document.body.scrollTop,
                left: refPosition.left + position.left + platform.document.body.scrollLeft,
                width: refPosition.width,
                height: refPosition.height
            };
            refPosition.right = refPosition.left + refPosition.width;
            refPosition.bottom = refPosition.top + refPosition.height;
            Object.freeze(refPosition);

            popover.show(refPosition);
        };

        proxy_method(this, popover, 'addEventListener');
        proxy_method(this, popover, 'off');
        proxy_method(this, popover, 'on');
        proxy_method(this, popover, 'removeEventListener');
        proxy_method(this, popover, 'hide');

        this.bind = function bind(element, mode) {
            element.addEventListener('click', this.toggle.bind(this));
        };
    };
    Popover.prototype = new window.StyledElements.StyledElement();

    Popover.prototype.toggle = function toggle(refPosition) {
        if (this.visible) {
            this.hide();
        } else {
            this.show(refPosition);
        }
    };
    window.StyledElements.Popover = Popover;

    /* SendMenuItems */

    var getEventActions = function getEventActions(endpoint) {
        var i, actions, endpoints, endpointsByLabel, endpointInfo, actionLabel;

        endpoints = endpoint.getReachableEndpoints();
        endpointsByLabel = {};
        actions = [];

        for (i = 0; i < endpoints.length; i += 1) {
            endpointInfo = endpoints[i];

            if (endpointsByLabel[endpointInfo.actionlabel] == null) {
                endpointsByLabel[endpointInfo.actionlabel] = 1;
            } else {
                endpointsByLabel[endpointInfo.actionlabel] += 1;
            }
        }

        for (i = 0; i < endpoints.length; i += 1) {
            endpointInfo = endpoints[i];

            actionLabel = endpointInfo.actionlabel;
            if (endpointsByLabel[actionLabel] > 1) {
                actionLabel += ' (' + endpointInfo.iGadgetName + ')';
            }
            actions.push({value: endpointInfo, label: actionLabel});
        }

        return actions;
    };

    var send = function send(context) {
        MashupPlatform.wiring.pushEvent(this.control.endpoint, this.control.getData(context), {targetEndpoints: this.endpoints});
    };

    var SendMenuItems = function SendMenuItems(endpoint, getData) {
        if (typeof getData !== 'function') {
            throw new TypeError();
        }

        Object.defineProperties(this, {
            'endpoint': {value: endpoint},
            'getData': {value: getData}
        });
    };
    SendMenuItems.prototype = new window.StyledElements.DynamicMenuItems();

    SendMenuItems.prototype.build = function build() {
        var i, actions, action, items, item;

        actions = getEventActions(this.endpoint);
        items = [];

        for (i = 0; i < actions.length; i += 1) {
            action = actions[i];

            item = new window.StyledElements.MenuItem(action.label, send.bind({control: this, endpoints: [action.value]}));

            items.push(item);
        }

        return items;
    };
    window.StyledElements.SendMenuItems = SendMenuItems;


    /* Tooltip */
    StyledElements.Tooltip = function Tooltip(options) {
        var tooltip = new RealStyledElements.Tooltip(options);

        this.options = tooltip.options;

        this.show = function show(refPosition) {
            var position = iwidget.wrapperElement.getBoundingClientRect();

            if ('getBoundingClientRect' in refPosition) {
                refPosition = refPosition.getBoundingClientRect();
            }

            refPosition = {
                top: refPosition.top + position.top + platform.document.body.scrollTop,
                left: refPosition.left + position.left + platform.document.body.scrollLeft,
                width: refPosition.width,
                height: refPosition.height
            };
            refPosition.right = refPosition.left + refPosition.width;
            refPosition.bottom = refPosition.top + refPosition.height;
            Object.freeze(refPosition);

            tooltip.show(refPosition);
        };

        proxy_method(this, tooltip, 'addEventListener');
        proxy_method(this, tooltip, 'off');
        proxy_method(this, tooltip, 'on');
        proxy_method(this, tooltip, 'removeEventListener');
        proxy_method(this, tooltip, 'hide');

        this.bind = function bind(element) {
            tooltip.bind.call(this, element);
        };
    };
    StyledElements.Tooltip.prototype = new StyledElements.StyledElement();

    /* ModelTable */
    StyledElements.ModelTable = extend(RealStyledElements.ModelTable, {
        Tooltip: StyledElements.Tooltip
    });

    /* Button */
    StyledElements.Button = extend(RealStyledElements.Button, {
        Tooltip: StyledElements.Tooltip
    });
    StyledElements.StyledButton = StyledElements.Button; // Alias for backward compatibility

    /* ToggleButton */
    StyledElements.ToggleButton = extend(RealStyledElements.ToggleButton, {
        Tooltip: StyledElements.Tooltip
    });

    /* PopupButton */
    StyledElements.PopupButton = extend(RealStyledElements.PopupButton, {
        PopupMenu: StyledElements.PopupMenu,
        Tooltip: StyledElements.Tooltip
    });

    /* Tab */
    StyledElements.Tab = extend(RealStyledElements.Notebook.prototype.Tab, {
        Button: StyledElements.Button,
        Tooltip: StyledElements.Tooltip
    });

    /* Notebook */
    StyledElements.Notebook = extend(RealStyledElements.Notebook, {
        Tab: StyledElements.Tab,
        Button: StyledElements.Button
    });
    StyledElements.StyledNotebook = StyledElements.Notebook; // Alias for backward compatibility


    Object.freeze(window.StyledElements);
})();
