/*---------------------------------------------------------------------------*
 *                               Styled Gadget                               *
 *---------------------------------------------------------------------------*/

var init = function init() {
    var layout = new StyledElements.BorderLayout();
    layout.insertInto(document.body);
    MashupPlatform.widget.context.registerCallback(function (new_values) {
        if ('heightInPixels' in new_values || 'widthInPixels' in new_values) {
            layout.repaint();
        }
    });

    var alternatives = new StyledElements.StyledAlternatives();

    /* Left Content */
    var onChange = function(component, newSelection, newElements, removedElements) {
        if (newSelection.length > 0)
            alternatives.showAlternative(newSelection[0]);
    }
    var list = new StyledElements.StyledList({id: 'list', multivalued: false});
    list.addEventListener('change', onChange);
    layout.getWestContainer().appendChild(list);

    /* Right Content */
    layout.getCenterContainer().appendChild(alternatives);


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

    function insertHTMLExample(name, code) {
        var panelNotebook = new StyledElements.StyledNotebook();
        var container = panelNotebook.createTab({name: "View", closable: false});

        try {
            container.wrapperElement.innerHTML = code;
        } catch (e) {
            container.clear();
            container.appendChild(document.createTextNode(e));
        }

        var alternative = alternatives.createAlternative();
        alternative.appendChild(panelNotebook);

        list.addEntries([[alternative.getId(), name]]);

        var preText = document.createElement("pre");
        var codeTab = panelNotebook.createTab({name: "HTML", closable: false});
        preText.appendChild(document.createTextNode(code));
        codeTab.appendChild(preText);
    }

    var code;

    /*
     * Headings
     */
    code = "\
    <h1>h1. Heading 1</h1>\n\
    <h2>h2. Heading 2</h2>\n\
    <h3>h3. Heading 3</h3>\n\
    <h4>h4. Heading 4</h4>\n\
    <h5>h5. Heading 5</h5>\n\
    <h6>h6. Heading 6</h6>\n\
";
    insertHTMLExample("Headings", code);

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
    /* Numeric Field */\n\
    var row = document.createElement('div');\n\
    var numberField = new StyledElements.StyledNumericField({initialValue: 1});\n\
    var button = new StyledElements.StyledButton({text: 'Reset'});\n\
    button.wrapperElement.style.cssText += 'float: right;';\n\
    var resetNumberField = function(button) {\n\
        numberField.reset();\n\
    };\n\
    button.addEventListener('click', resetNumberField);\n\
    button.insertInto(row);\n\
    numberField.insertInto(row);\n\
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
    /* Check boxes */\n\
    var group1 = new StyledElements.ButtonsGroup('input5');\n\
    var radiobutton;\n\
    var row = document.createElement('div');\n\
    var button = new StyledElements.StyledButton({text: 'Reset'});\n\
    button.wrapperElement.style.cssText += 'float: right;';\n\
    button.addEventListener('click', group1.reset.bind(group1));\n\
    button.insertInto(row);\n\
\n\
    radiobutton = new StyledElements.StyledCheckBox({group: group1, value: 'one'});\n\
    radiobutton.insertInto(row);\n\
    radiobutton = new StyledElements.StyledCheckBox({group: group1, value: 'two', initiallyChecked: true});\n\
    radiobutton.insertInto(row);\n\
    radiobutton = new StyledElements.StyledCheckBox({group: group1, value: 'three'});\n\
    radiobutton.insertInto(row);\n\
    radiobutton = new StyledElements.StyledCheckBox({group: group1, value: 'four', initiallyChecked: true});\n\
    radiobutton.insertInto(row);\n\
    container.appendChild(row);\n\
\n\
    /* Radio buttons */\n\
    var group2 = new StyledElements.ButtonsGroup('input6');\n\
\n\
    radiobutton = new StyledElements.StyledRadioButton({group: group2, value: 'one'});\n\
    container.appendChild(radiobutton);\n\
    radiobutton = new StyledElements.StyledRadioButton({group: group2, value: 'two', initiallyChecked: true});\n\
    container.appendChild(radiobutton);\n\
    radiobutton = new StyledElements.StyledRadioButton({group: group2, value: 'three'});\n\
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
        group1Viewer.textContent = text;\n\
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
        group2Viewer.textContent = text;\n\
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
     * Alternatives example
     */
    code = "\
    var layout = layout = new StyledElements.BorderLayout();\n\
    container.appendChild(layout);\n\
\n\
    var goToAlt1Button = new StyledElements.StyledButton({'text': 'Go to first alternative'});\n\
    goToAlt1Button.disable();\n\
    layout.getNorthContainer().appendChild(goToAlt1Button);\n\
\n\
    var goToAlt2Button = new StyledElements.StyledButton({'text': 'Go to second alternative'});\n\
    layout.getNorthContainer().appendChild(goToAlt2Button);\n\
\n\
    var alternatives = new StyledElements.StyledAlternatives();\n\
    var alt1 = alternatives.createAlternative();\n\
    alt1.appendChild(document.createTextNode('First Alternative.\\n Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.'));\n\
    var alt2 = alternatives.createAlternative();\n\
    alt2.appendChild(document.createTextNode('Second Alternative.\\n Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci. Aenean dignissim pellentesque felis.'));\n\
    layout.getCenterContainer().appendChild(alternatives);\n\
\n\
    goToAlt1Button.addEventListener('click', function() {\n\
        goToAlt2Button.enable();\n\
        goToAlt1Button.disable();\n\
        alternatives.showAlternative(alt1);\n\
    });\n\
    goToAlt2Button.addEventListener('click', function() {\n\
        goToAlt1Button.enable();\n\
        goToAlt2Button.disable();\n\
        alternatives.showAlternative(alt2);\n\
    });\n\
\n";

    insertExample("Alternatives", code);



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
        valueSpan.textContent = text;\n\
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
     * Popover example
     */
    code = "\n\
    var button, popover;\n\
\n\
    //button = new StyledElements.StyledButton({'class': 'icon-question-sign', plain: true});\n\
    button = new StyledElements.StyledButton({text: 'Popover on left'});\n\
    container.appendChild(button);\n\
\n\
    popover = new StyledElements.Popover({title: 'Popover left', content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.', placement: ['left']});\n\
    popover.bind(button, 'click')\n\
\n\
    button = new StyledElements.StyledButton({text: 'Popover on top'});\n\
    container.appendChild(button);\n\
\n\
    popover = new StyledElements.Popover({title: 'Popover top', content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.', placement: ['top']});\n\
    popover.bind(button, 'click')\n\
\n\
    button = new StyledElements.StyledButton({text: 'Popover on bottom'});\n\
    container.appendChild(button);\n\
\n\
    popover = new StyledElements.Popover({title: 'Popover bottom', content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.', placement: ['bottom']});\n\
    popover.bind(button, 'click')\n\
\n\
    button = new StyledElements.StyledButton({text: 'Popover on right'});\n\
    container.appendChild(button);\n\
\n\
    popover = new StyledElements.Popover({title: 'Popover right', content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.', placement: ['right']});\n\
    popover.bind(button, 'click')\n\
\n\
    button = new StyledElements.StyledButton({text: 'Auto placement popover'});\n\
    container.appendChild(button);\n\
\n\
    popover = new StyledElements.Popover({content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.'});\n\
    popover.bind(button, 'click')\n\
\n";

    insertExample("Popupover", code);

    /*
     * Buttons example
     */
    code = "\n\
    var title, button;\n\
\n\
    title = document.createElement('h3');\n\
    title.textContent = 'Normal buttons';\n\
    container.appendChild(title);\n\
\n\
    button = new StyledElements.StyledButton({text:'Default'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Primary', 'class': 'btn-primary'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Info', 'class': 'btn-info'});\n\
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
    title = document.createElement('h3');\n\
    title.textContent = 'Sizes';\n\
    container.appendChild(title);\n\
\n\
    button = new StyledElements.StyledButton({text:'Large button', 'class': 'btn-large'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Normal button'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Small button', 'class': 'btn-small'});\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Mini button', 'class': 'btn-mini'});\n\
    container.appendChild(button);\n\
\n\
    title = document.createElement('h3');\n\
    title.textContent = 'Disabled state';\n\
    container.appendChild(title);\n\
\n\
    button = new StyledElements.StyledButton({text:'Default'});\n\
    button.disable();\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Primary', 'class': 'btn-primary'});\n\
    button.disable();\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Info', 'class': 'btn-info'});\n\
    button.disable();\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Success', 'class': 'btn-success'});\n\
    button.disable();\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Warning', 'class': 'btn-warning'});\n\
    button.disable();\n\
    container.appendChild(button);\n\
\n\
    button = new StyledElements.StyledButton({text:'Danger', 'class': 'btn-danger'});\n\
    button.disable();\n\
    container.appendChild(button);\n\
\n";

    insertExample("Buttons", code);

    /*
     * Labels and Badges example
     */
    code = "\n\
    var title, wrapper, label, badge;\n\
\n\
    title = document.createElement('h3');\n\
    title.textContent = 'Labels';\n\
    container.appendChild(title);\n\
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
    title = document.createElement('h3');\n\
    title.textContent = 'Badges';\n\
    container.appendChild(title);\n\
    wrapper = document.createElement('div');\n\
    container.appendChild(wrapper);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge';\n\
    badge.textContent = '1';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-success';\n\
    badge.textContent = '2';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-warning';\n\
    badge.textContent = '3';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-important';\n\
    badge.textContent = '4';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-info';\n\
    badge.textContent = '5';\n\
    wrapper.appendChild(badge);\n\
\n\
    badge = document.createElement('span');\n\
    badge.className = 'badge badge-inverse';\n\
    badge.textContent = '6';\n\
    wrapper.appendChild(badge);\n\
\n";

    insertExample("Labels and Badges", code);

    /*
     * Table example
     */
    code = "\n\
    var layout, table, south_layout, text_input, search_addon, search_icon, search_button;\n\
\n\
    layout = new StyledElements.BorderLayout();\n\
    container.appendChild(layout);\n\
\n\
    table = new StyledElements.ModelTable([\n\
        {field: 'id', label: '#', width: '3ex', type: 'number'},\n\
        {field: 'description', label: 'description'},\n\
        {field: 'odd', label: 'odd', width: '3ex', sortable: false}\n\
    ], {\n\
        id: 'id'\n\
    });\n\
    layout.getCenterContainer().appendChild(table);\n\
\n\
    south_layout = new StyledElements.HorizontalLayout({'class': 'input input-prepend input-append'});\n\
    layout.getSouthContainer().appendChild(south_layout);\n\
\n\
    search_addon = new StyledElements.Addon({title: 'Search'});\n\
    search_icon = document.createElement('i');\n\
    search_icon.className = 'icon-search';\n\
    search_addon.appendChild(search_icon);\n\
    south_layout.getWestContainer().appendChild(search_addon);\n\
\n\
    text_input = new StyledElements.StyledTextField({placeholder: 'Search keywords'});\n\
    south_layout.getCenterContainer().appendChild(text_input);\n\
    search_addon.assignInput(text_input);\n\
\n\
    search_button = new StyledElements.StyledButton({\n\
        text: 'Search'\n\
    });\n\
    search_button.addEventListener('click', function () {\n\
        table.pagination.changeOptions({'keywords': text_input.getValue()});\n\
    });\n\
    \n\
    south_layout.getEastContainer().appendChild(search_button);\n\
\n\
    table.pagination.changeElements([\n\
        {id: 1, description: 'First Entry', odd: true},\n\
        {id: 2, description: 'Second Entry', odd: false},\n\
        {id: 3, description: 'Third Entry', odd: true},\n\
        {id: 4, description: 'Fourth Entry', odd: false},\n\
        {id: 5, description: 'Fifth Entry', odd: true},\n\
        {id: 6, description: 'Sixth Entry. This entry comes with a more detailed description', odd: false},\n\
        {id: 7, description: 'Seventh Entry', odd: true}\n\
    ])\n\
    table.addEventListener('click', function (data) { table.select(data.id); });\n";

    insertExample("Tables", code);

    /*
     * Form example
     */
    code = "\n\
    var form;\n\
\n\
    form = new StyledElements.Form([\n\
        {label: 'Identifier', field: 'id', type: 'text', },\n\
        {label: 'Description', field: 'description', type: 'longtext'},\n\
        {label: 'Odd', field: 'odd', type: 'boolean'},\n\
        {label: 'Photo Quality', field: 'quality', type: 'buttons', kind: 'radio', buttons: [{label: 'Great', value: 'great'}, {label: 'Good', value: 'good'}, {label: 'Poor', value: 'poor'}]},\n\
        {label: 'Photo Type', field: 'type', type: 'select', initialEntries: [{label: 'Great', value: 'great'}, {label: 'Good', value: 'good'}, {label: 'Poor', value: 'poor'}]}\n\
    ]);\n\
    container.appendChild(form);";

    insertExample("Forms", code);

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

    layout.repaint();

};

window.addEventListener('load', init, true);
