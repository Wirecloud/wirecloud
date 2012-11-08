/**
 *
 */
StyledElements.ColorSelector = function(options) {
    options = EzWebExt.merge({
        "class": "",
        "iconHeight": 24,
        "iconHeight": 24,
        "icon": null
    }, options);
    StyledElements.StyledElement.call(this, []);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.appendWord(options['class'], 'styled_password_field');

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    var row, button;

    row = document.createElement("div");
    this.wrapperElement.appendChild(row);

    button = new StyledElements.StyledButton();
    button.insertInto(row);

    button = new StyledElements.StyledButton();
    button.insertInto(row);

    button = new StyledElements.StyledButton();
    button.insertInto(row);

    button = new StyledElements.StyledButton();
    button.insertInto(row);


    row = document.createElement("div");
    this.wrapperElement.appendChild(row);

    button = new StyledElements.StyledButton();
    button.insertInto(row);

    button = new StyledElements.StyledButton();
    button.insertInto(row);

    button = new StyledElements.StyledButton();
    button.insertInto(row);

    button = new StyledElements.StyledButton();
    button.insertInto(row);

}

/*---------------------------------------------------------------------------*
 *                               Styled Gadget                               *
 *---------------------------------------------------------------------------*/

var StyledGadget = function() {
    /* Call to the parent constructor */
    EzWebGadget.call(this, {translatable: false});
}
StyledGadget.prototype = new EzWebGadget(); /* Extend from EzWebGadget */

StyledGadget.prototype.resourcesURL = "http://jupiter.ls.fi.upm.es/svn/ezweb-gadgets/eskel/1.0_beta2/examples/StyledGadget";

