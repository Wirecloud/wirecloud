(function () {

    "use strict";

    var ContextTester = function ContextTester(concept, initialValue) {
        var title, content;

        if (arguments.length === 0) {
            return;
        }

        StyledElements.StyledElement.call(this, []);

        this.update = function (new_value) {
            content.textContent = new_value;
        };

        this.wrapperElement = document.createElement('div');

        title = document.createElement('div');
        title.className = 'title';
        title.textContent = concept;
        this.wrapperElement.appendChild(title);

        content = document.createElement('div');
        content.className = 'content';
        this.wrapperElement.appendChild(content);

        this.update(initialValue);
    };
    ContextTester.prototype = new StyledElements.StyledElement();

    var MashupContextTester = function MashupContextTester(concept) {
        ContextTester.call(this, concept, MashupPlatform.mashup.context.get(concept));
    };
    MashupContextTester.prototype = new ContextTester();

    var PlatformContextTester = function PlatformContextTester(concept) {
        ContextTester.call(this, concept, MashupPlatform.context.get(concept));
    };
    PlatformContextTester.prototype = new ContextTester();

    var WidgetContextTester = function WidgetContextTester(concept) {
        ContextTester.call(this, concept, MashupPlatform.widget.context.get(concept));
    };
    WidgetContextTester.prototype = new ContextTester();

    var notebook = new StyledElements.StyledNotebook();

    var loadWidgetContext = function loadWidgetContext() {
        var i, key, testers, context, container;

        container = notebook.createTab({name: 'Widget', closable: false});
        testers = {};
        context = Object.getOwnPropertyNames(MashupPlatform.widget.context.getAvailableContext()).sort();
        for (i = 0; i < context.length; i += 1) {
            key = context[i];
            testers[key] = new WidgetContextTester(key);
            container.appendChild(testers[key]);
        }

        MashupPlatform.widget.context.registerCallback(function (new_values) {
            var key;
            for (key in new_values) {
                testers[key].update(new_values[key]);
            }

            if ('heightInPixels' in new_values) {
                notebook.repaint();
            }
        });
    };

    var loadMashupContext = function loadMashupContext() {
        var i, key, testers, context, container;

        container = notebook.createTab({name: 'Mashup', closable: false});
        testers = {};
        context = Object.getOwnPropertyNames(MashupPlatform.mashup.context.getAvailableContext()).sort();
        for (i = 0; i < context.length; i += 1) {
            key = context[i];
            testers[key] = new MashupContextTester(key);
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
        var i, key, testers, context, container;

        container = notebook.createTab({name: 'Platform', closable: false});
        testers = {};
        context = Object.getOwnPropertyNames(MashupPlatform.context.getAvailableContext()).sort();
        for (i = 0; i < context.length; i += 1) {
            key = context[i];
            testers[key] = new PlatformContextTester(key);
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
