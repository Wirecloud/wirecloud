/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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
/*global Document, EzWebExt, StyledElements*/

(function () {

    "use strict";

    var GUIBuilder, processTComponent, processTree, processRoot, extractOptions, NAMESPACE, TEMPLATE_NAMESPACE;

    NAMESPACE = 'http://wirecloud.conwet.fi.upm.es/StyledElements';
    TEMPLATE_NAMESPACE = 'http://wirecloud.conwet.fi.upm.es/Template';

    processTComponent = function processTComponent(element, tcomponents) {
        var options, parsed_options, tcomponent, new_component;

        tcomponent = tcomponents[element.localName];
        if (typeof tcomponent === 'function') {
            options = element.textContent.strip();
            if (options !== '') {
                try {
                    parsed_options = JSON.parse(options);
                } catch (e) {}
            }

            new_component = tcomponent(parsed_options);
        } else {
            new_component = tcomponent;
        }

        if (typeof new_component === 'string') {
            new_component = element.ownerDocument.createTextNode(new_component);
        } else if (new_component != null) {
            new_component = new_component;
        } else {
            new_component = element.ownerDocument.createTextNode('');
        }

        return new_component;
    };

    processTree = function processTree(builder, element, tcomponents) {
        var i, child, component, new_component;

        for (i = 0; i < element.childNodes.length; i += 1) {
            child = element.childNodes[i];
            if (!EzWebExt.XML.isElement(child)) {
                continue;
            }

            if (child.namespaceURI === NAMESPACE) {
                component = builder.build(child, tcomponents);
                component.insertInto(element, child);
                element.removeChild(child);
            } else if (child.namespaceURI === TEMPLATE_NAMESPACE) {
                new_component = processTComponent(child, tcomponents);
                if (new_component instanceof StyledElements.StyledElement) {
                    new_component.insertInto(element, child);
                } else {
                    element.insertBefore(new_component, child);
                }
                element.removeChild(child);
            }  else {
                processTree(builder, child, tcomponents);
            }
        }
    };

    processRoot = function processRoot(builder, element, tcomponents) {
        var i, children, child, component;

        children = Array.prototype.slice.call(element.childNodes, 0);

        for (i = 0; i < children.length; i += 1) {
            child = children[i];
            if (!EzWebExt.XML.isElement(child)) {
                continue;
            }

            if (child.namespaceURI === NAMESPACE) {
                component = builder.build(child, tcomponents);
                children[i] = component;
            } else if (child.namespaceURI === TEMPLATE_NAMESPACE) {
                children[i] = processTComponent(child, tcomponents);
            } else {
                processTree(builder, child, tcomponents);
            }
        }

        return new StyledElements.Fragment(children);
    };

    extractOptions = function extractOptions(element) {
        var options, options_element;

        options = null;
        options_element = element.ownerDocument.evaluate('s:options', element, function () { return 'http://wirecloud.conwet.fi.upm.es/StyledElements'; }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (options_element != null) {
            options_element.parentNode.removeChild(options_element);
            try {
                options = JSON.parse(options_element.textContent);
            } catch (e) {}
        }

        return options;
    };

    GUIBuilder = function GUIBuilder() {
        var mapping = {
            'borderlayout': function (builder, element, options, tcomponents) {
                var layout = new StyledElements.BorderLayout(options);

                var populateContainer = function populateContainer(element, xpath, container) {
                    var container_element, i, fragment;

                    container_element = element.ownerDocument.evaluate(xpath,
                        element,
                        function () { return 'http://wirecloud.conwet.fi.upm.es/StyledElements'; },
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null).singleNodeValue;

                    if (container_element != null) {
                        options = extractOptions(container_element);
                        if (options != null && 'class' in options) {
                            container.addClassName(options['class']);
                        }

                        fragment = processRoot(builder, container_element, tcomponents);
                        container.appendChild(fragment);
                    }
                };

                populateContainer(element, 's:northcontainer', layout.getNorthContainer());
                populateContainer(element, 's:westcontainer', layout.getWestContainer());
                populateContainer(element, 's:centercontainer', layout.getCenterContainer());
                populateContainer(element, 's:eastcontainer', layout.getEastContainer());
                populateContainer(element, 's:southcontainer', layout.getSouthContainer());

                return layout;
            },
            'button': function (builder, element, options) {
                options = EzWebExt.merge({}, options);
                options.text = element.textContent;
                return new StyledElements.StyledButton(options);
            },
            'select': function (builder, element, options) {
                return new StyledElements.StyledSelect(options);
            }
        };

        this.build = function (element, tcomponents) {
            var builder, options;

            builder = mapping[element.localName];
            options = extractOptions(element);
            return builder(this, element, options, tcomponents);
        };
    };

    GUIBuilder.prototype.parse = function parse(document, tcomponents) {
        if (typeof document === 'string') {
            document = EzWebExt.XML.parseFromString(document, 'application/xml');
        }

        if (!(document instanceof Document)) {
            throw new TypeError('document is not a Document or cannot be parsed into a Document');
        }

        return processRoot(this, document.documentElement, tcomponents);
    };

    StyledElements.GUIBuilder = GUIBuilder;
})();
