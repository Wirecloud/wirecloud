/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020-2021 Future Internet Consulting and Development Solutions S.L.
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

/* globals MashupPlatform, StyledElements */


(function () {

    "use strict";

    // StyledElements
    const RealStyledElements = window.parent.StyledElements;
    const platform = window.parent;
    const iwidget = MashupPlatform.priv.resource;

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

    const extend = function extend(parent_class, extra) {
        const new_class = class extends parent_class {};
        Object.assign(new_class.prototype, extra);
        return new_class;
    };

    const wrap_ref_position = function wrap_ref_position(refPosition) {
        const _refPosition = {
            getBoundingClientRect: () => {
                const widgetBox = iwidget.wrapperElement.getBoundingClientRect();
                const frameBox = new DOMRect(
                    widgetBox.left + platform.document.body.scrollLeft,
                    widgetBox.top + platform.document.body.scrollTop,
                    widgetBox.width, widgetBox.height
                );
                let refBox = 'getBoundingClientRect' in refPosition ? refPosition.getBoundingClientRect() : refPosition;
                if (refBox.right == null || refBox.bottom == null) {
                    refBox = new DOMRect(refBox.left, refBox.top, refBox.width, refBox.height);
                }

                const left = refBox.left < 0 ? frameBox.left : (refBox.left > frameBox.width ? frameBox.right : frameBox.left + refBox.left);
                const right = refBox.right < 0 ? frameBox.left : (refBox.right > frameBox.width ? frameBox.right : frameBox.left + refBox.right);
                const top = refBox.top < 0 ? frameBox.top : (refBox.top > frameBox.height ? frameBox.bottom : frameBox.top + refBox.top);
                const bottom = refBox.bottom < 0 ? frameBox.top : (refBox.bottom > frameBox.height ? frameBox.bottom : frameBox.top + refBox.bottom);

                return new DOMRect(left, top, right - left, bottom - top);
            }
        };
        Object.freeze(_refPosition);
        return _refPosition;
    };

    const redirect_events = function redirect_events(source, target) {
        Object.keys(source.events).forEach((name) => {
            const newEvent = new StyledElements.Event(target);
            target.events[name] = newEvent;
            source.events[name] = newEvent;
        });
    };

    /* PopupMenu */
    const privates = new WeakMap();

    window.StyledElements.PopupMenu = class PopupMenu extends StyledElements.StyledElement {

        constructor(options) {
            super();

            const priv = {
                menu: new RealStyledElements.PopupMenu(options)
            };
            privates.set(this, priv);
            redirect_events(priv.menu, this);
        }

        append() {
            const menu = privates.get(this).menu;
            menu.append.call(menu, ...arguments);
            return this;
        }

        repaint() {
            privates.get(this).menu.repaint(...arguments);
            return this;
        }

        show(refPosition) {
            const menu = privates.get(this).menu;
            menu.show(wrap_ref_position(refPosition));

            return this;
        }

        hide() {
            privates.get(this).menu.hide();
            return this;
        }

        isVisible() {
            return privates.get(this).menu.isVisible();
        }

        moveFocusDown() {
            privates.get(this).menu.moveFocusDown();

            return this;
        }

        moveFocusUp() {
            privates.get(this).menu.moveFocusUp();

            return this;
        }

        hasEnabledItem() {
            return privates.get(this).menu.hasEnabledItem();
        }

        destroy() {
            super.destroy();
            privates.get(this).menu.destroy();
            return this;
        }

    }

    /* Popover */
    window.StyledElements.Popover = class Popover extends window.StyledElements.StyledElement {

        constructor(options) {
            super();

            options = options == null ? {} : Object.assign({}, options);
            options.refContainer = iwidget;

            const priv = {
                popover: new RealStyledElements.Popover(options)
            };
            privates.set(this, priv);
            redirect_events(priv.popover, this);
        }

        disablePointerEvents() {
            privates.get(this).popover.disablePointerEvents();
            return this;
        }

        enablePointerEvents() {
            privates.get(this).popover.enablePointerEvents();
            return this;
        }

        get visible() {
            return privates.get(this).popover.visible;
        }

        repaint() {
            privates.get(this).popover.repaint(...arguments);
            return this;
        }

        show(refPosition) {
            const popover = privates.get(this).popover;
            popover.show(wrap_ref_position(refPosition));

            return this;
        }

        hide() {
            privates.get(this).popover.hide();
            return this;
        }

        bind(element, mode) {
            element.addEventListener('click', this.toggle.bind(this));
        }

        toggle(refPosition) {
            if (this.visible) {
                this.hide();
            } else {
                this.show(refPosition);
            }
        }

        update(title, content) {
            privates.get(this).popover.update(title, content);
            return this;
        }

    }

    /* SendMenuItems */

    const getEventActions = function getEventActions(endpoint) {
        let i, endpointInfo, actionLabel;

        const endpoints = endpoint.getReachableEndpoints();
        const endpointsByLabel = {};
        const actions = [];

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

    const send = function send(context) {
        MashupPlatform.wiring.pushEvent(this.control.endpoint, this.control.getData(context), {targetEndpoints: this.endpoints});
    };

    const SendMenuItems = function SendMenuItems(endpoint, getData) {
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
        const actions = getEventActions(this.endpoint);
        return actions.forEach((action) => {
            return new window.StyledElements.MenuItem(action.label, send.bind({control: this, endpoints: [action.value]}));
        });
    };
    window.StyledElements.SendMenuItems = SendMenuItems;


    /* Tooltip */
    StyledElements.Tooltip = class Tooltip extends window.StyledElements.StyledElement {

        constructor(options) {
            super();

            const priv = {
                tooltip: new RealStyledElements.Tooltip(options)
            };
            privates.set(this, priv);
            redirect_events(priv.tooltip, this);
        }

        get options() {
            return privates.get(this).tooltip.options;
        }

        repaint() {
            privates.get(this).tooltip.repaint(...arguments);
            return this;
        }

        show(refPosition) {
            const tooltip = privates.get(this).tooltip;
            tooltip.show(wrap_ref_position(refPosition));

            return this;
        }

        hide() {
            privates.get(this).tooltip.hide();
            return this;
        }

        bind(element, mode) {
            privates.get(this).tooltip.bind.call(this, element, mode);
            return this;
        }

    }

    /* ModelTable */
    StyledElements.ModelTable = extend(RealStyledElements.ModelTable, {
        Tooltip: StyledElements.Tooltip
    });

    /* Button */
    StyledElements.Button = extend(RealStyledElements.Button, {
        Tooltip: StyledElements.Tooltip
    });
    StyledElements.StyledButton = StyledElements.Button; // Alias for backward compatibility

    /* FileButton */
    StyledElements.FileButton = extend(RealStyledElements.FileButton, {
        Tooltip: StyledElements.Tooltip
    });

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
