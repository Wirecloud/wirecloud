/* globals MashupPlatform, StyledElements */


(function () {

    "use strict";

    var ContextTester = function ContextTester(concept, initialValue) {
        var title, content, badge, counter = -1;

        if (arguments.length === 0) {
            return;
        }

        StyledElements.StyledElement.call(this, []);

        this.update = function (new_value) {
            counter += 1;
            badge.textContent = counter;
            content.textContent = new_value;
        };

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.setAttribute('data-name', concept.name);

        title = document.createElement('div');
        title.className = 'title';
        title.textContent = concept.label + ' [' + concept.name + ']';

        badge = document.createElement('span');
        badge.className = 'badge badge-info';
        title.appendChild(badge);

        this.wrapperElement.appendChild(title);
        title.title = concept.description;

        content = document.createElement('div');
        content.className = 'content';
        this.wrapperElement.appendChild(content);

        this.update(initialValue);
    };
    ContextTester.prototype = new StyledElements.StyledElement();

    var MashupContextTester = function MashupContextTester(concept) {
        ContextTester.call(this, concept, MashupPlatform.mashup.context.get(concept.name));
    };
    MashupContextTester.prototype = new ContextTester();

    var PlatformContextTester = function PlatformContextTester(concept) {
        ContextTester.call(this, concept, MashupPlatform.context.get(concept.name));
    };
    PlatformContextTester.prototype = new ContextTester();

    var WidgetContextTester = function WidgetContextTester(concept) {
        ContextTester.call(this, concept, MashupPlatform.widget.context.get(concept.name));
    };
    WidgetContextTester.prototype = new ContextTester();

    var notebook = new StyledElements.StyledNotebook();

    var loadWidgetContext = function loadWidgetContext() {
        var i, key, testers, context, context_keys, container;

        container = notebook.createTab({name: 'Widget', closable: false});
        testers = {};
        context = MashupPlatform.widget.context.getAvailableContext();
        context_keys = Object.getOwnPropertyNames(context).sort();
        for (i = 0; i < context_keys.length; i += 1) {
            key = context_keys[i];
            testers[key] = new WidgetContextTester(context[key]);
            container.appendChild(testers[key]);
        }

        MashupPlatform.widget.context.registerCallback(function (new_values) {
            var key;
            for (key in new_values) {
                testers[key].update(new_values[key]);
            }

            if ('heightInPixels' in new_values || 'widthInPixels' in new_values) {
                notebook.repaint();
            }
        });
    };

    var loadMashupContext = function loadMashupContext() {
        var i, key, testers, context, context_keys, container;

        container = notebook.createTab({name: 'Mashup', closable: false});
        testers = {};
        context = MashupPlatform.mashup.context.getAvailableContext();
        context_keys = Object.getOwnPropertyNames(context).sort();
        for (i = 0; i < context_keys.length; i += 1) {
            key = context_keys[i];
            testers[key] = new MashupContextTester(context[key]);
            container.appendChild(testers[key]);
        }

        MashupPlatform.mashup.context.registerCallback(function (new_values) {
            var key;
            for (key in new_values) {
                testers[key].update(new_values[key]);
            }
        });
    };

    var loadPlatformContext = function loadPlatformContext() {
        var i, key, testers, context, context_keys, container;

        container = notebook.createTab({name: 'Platform', closable: false});
        testers = {};
        context = MashupPlatform.context.getAvailableContext();
        context_keys = Object.getOwnPropertyNames(context).sort();
        for (i = 0; i < context_keys.length; i += 1) {
            key = context_keys[i];
            testers[key] = new PlatformContextTester(context[key]);
            container.appendChild(testers[key]);
        }

        MashupPlatform.context.registerCallback(function (new_values) {
            var key;
            for (key in new_values) {
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
