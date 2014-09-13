/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global MashupPlatform */

(function () {

    "use strict";

    // StyledElements
    var RealStyledElements = window.parent.StyledElements;
    var platform = window.parent;
    var iwidget = platform.Wirecloud.activeWorkspace.getIWidget(MashupPlatform.widget.id);

    window.StyledElements = {
        'Addon': window.parent.StyledElements.Addon,
        'Accordion': window.parent.StyledElements.Accordion,
        'ButtonsGroup': window.parent.StyledElements.ButtonsGroup,
        'Container': window.parent.StyledElements.Container,
        'DynamicMenuItems': window.parent.StyledElements.DynamicMenuItems,
        'Event': window.parent.StyledElements.Event,
        'Form': window.parent.Form,
        'ObjectWithEvents': window.parent.StyledElements.ObjectWithEvents,
        'StyledAlternatives': window.parent.StyledElements.StyledAlternatives,
        'StyledCheckBox': window.parent.StyledElements.StyledCheckBox,
        'StyledElement': window.parent.StyledElements.StyledElement,
        'StyledInputElement': window.parent.StyledElements.StyledInputElement,
        'StyledList': window.parent.StyledElements.StyledList,
        'StyledNumericField': window.parent.StyledElements.StyledNumericField,
        'StyledTextField': window.parent.StyledElements.StyledTextField,
        'StyledPasswordField': window.parent.StyledElements.StyledPasswordField,
        'StyledRadioButton': window.parent.StyledElements.StyledRadioButton,
        'StyledSelect': window.parent.StyledElements.StyledSelect,
        'StyledTextArea': window.parent.StyledElements.StyledTextArea,
        'PaginatedSource': window.parent.StyledElements.PaginatedSource,
        'PaginationInterface': window.parent.StyledElements.PaginationInterface,
        'StaticPaginatedSource': window.parent.StyledElements.StaticPaginatedSource,
        'Separator': window.parent.StyledElements.Separator,
        'MenuItem': window.parent.StyledElements.MenuItem,
        'ModelTable': window.parent.StyledElements.ModelTable,
        'HorizontalLayout': window.parent.StyledElements.HorizontalLayout,
        'BorderLayout': window.parent.StyledElements.BorderLayout
    };

    var extend = function (parent_class, extra) {
        var new_class = function () {
            parent_class.apply(this, arguments);
        };

        new_class.prototype = new parent_class();
        for (var key in extra) {
            new_class.prototype[key] = extra[key];
        }

        return new_class;
    };

    /* PopupMenu */
    var PopupMenu = function PopupMenu(options) {
        var menu = new RealStyledElements.PopupMenu(options);

        this.append = function append(element) {
            menu.append.apply(menu, arguments);
        };

        this.show = function show(refPosition) {
            var position = iwidget.content.getBoundingClientRect();

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
        };

        this.hide = function hide() {
            menu.hide();
        };

        this.isVisible = function isVisible() {
            return menu.isVisible();
        };

        this.addEventListener = function addEventListener(event_name, listener) {
            menu.addEventListener(event_name, listener);
        };

        this.removeEventListener = function removeEventListener(event_name, listener) {
            menu.removeEventListener(event_name, listener);
        };

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
            var position = iwidget.content.getBoundingClientRect();

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

        this.hide = function hide() {
            popover.hide();
        };

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
        var i, actions, contactSlots, nslotsByLabel, slotInfo, actionLabel;

        contactSlots = MashupPlatform.wiring.getReachableEndpoints(endpoint);
        nslotsByLabel = {};
        actions = [];

        for (i = 0; i < contactSlots.length; i += 1) {
            slotInfo = contactSlots[i];

            if (nslotsByLabel[slotInfo.action_label] == null) {
                nslotsByLabel[slotInfo.action_label] = 1;
            } else {
                nslotsByLabel[slotInfo.action_label] += 1;
            }
        }

        for (i = 0; i < contactSlots.length; i += 1) {
            slotInfo = contactSlots[i];

            actionLabel = slotInfo.action_label;
            if (nslotsByLabel[actionLabel] > 1) {
                actionLabel += ' (' + slotInfo.iWidgetName + ')';
            }
            actions.push({value: slotInfo, label: actionLabel});
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
    StyledElements.Tooltip = extend(RealStyledElements.Tooltip, {
        'show': function show(refPosition) {
            var position = iwidget.content.getBoundingClientRect();

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

            RealStyledElements.Tooltip.prototype.show.call(this, refPosition);
        }
    });

    /* Button */
    StyledElements.StyledButton = extend(RealStyledElements.StyledButton, {
        Tooltip: StyledElements.Tooltip
    });

    /* PopupButton */
    StyledElements.PopupButton = extend(RealStyledElements.PopupButton, {
        PopupMenu: StyledElements.PopupMenu,
        Tooltip: StyledElements.Tooltip
    });

    /* Tab */
    StyledElements.Tab = extend(RealStyledElements.StyledNotebook.prototype.Tab, {
        Button: StyledElements.StyledButton,
        Tooltip: StyledElements.Tooltip
    });

    /* Notebook */
    StyledElements.StyledNotebook = extend(RealStyledElements.StyledNotebook, {
        Tab: StyledElements.Tab,
        Button: StyledElements.StyledButton
    });


    Object.freeze(window.StyledElements);
})();
