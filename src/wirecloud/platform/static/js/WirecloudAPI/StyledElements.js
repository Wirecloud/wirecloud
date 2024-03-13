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


(function () {

    "use strict";

    const _StyledElements = function _StyledElements(parent, platform, _) {
        // StyledElements
        const RealStyledElements = platform.StyledElements;
        const iwidget = parent.MashupPlatform.priv.resource;

        parent.StyledElements = {
            'Accordion': platform.StyledElements.Accordion,
            'Addon': platform.StyledElements.Addon,
            'Alternatives': platform.StyledElements.Alternatives,
            'BorderLayout': platform.StyledElements.BorderLayout,
            'ButtonsGroup': platform.StyledElements.ButtonsGroup,
            'CheckBox': platform.StyledElements.CheckBox,
            'CodeArea': platform.StyledElements.CodeArea,
            'Container': platform.StyledElements.Container,
            'DynamicMenuItems': platform.StyledElements.DynamicMenuItems,
            'Event': platform.StyledElements.Event,
            'Fragment': platform.StyledElements.Fragment,
            'Form': platform.StyledElements.Form,
            'GUIBuilder': platform.StyledElements.GUIBuilder,
            'HorizontalLayout': platform.StyledElements.HorizontalLayout,
            'InputElement': platform.StyledElements.InputElement,
            'List': platform.StyledElements.List,
            'MenuItem': platform.StyledElements.MenuItem,
            'NumericField': platform.StyledElements.NumericField,
            'ObjectWithEvents': platform.StyledElements.ObjectWithEvents,
            'PaginatedSource': platform.StyledElements.PaginatedSource,
            'PaginationInterface': platform.StyledElements.PaginationInterface,
            'PasswordField': platform.StyledElements.PasswordField,
            'RadioButton': platform.StyledElements.RadioButton,
            'Select': platform.StyledElements.Select,
            'Separator': platform.StyledElements.Separator,
            'StaticPaginatedSource': platform.StyledElements.StaticPaginatedSource,
            'StyledAlternatives': platform.StyledElements.Alternatives, // backward compatibility alias
            'StyledCheckBox': platform.StyledElements.CheckBox, // backward compatibility alias
            'StyledElement': platform.StyledElements.StyledElement,
            'StyledInputElement': platform.StyledElements.InputElement, // backward compatibility alias
            'StyledList': platform.StyledElements.List, // backward compatibility alias
            'StyledNumericField': platform.StyledElements.NumericField, // backward compatibility alias
            'StyledPasswordField': platform.StyledElements.PasswordField, // backward compatibility alias
            'StyledRadioButton': platform.StyledElements.RadioButton, // backward compatibility alias
            'StyledSelect': platform.StyledElements.Select, // backward compatibility alias
            'StyledTextArea': platform.StyledElements.TextArea, // backward compatibility alias
            'StyledTextField': platform.StyledElements.TextField, // backward compatibility alias
            'TextArea': platform.StyledElements.TextArea,
            'TextField': platform.StyledElements.TextField,
            'VerticalLayout': platform.StyledElements.VerticalLayout
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
                const newEvent = new parent.StyledElements.Event(target);
                target.events[name] = newEvent;
                source.events[name] = newEvent;
            });
        };

        /* PopupMenu */
        const privates = new WeakMap();

        parent.StyledElements.PopupMenu = class PopupMenu extends parent.StyledElements.StyledElement {

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
        parent.StyledElements.Popover = class Popover extends parent.StyledElements.StyledElement {

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
            parent.MashupPlatform.wiring.pushEvent(this.control.endpoint, this.control.getData(context), {targetEndpoints: this.endpoints});
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
        SendMenuItems.prototype = new parent.StyledElements.DynamicMenuItems();

        SendMenuItems.prototype.build = function build() {
            const actions = getEventActions(this.endpoint);
            return actions.forEach((action) => {
                return new parent.StyledElements.MenuItem(action.label, send.bind({control: this, endpoints: [action.value]}));
            });
        };
        parent.StyledElements.SendMenuItems = SendMenuItems;


        /* Tooltip */
        parent.StyledElements.Tooltip = class Tooltip extends parent.StyledElements.StyledElement {

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
        parent.StyledElements.ModelTable = extend(RealStyledElements.ModelTable, {
            Tooltip: parent.StyledElements.Tooltip
        });

        /* Button */
        parent.StyledElements.Button = extend(RealStyledElements.Button, {
            Tooltip: parent.StyledElements.Tooltip
        });
        parent.StyledElements.StyledButton = parent.StyledElements.Button; // Alias for backward compatibility

        /* FileButton */
        parent.StyledElements.FileButton = extend(RealStyledElements.FileButton, {
            Tooltip: parent.StyledElements.Tooltip
        });

        /* ToggleButton */
        parent.StyledElements.ToggleButton = extend(RealStyledElements.ToggleButton, {
            Tooltip: parent.StyledElements.Tooltip
        });

        /* PopupButton */
        parent.StyledElements.PopupButton = extend(RealStyledElements.PopupButton, {
            PopupMenu: parent.StyledElements.PopupMenu,
            Tooltip: parent.StyledElements.Tooltip
        });

        /* Tab */
        parent.StyledElements.Tab = extend(RealStyledElements.Notebook.prototype.Tab, {
            Button: parent.StyledElements.Button,
            Tooltip: parent.StyledElements.Tooltip
        });

        /* Notebook */
        parent.StyledElements.Notebook = extend(RealStyledElements.Notebook, {
            Tab: parent.StyledElements.Tab,
            Button: parent.StyledElements.Button
        });
        parent.StyledElements.StyledNotebook = parent.StyledElements.Notebook; // Alias for backward compatibility


        Object.freeze(parent.StyledElements);
    };

    window._privs._StyledElements = _StyledElements;

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        window._privs._StyledElements(window, window.parent);
    }

})();
