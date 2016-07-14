/* globals LayoutManagerFactory, Wirecloud */

(function (utils) {

    "use strict";

    var anchor_element = document.createElement('a');
    anchor_element.href = Wirecloud.URLs.LOCAL_REPOSITORY;
    var base_url = anchor_element.href;
    if (base_url[base_url.length - 1] !== '/') {
        base_url += '/';
    }
    base_url += 'static/';

    var workspaceButton = function workspaceButton() {
        return document.getElementsByClassName("icon-menu")[0];
    };

    var workspaceName = function workspaceName() {
        return document.getElementsByClassName("second_level")[0];
    };

    var cancelButton = function cancelButton() {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        return layoutManager.currentMenu.htmlElement.getElementsByClassName('window_bottom')[0].getElementsByClassName('se-btn')[1];
    };

    var windowForm = function windowForm(callback) {
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
            };
        }
    };

    var getField = function getField(inputName) {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        return layoutManager.currentMenu.form.fieldInterfaces[inputName].inputElement.inputElement;
    };

    var isNotEmpty = function isNotEmpty(input) {
        return input.value.trim() !== '';
    };

    var isVersion = function isVersion(input) {
        try {
            new Wirecloud.Version(input);
        } catch (e) {
            return false;
        }
        return true;
    };

    var checkEmail = function checkEmail(input) {

        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

        if (!filter.test(input.value)) {
            return false;
        } else {
            return true;
        }
    }

    var noRestriction = function noRestriction() {
        return true;
    };

    // otrer methods
    var publishWorkspace_in_popUp = function publishWorkspace_in_popUp() {
        var popUpElements;

        popUpElements = document.getElementsByClassName("se-popup-menu")[0].childNodes;
        return this.tutorial.findElementByTextContent(popUpElements, 'Upload to my resources');
    };

    var acceptButton = function acceptButton() {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        return layoutManager.currentMenu.htmlElement.getElementsByClassName('btn-primary se-btn')[0];
    };

    Wirecloud.TutorialCatalogue.add('save-mashups', new Wirecloud.ui.Tutorial(utils.gettext('Save & share your mashups'), [
            {'type': 'simpleDescription', 'title': utils.gettext('Upload your Workspace'), 'msg': utils.gettext("<p>You can upload your workspace in your local catalogue</p>"), 'elem': null},
            {'type': 'userAction', 'msg': utils.gettext("Please click here to display the Workspaces menu management."), 'elem': workspaceButton, 'pos': 'downRight'},
            {'type': 'userAction', 'msg': utils.gettext("Click <em>Upload to my resources</em>"), 'elem': publishWorkspace_in_popUp, 'pos': 'downRight'},
            {'type': 'formAction',
             'mainTitle': 'Upload your Workspace',
             'mainMsg': "Complete the form",
             'mainPos': 'right',
             'form': windowForm,
             'actionElements': [getField.bind(null, 'name'), getField.bind(null, 'vendor'), getField.bind(null, 'version'), getField.bind(null, 'email'), getField.bind(null, 'description'), getField.bind(null, 'doc'), getField.bind(null, 'authors')],
             'actionElementsValidators': [isNotEmpty, isNotEmpty, isVersion, checkEmail, noRestriction, noRestriction, noRestriction],
             'actionMsgs': ["Write a name for your mashup", "Add the vendor name of your mashup", "Add de version of your mashup", "Add your email", "Add your mashup description", "Add your homepage", "Add the author(s) name"],
             'endElement': acceptButton,
             'actionElementsPos': ['topRight', 'topLeft', 'downRight', 'downLeft', 'topRight', 'topRight', 'topRight'],
             'endElementMsg': "Click here to submit",
             'endElementPos': 'topLeft',
             'asynchronous': true,
             'disableElems': [cancelButton]},
            {'type': 'simpleDescription', 'msg': "Congratulations you've upload your mashup to your local marketplace.", 'elem': workspaceName}
    ]));

})(Wirecloud.Utils);
