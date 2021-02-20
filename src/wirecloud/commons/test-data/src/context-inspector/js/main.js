/* globals MashupPlatform, StyledElements */


(function () {

    "use strict";

    const ContextTester = class ContextTester extends StyledElements.StyledElement {

        constructor(concept, initialValue) {
            let counter = -1;

            super([]);

            this.update = function (new_value) {
                counter += 1;
                badge.textContent = counter;
                content.textContent = new_value;
            };

            this.wrapperElement = document.createElement('div');
            this.wrapperElement.setAttribute('data-name', concept.name);

            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = concept.label + ' [' + concept.name + ']';

            const badge = document.createElement('span');
            badge.className = 'badge badge-info';
            title.appendChild(badge);

            this.wrapperElement.appendChild(title);
            title.title = concept.description;

            const content = document.createElement('div');
            content.className = 'content';
            this.wrapperElement.appendChild(content);

            this.update(initialValue);
        }

    }

    const MashupContextTester = class MashupContextTester extends ContextTester {
        constructor(concept) {
            super(concept, MashupPlatform.mashup.context.get(concept.name));
        }
    }

    const PlatformContextTester = class PlatformContextTester extends ContextTester {
        constructor(concept) {
            super(concept, MashupPlatform.context.get(concept.name));
        }
    }

    const WidgetContextTester = class WidgetContextTester extends ContextTester {
        constructor(concept) {
            super(concept, MashupPlatform.widget.context.get(concept.name));
        }
    }

    const notebook = new StyledElements.StyledNotebook();

    const loadWidgetContext = function loadWidgetContext() {
        const container = notebook.createTab({name: 'Widget', closable: false});
        const testers = {};
        const context = MashupPlatform.widget.context.getAvailableContext();
        Object.getOwnPropertyNames(context).sort().forEach((key) => {
            testers[key] = new WidgetContextTester(context[key]);
            container.appendChild(testers[key]);
        });

        MashupPlatform.widget.context.registerCallback((new_values) => {
            for (let key in new_values) {
                testers[key].update(new_values[key]);
            }

            if ('heightInPixels' in new_values || 'widthInPixels' in new_values) {
                notebook.repaint();
            }
        });
    };

    const loadMashupContext = function loadMashupContext() {
        const container = notebook.createTab({name: 'Mashup', closable: false});
        const testers = {};
        const context = MashupPlatform.mashup.context.getAvailableContext();
        Object.getOwnPropertyNames(context).sort().forEach((key) => {
            testers[key] = new MashupContextTester(context[key]);
            container.appendChild(testers[key]);
        });

        MashupPlatform.mashup.context.registerCallback((new_values) => {
            for (let key in new_values) {
                testers[key].update(new_values[key]);
            }
        });
    };

    const loadPlatformContext = function loadPlatformContext() {
        const container = notebook.createTab({name: 'Platform', closable: false});
        const testers = {};
        const context = MashupPlatform.context.getAvailableContext();
        Object.getOwnPropertyNames(context).sort().forEach((key) => {
            testers[key] = new PlatformContextTester(context[key]);
            container.appendChild(testers[key]);
        });

        MashupPlatform.context.registerCallback((new_values) => {
            for (let key in new_values) {
                testers[key].update(new_values[key]);
            }
        });
    };

    window.init = function init() {
        notebook.insertInto(document.body);
    };

    loadWidgetContext();
    loadMashupContext();
    loadPlatformContext();
})();
