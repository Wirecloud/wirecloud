var ContextTester = function ContextTester(concept) {
    var title, content, handler, variable;

    title = document.createElement('div');
    title.className = 'title';
    EzWebExt.setTextContent(title, concept);
    content = document.createElement('div');
    content.className = 'content';

    this.draw = function (element) {
        element.appendChild(title);
        element.appendChild(content);
        EzWebExt.setTextContent(content, variable.get());
    };

    handler = function (newValue) {
        EzWebExt.setTextContent(content, newValue);
    };
    variable = EzWebAPI.createRGadgetVariable(concept, handler);
};

var variables = {
    'language': null,
    'username': null,
    'width': null,
    'height': null,
    'widthInPixels': null,
    'heightInPixels': null
};

var key;
for (key in variables) {
    variables[key] = new ContextTester(key);
}

function init() {
    var key, div = document.createElement('div');

    document.body.appendChild(div);
    for (key in variables) {
        variables[key].draw(div);
    }
}
