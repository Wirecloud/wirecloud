/*global Wirecloud*/

(function () {

    "use strict";

    var anchor_element = document.createElement('a');
    anchor_element.href = Wirecloud.URLs.LOCAL_REPOSITORY;
    var base_url = anchor_element.href;
    if (base_url[base_url.length - 1] !== '/') {
        base_url += '/';
    }
    base_url += 'static/';

    var workspaceButton = function() {
        return document.getElementsByClassName("icon-menu")[0];
    };

    var workspaceName = function() {
        return document.getElementsByClassName("second_level")[0];
    };

    var cancelButton = function() {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        return layoutManager.currentMenu.htmlElement.getElementsByClassName('window_bottom')[0].getElementsByClassName('styled_button')[1];
    };

    var windowForm = function(callback) {
        var layoutManager, element, old_function;

        layoutManager = LayoutManagerFactory.getInstance();
        if (layoutManager.currentMenu.htmlElement) {
            element = layoutManager.currentMenu.htmlElement;
            callback(element);
        } else {
            old_function = layoutManager._showWindowMenu;

            layoutManager._showWindowMenu = function () {
                old_function.apply(this, arguments);
                layoutManager._showWindowMenu = old_function;
                setTimeout(function () {
                    var element = layoutManager.currentMenu.htmlElement;
                    callback(element);
                }, 0);
            }
        }
    };

    function getField(inputName) {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
         return layoutManager.currentMenu.form.fieldInterfaces[inputName].inputElement.inputElement;
    };

    var isNotEmpty = function(input) {
        return input.value != '';
    };
    var isVersion = function(input) {
        var VERSION_RE = /^([1-9]\d*|0)(?:\.([1-9]\d*|0))*$/;
        if (input.value.match(VERSION_RE) != null) {
            return true;
        } else {
            return false;
        }
    };

    function checkEmail(input) {

        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

        if (!filter.test(input.value)) {
            return false;
        } else {
            return true;
        }
    }

    var noRestriction = function() {
        return true;
    };

    // otrer methods
    var publishWorkspace_in_popUp = function() {
        var popUpElements;

        popUpElements = document.getElementsByClassName("se-popup-menu")[0].childNodes;
        return this.tutorial.findElementByTextContent(popUpElements, 'Upload to my resources');
    };

    var acceptButton = function() {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        return layoutManager.currentMenu.htmlElement.getElementsByClassName('btn-primary styled_button')[0];
    };

    Wirecloud.TutorialCatalogue.add('save-mashups', new Wirecloud.ui.Tutorial(gettext('Save & share your mashups'), [
            {'type': 'simpleDescription', 'title': gettext('Upload your Workspace'), 'msg': gettext("<p>You can upload your workspace in your local catalogue</p>"), 'elem': null},
            {'type': 'userAction', 'msg': gettext("Please click here to display the Workspaces menu management."), 'elem': workspaceButton, 'pos': 'downRight'},
            {'type': 'userAction', 'msg': gettext("Click <em>Upload to my resources</em>"), 'elem': publishWorkspace_in_popUp, 'pos': 'downRight'},
            {'type': 'formAction',
             'mainTitle': 'Upload your Workspace',
             'mainMsg': "Complete the form",
             'mainPos': 'right',
             'form': windowForm,
             'actionElements': [getField.bind(null,'name'), getField.bind(null,'vendor'), getField.bind(null,'version'), getField.bind(null,'email'), getField.bind(null,'description'), getField.bind(null,'doc'), getField.bind(null,'authors')],
             'actionElementsValidators': [isNotEmpty, isNotEmpty, isVersion, checkEmail, noRestriction, noRestriction, noRestriction],
             'actionMsgs': ["Write a name for your mashup","Add the vendor name of your mashup", "Add de version of your mashup", "Add your email", "Add your mashup description", "Add your homepage", "Add the author(s) name"],
             'endElement': acceptButton,
             'actionElementsPos': ['topRight', 'topLeft', 'downRight', 'downLeft', 'topRight', 'topRight', 'topRight'],
             'endElementMsg': "Click here to submit",
             'endElementPos': 'topLeft',
             'asynchronous': true,
             'disableElems': [cancelButton]},
            {'type': 'simpleDescription', 'msg': "Congratulations you've upload your mashup to your local marketplace.", 'elem': workspaceName}
    ]));

})();
