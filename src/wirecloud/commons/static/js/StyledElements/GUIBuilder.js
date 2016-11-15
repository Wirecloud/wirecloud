/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Document, StyledElements */


(function (utils) {

    "use strict";

    var GUIBuilder, processTComponent, processTree, processRoot, extractOptions, extractOptionsFromAttributes, populateContainer, NAMESPACE, TEMPLATE_NAMESPACE;

    NAMESPACE = 'http://wirecloud.conwet.fi.upm.es/StyledElements';
    TEMPLATE_NAMESPACE = 'http://wirecloud.conwet.fi.upm.es/Template';

    processTComponent = function processTComponent(element, tcomponents, context) {
        var options, tcomponent, new_component;

        tcomponent = tcomponents[element.localName];
        if (typeof tcomponent === 'function') {
            options = element.textContent.trim();
            if (options !== '') {
                try {
                    options = JSON.parse(options);
                } catch (e) {
                    options = {};
                }
            } else {
                options = {};
            }
            utils.merge(options, extractOptionsFromAttributes(element));

            new_component = tcomponent(options, tcomponents, context);
        } else {
            new_component = tcomponent;
        }

        if ((new_component instanceof StyledElements.StyledElement) || utils.isElement(new_component)) {
            new_component = new_component;
        } else if (new_component != null) {
            new_component = element.ownerDocument.createTextNode(new_component);
        } else {
            new_component = element.ownerDocument.createTextNode('');
        }

        return new_component;
    };

    processTree = function processTree(builder, element, tcomponents, context) {
        var i, child, component, new_component;

        for (i = 0; i < element.childNodes.length; i += 1) {
            child = element.childNodes[i];
            if (child.nodeType !== Node.ELEMENT_NODE) {
                continue;
            }

            if (child.namespaceURI === NAMESPACE) {
                component = builder.build(child, tcomponents, context);
                component.insertInto(element, child);
                element.removeChild(child);
            } else if (child.namespaceURI === TEMPLATE_NAMESPACE) {
                new_component = processTComponent(child, tcomponents, context);
                if (new_component instanceof StyledElements.StyledElement) {
                    new_component.insertInto(element, child);
                } else {
                    element.insertBefore(new_component, child);
                }
                element.removeChild(child);
            }  else {
                processTree(builder, child, tcomponents, context);
            }
        }
    };

    processRoot = function processRoot(builder, element, tcomponents, context) {
        var i, children, child, component;

        children = Array.prototype.slice.call(element.childNodes, 0);

        for (i = 0; i < children.length; i += 1) {
            child = children[i];
            if (!(child instanceof Element)) {
                continue;
            }

            if (child.namespaceURI === NAMESPACE) {
                component = builder.build(child, tcomponents, context);
                children[i] = component;
            } else if (child.namespaceURI === TEMPLATE_NAMESPACE) {
                children[i] = processTComponent(child, tcomponents, context);
            } else {
                processTree(builder, child, tcomponents, context);
            }
        }

        return new StyledElements.Fragment(children);
    };

    extractOptionsFromAttributes = function extractOptionsFromAttributes(element) {
        var i, options = {};

        // We cannot use forEach for walking an attribute list :(
        for (i = 0; i < element.attributes.length; i++) {
            options[element.attributes[i].localName] = element.attributes[i].nodeValue;
        }

        return options;
    };

    extractOptions = function extractOptions(element) {
        var options, options_element;

        options = {};
        options_element = element.ownerDocument.evaluate('s:options', element, function () { return NAMESPACE; }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (options_element != null) {
            options_element.parentNode.removeChild(options_element);
            try {
                options = JSON.parse(options_element.textContent);
            } catch (e) {}
        }


        return options;
    };

    populateContainer = function populateContainer(builder, element, tag_name, container, tcomponents, context) {
        var container_element, fragment, options;

        container_element = element.getElementsByTagNameNS(NAMESPACE, tag_name)[0];

        if (container_element != null) {
            options = utils.merge(extractOptions(container_element), extractOptionsFromAttributes(container_element));
            if (options != null && 'class' in options) {
                container.addClassName(options.class);
            }

            fragment = processRoot(builder, container_element, tcomponents, context);
            container.appendChild(fragment);
        }
    };

    GUIBuilder = function GUIBuilder() {
        var mapping = {
            'borderlayout': function (builder, element, options, tcomponents, context) {
                var layout = new StyledElements.BorderLayout(options);

                populateContainer(builder, element, 'northcontainer', layout.north, tcomponents, context);
                populateContainer(builder, element, 'westcontainer', layout.west, tcomponents, context);
                populateContainer(builder, element, 'centercontainer', layout.center, tcomponents, context);
                populateContainer(builder, element, 'eastcontainer', layout.east, tcomponents, context);
                populateContainer(builder, element, 'southcontainer', layout.south, tcomponents, context);

                return layout;
            },
            'button': function (builder, element, options) {
                options = utils.merge({}, options);
                options.text = element.textContent;
                return new StyledElements.Button(options);
            },
            'horizontallayout': function (builder, element, options, tcomponents, context) {
                var layout = new StyledElements.HorizontalLayout(options);

                populateContainer(builder, element, 'westcontainer', layout.west, tcomponents, context);
                populateContainer(builder, element, 'centercontainer', layout.center, tcomponents, context);
                populateContainer(builder, element, 'eastcontainer', layout.east, tcomponents, context);

                return layout;
            },
            'select': function (builder, element, options) {
                return new StyledElements.Select(options);
            },
            'verticallayout': function (builder, element, options, tcomponents, context) {
                var layout = new StyledElements.VerticalLayout(options);

                populateContainer(builder, element, 'northcontainer', layout.north, tcomponents, context);
                populateContainer(builder, element, 'centercontainer', layout.center, tcomponents, context);
                populateContainer(builder, element, 'southcontainer', layout.south, tcomponents, context);

                return layout;
            }
        };

        this.build = function build(element, tcomponents, context) {
            var builder, options;

            builder = mapping[element.localName];
            options = utils.merge(extractOptions(element), extractOptionsFromAttributes(element));
            return builder(this, element, options, tcomponents, context);
        };
    };

    GUIBuilder.prototype.DEFAULT_OPENING = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml">';
    GUIBuilder.prototype.DEFAULT_CLOSING = '</s:styledgui>';

    GUIBuilder.prototype.parse = function parse(document, tcomponents, context) {
        var parser;

        if (typeof document === 'string') {
            parser = new DOMParser();
            document = parser.parseFromString(document, 'application/xml');
        }

        if (!(document instanceof Document)) {
            throw new TypeError('document is not a Document or cannot be parsed into a Document');
        }

        return processRoot(this, document.documentElement, tcomponents, context);
    };

    StyledElements.GUIBuilder = GUIBuilder;

})(StyledElements.Utils);
