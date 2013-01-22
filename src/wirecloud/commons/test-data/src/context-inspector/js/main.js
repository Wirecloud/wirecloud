(function () {

    "use strict";

    var ContextTester = function ContextTester(concept) {
        var title, content;

        title = document.createElement('div');
        title.className = 'title';
        title.textContent = concept;
        content = document.createElement('div');
        content.className = 'content';

        this.draw = function (element) {
            element.appendChild(title);
            element.appendChild(content);
            this.update(MashupPlatform.widget.context.get(concept));
        };

        this.update = function (new_value) {
            content.textContent = new_value;
        };
    };

    var i, key, testers, context;

    testers = {};
    context = MashupPlatform.widget.context.getAvailableContext().sort();
    for (i = 0; i < context.length; i += 1) {
        key = context[i];
        testers[key] = new ContextTester(key);
    }

    window.init = function init() {
        var key, div = document.createElement('div');

        document.body.appendChild(div);
        for (key in testers) {
            testers[key].draw(div);
        }
        MashupPlatform.widget.context.registerCallback(function (new_values) {
            var key;
            for (key in new_values) {
                testers[key].update(new_values[key]);
            }
        });
    };
})();