StyledGadget.prototype.init = function() {
    var hpaned = new StyledElements.StyledHPaned({handlerPosition: 30,
                                                  leftMinWidth: 100,
                                                  rightMinWidth: 100});
    hpaned.insertInto(document.body);

    var alternatives = new StyledElements.StyledAlternatives();

    /* Left Content */
    var onChange = function(component, newSelection, newElements, removedElements) {
        if (newSelection.length > 0)
            alternatives.showAlternative(newSelection[0]);
    }
    var list = new StyledElements.StyledList({full: true, multivalued: false});
    list.addEventListener('change', onChange);
    hpaned.getLeftPanel().appendChild(list);

    /* Right Content */
    hpaned.getRightPanel().appendChild(alternatives);


    function insertExample(name, code) {
        var panelNotebook = new StyledElements.StyledNotebook();
        var container = panelNotebook.createTab({name: "View", closable: false});

        try {
            eval("var codeFunc = function() {\n" + code + "\n}");
            codeFunc();
        } catch (e) {
            container.clear();
            container.appendChild(document.createTextNode(e));
        }

        var alternative = alternatives.createAlternative();
        alternative.appendChild(panelNotebook);

        list.addEntries([[alternative.getId(), name]]);

        var preText = document.createElement("pre");
        var codeTab = panelNotebook.createTab({name: "Code", closable: false});
        preText.appendChild(document.createTextNode(code));
        codeTab.appendChild(preText);
    }

    var code;

    /*
     * BorderLayout example
     *
    code = "\
    var blayout = new StyledElements.BorderLayout();\n\
    blayout.getNorthPanel().appendChild(document.createTextNode('Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.'));\n\
    container.appendChild(blayout);
    ";

    insertExample("BorderLayout", code);*/



    /*
     * Input Components example
     */
    code = "\
    var row = document.createElement('div');\n\
    var select = new StyledElements.StyledSelect({initialEntries: [{value:'1', label:'uno'}, {value:'3', label:'tres'}, {value:'2', label:'dos'}], initialValue: '3'});\n\
    var button = new StyledElements.StyledButton({text: 'Reset'});\n\
    button.wrapperElement.style.cssText += 'float: right;';\n\
    var resetSelectField = function(button) {\n\
        select.reset();\n\
    };\n\
    button.addEventListener('click', resetSelectField);\n\
    button.insertInto(row);\n\
    select.insertInto(row);\n\
    container.appendChild(row);\n\
\n\
    /* Text Field */\n\
    var row = document.createElement('div');\n\
    var textField = new StyledElements.StyledTextField({initialValue: 'texto'});\n\
    var button = new StyledElements.StyledButton({text: 'Reset'});\n\
    button.wrapperElement.style.cssText += 'float: right;';\n\
    var resetTextField = function(button) {\n\
        textField.reset();\n\
    };\n\
    button.addEventListener('click', resetTextField);\n\
    button.insertInto(row);\n\
    textField.insertInto(row);\n\
    container.appendChild(row);\n\
\n\
    /* Password Field */\n\
    var row = document.createElement('div');\n\
    var passField = new StyledElements.StyledPasswordField({initialValue: 'pass'});\n\
    var button = new StyledElements.StyledButton({text: 'Reset'});\n\
    button.wrapperElement.style.cssText += 'float: right;';\n\
    var resetPassField = function(button) {\n\
        passField.reset();\n\
    };\n\
    button.addEventListener('click', resetPassField);\n\
    button.insertInto(row);\n\
    passField.insertInto(row);\n\
    container.appendChild(row);\n\
\n\
    /* Numeric Field */\n\
    var row = document.createElement('div');\n\
    var numericField = new StyledElements.StyledNumericField({initialValue: 10});\n\
    container.appendChild(numericField);\n\
    var button = new StyledElements.StyledButton({text: 'Reset'});\n\
    button.wrapperElement.style.cssText += 'float: right;';\n\
    var resetNumericField = function(button) {\n\
        numericField.reset();\n\
    };\n\
    button.addEventListener('click', resetNumericField);\n\
    button.insertInto(row);\n\
    numericField.insertInto(row);\n\
    container.appendChild(row);\n\
\n\
    /* Check boxes */\n\
    var group1 = new StyledElements.ButtonsGroup('input5');\n\
    var radiobutton;\n\
    var row = document.createElement('div');\n\
    var button = new StyledElements.StyledButton({text: 'Reset'});\n\
    button.wrapperElement.style.cssText += 'float: right;';\n\
    button.addEventListener('click', EzWebExt.bind(group1.reset, group1));\n\
    button.insertInto(row);\n\
\n\
    radiobutton = new StyledElements.StyledCheckBox(group1, 'uno');\n\
    radiobutton.insertInto(row);\n\
    radiobutton = new StyledElements.StyledCheckBox(group1, 'dos', {initiallyChecked: true});\n\
    radiobutton.insertInto(row);\n\
    radiobutton = new StyledElements.StyledCheckBox(group1, 'tres');\n\
    radiobutton.insertInto(row);\n\
    radiobutton = new StyledElements.StyledCheckBox(group1, 'cuatro', {initiallyChecked: true});\n\
    radiobutton.insertInto(row);\n\
    container.appendChild(row);\n\
\n\
    /* Radio buttons */\n\
    var group2 = new StyledElements.ButtonsGroup('input6');\n\
\n\
    radiobutton = new StyledElements.StyledRadioButton(group2, 'uno');\n\
    container.appendChild(radiobutton);\n\
    radiobutton = new StyledElements.StyledRadioButton(group2, 'dos', {initiallyChecked: true});\n\
    container.appendChild(radiobutton);\n\
    radiobutton = new StyledElements.StyledRadioButton(group2, 'tres');\n\
    container.appendChild(radiobutton);\n\
\n\
    var tmp = document.createElement('br');\n\
    container.appendChild(tmp);\n\
\n\
    var group1Viewer = document.createElement('span');\n\
\n\
    function showGroup1(group) {\n\
        var text = '';\n\
        var value = group.getValue();\n\
        if (value.length > 0)\n\
            text = value[0];\n\
\n\
        for (var i = 1; i < value.length; i++) {\n\
            text += ', ' + value[i];\n\
        }\n\
        EzWebExt.setTextContent(group1Viewer, text);\n\
    }\n\
    showGroup1(group1);\n\
    group1.addEventListener('change', showGroup1);\n\
\n\
    container.appendChild(group1Viewer);\n\
    tmp = document.createElement('br');\n\
    container.appendChild(tmp);\n\
\n\
    var group2Viewer = document.createElement('span');\n\
\n\
    function showGroup2(group) {\n\
        var text = '';\n\
        var value = group.getValue();\n\
        if (value.length > 0)\n\
            text = value[0];\n\
\n\
        for (var i = 1; i < value.length; i++) {\n\
            text += ', ' + value[i];\n\
        }\n\
        EzWebExt.setTextContent(group2Viewer, text);\n\
    }\n\
    showGroup2(group2);\n\
    group2.addEventListener('change', showGroup2);\n\
\n\
    container.appendChild(group2Viewer);\n";

    insertExample("Input Components", code);



    /*
     * Notebook example
     */
    code = "\
    var layout, goToTab3Button, createTabButton, notebook, tab1, tab2, tab3, tab4, tab5; \n\
\n\
    layout = new StyledElements.BorderLayout();\n\
\n\
    goToTab3Button = new StyledElements.StyledButton({'text': 'Go to Tab \"tres\"'});\n\
    layout.getNorthContainer().appendChild(goToTab3Button);\n\
\n\
    createTabButton = new StyledElements.StyledButton({'text': 'New Tab'});\n\
    layout.getNorthContainer().appendChild(createTabButton);\n\
\n\
    notebook = new StyledElements.StyledNotebook();\n\
    tab1 = notebook.createTab({name: 'uno'});\n\
    tab1.appendChild(document.createTextNode('Contenido 1.\\n Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.'));\n\
    tab2 = notebook.createTab({name: 'dos'});\n\
    tab2.appendChild(document.createTextNode('Contenido 2.\\n Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.'));\n\
    tab3 = notebook.createTab({name: 'tres', closable: false});\n\
    tab3.appendChild(document.createTextNode('Contenido 3.\\n Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.'));\n\
    tab4 = notebook.createTab({name: 'una pestaña grande (cuatro)'});\n\
    tab4.appendChild(document.createTextNode('Contenido 4.\\n Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.'));\n\
    tab5 = notebook.createTab({name: 'cinco'});\n\
    tab5.appendChild(document.createTextNode('Contenido 5.\\n Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.'));\n\
    layout.getCenterContainer().appendChild(notebook);\n\
    container.appendChild(layout);\n\
\n\
    goToTab3Button.addEventListener('click', function() {notebook.goToTab(tab3.getId())});\n\
    createTabButton.addEventListener('click', function() {notebook.createTab({name: 'Tab', initiallyVisible: true})});\n\
\n";

    insertExample("Notebook", code);



    /*
     * HPaned example
     */

    code = "\
    var hpaned = new StyledElements.StyledHPaned();\n\
    hpaned.getLeftPanel().appendChild(document.createTextNode('Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.'));\n\
    hpaned.getRightPanel().appendChild(document.createTextNode('Contenido 2.\\n Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.'));\n\
    container.appendChild(hpaned);\n\
    ";

    insertExample("HPaned", code);



    /*
     * Alternatives example
     */
    code = "\
    var goToAlt2Button = new StyledElements.StyledButton({'text': 'Go to Alternative 2'});\n\
    container.appendChild(goToAlt2Button);\n\
\n\
    var alternatives = new StyledElements.StyledAlternatives();\n\
    var alt1 = alternatives.createAlternative();\n\
    alt1.appendChild(document.createTextNode('Contenido 1.\\n Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.'));\n\
    var alt2 = alternatives.createAlternative();\n\
    alt2.appendChild(document.createTextNode('Contenido 2.\\n Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.'));\n\
    var alt3 = alternatives.createAlternative();\n\
    alt3.appendChild(document.createTextNode('Contenido 3.\\n Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.'));\n\
    container.appendChild(alternatives);\n\
\n\
    goToAlt2Button.addEventListener('click', function() {alternatives.showAlternative(alt2.getId())});\n\
\n";

    insertExample("Alternatives", code);



    /*
     * Alert example
     */
    code = "\
    function showInfoAlert() {\n\
        var alert = new StyledElements.StyledAlert('titulo', 'contenido');\n\
        container.appendChild(alert);\n\
    }\n\
    var button = new StyledElements.StyledButton({text: 'Show Info Alert'});\n\
    button.addEventListener('click', showInfoAlert)\n\
    container.appendChild(button);\n\
\n\
    function showWarningAlert() {\n\
        var alert = new StyledElements.StyledAlert('titulo', 'contenido', {'type': EzWebExt.ALERT_WARNING});\n\
        container.appendChild(alert);\n\
    }\n\
    var button = new StyledElements.StyledButton({text: 'Show Warning Alert'});\n\
    button.addEventListener('click', showWarningAlert)\n\
    container.appendChild(button);\n\
\n\
    function showErrorAlert() {\n\
        var alert = new StyledElements.StyledAlert('titulo', 'contenido', {'type': EzWebExt.ALERT_ERROR});\n\
        container.appendChild(alert);\n\
    }\n\
    var button = new StyledElements.StyledButton({text: 'Show Error Alert'});\n\
    button.addEventListener('click', showErrorAlert)\n\
    container.appendChild(button);\n\
\n";
    
    insertExample("Alert", code);


    /*
     * List example
     */
    code = "\n\
    var valueSpan = document.createElement('span');\n\
    valueSpan.style.cssText = 'float: right;';\n\
    container.appendChild(valueSpan);\n\
\n\
    var list = new StyledElements.StyledList({multivalued: true});\n\
    list.addEntries([['0','Uno'],['1'],['2', 'Dos']]);\n\
    list.select(['1']);\n\
    container.appendChild(list);\n\
\n\
    function showSelection(list, value) {\n\
        var text = '';\n\
        if (value.length > 0)\n\
            text = value[0];\n\
\n\
        for (var i = 1; i < value.length; i++) {\n\
            text += ', ' + value[i];\n\
        }\n\
        EzWebExt.setTextContent(valueSpan, text);\n\
    }\n\
    showSelection(null, list.getSelection());\n\
    list.addEventListener('change', showSelection);\n\
\n";
    
    insertExample("List", code);

    /**
     * Accordion example
     */
    code = "\n\
    var accordion, entry;\n\
\n\
    accordion = new StyledElements.Accordion();\n\
    container.appendChild(accordion);\n\
\n\
    entry = accordion.createContainer({title: 'First Entry'});\n\
    entry.appendChild(document.createTextNode('Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.'));\n\
\n\
    entry = accordion.createContainer({title: 'Second Entry'});\n\
    entry.appendChild(document.createTextNode('Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.'));\n\
\n\
    entry = accordion.createContainer({title: 'Third Entry'});\n\
    entry.appendChild(document.createTextNode('Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.'));\n\
\n";

    insertExample("Accordion", code);

    /*
     * PopupMenu example
     */
    code = "\n\
    var popupmenu = new StyledElements.PopupButton({text:'Popup'});\n\
    container.appendChild(popupmenu);\n\
\n\
\n";
    
    insertExample("PopupMenu", code);

    /*
     * Buttons example
     */
    code = "\n\
    var button;\n\
\n\
    button = new StyledElements.StyledButton({text:'Default'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Primary', 'class': 'btn-primary'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Success', 'class': 'btn-success'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Warning', 'class': 'btn-warning'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Danger', 'class': 'btn-danger'});\n\
    container.appendChild(button);\n\
\n\
\n";

    insertExample("Buttons", code);

    /*
     * Labels and Badges example
     */
    code = "\n\
    var wrapper, label, badge;\n\
\n\
    wrapper = document.createElement('div');\n\
    container.appendChild(wrapper);\n\
\n\
    label = document.createElement('span');\n\
    label.className = 'label';\n\
    label.textContent = 'Default';\n\
    wrapper.appendChild(label);\n\
\n\
    label = document.createElement('span');\n\
    label.className = 'label label-success';\n\
    label.textContent = 'Success';\n\
    wrapper.appendChild(label);\n\
\n\
    label = document.createElement('span');\n\
    label.className = 'label label-warning';\n\
    label.textContent = 'Warning';\n\
    wrapper.appendChild(label);\n\
\n\
    label = document.createElement('span');\n\
    label.className = 'label label-important';\n\
    label.textContent = 'Important';\n\
    wrapper.appendChild(label);\n\
\n\
    label = document.createElement('span');\n\
    label.className = 'label label-info';\n\
    label.textContent = 'Info';\n\
    wrapper.appendChild(label);\n\
\n\
    label = document.createElement('span');\n\
    label.className = 'label label-inverse';\n\
    label.textContent = 'Inverse';\n\
    wrapper.appendChild(label);\n\
\n\
    wrapper = document.createElement('div');\n\
    container.appendChild(wrapper);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge';\n\
    badge.textContent = 'Default';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-success';\n\
    badge.textContent = 'Success';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-warning';\n\
    badge.textContent = 'Warning';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-important';\n\
    badge.textContent = 'Important';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-info';\n\
    badge.textContent = 'Info';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-inverse';\n\
    badge.textContent = 'Inverse';\n\
    wrapper.appendChild(badge);\n\
\n";

    insertExample("Labels and Badges", code);

    /*
     * Table example
     */
    code = "\n\
    var table;\n\
\n\
    table = new StyledElements.ModelTable([\n\
        {field: 'id', label: '#', type: 'number'},\n\
        {field: 'description', label: 'description'}\n\
    ]);\n\
    container.appendChild(table);\n\
\n\
    table.pagination.changeElements([\n\
        {id: 1, description: 'First Entry'},\n\
        {id: 2, description: 'Second Entry'},\n\
        {id: 3, description: 'Third Entry'},\n\
        {id: 4, description: 'Fourth Entry'},\n\
        {id: 5, description: 'Fifth Entry'},\n\
        {id: 6, description: 'Sixth Entry. This entry comes with a more detailed description'},\n\
        {id: 7, description: 'Seventh Entry'}\n\
    ])\n";

    insertExample("Tables", code);

    /*
     * Init
     */

    /* Select first example */
    list.select([0]);

    /* Remove loading gif */
    var loadingElement = document.getElementById("loading");
    if (loadingElement) {
        loadingElement.parentNode.removeChild(loadingElement);
    }
}

/* Instanciate the Gadget class */
StyledGadget = new StyledGadget();
