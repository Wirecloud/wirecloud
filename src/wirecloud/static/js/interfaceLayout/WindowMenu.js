/*
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */

/**
 * Base class for managing window menus whose HTML code is in templates/index.html.
 */

function WindowMenu(title, extra_class) {
    // Allow hierarchy
    if (arguments.length == 0)
        return;

    this.childWindow = null;
    this.htmlElement = document.createElement('div');  // create the root HTML element
    Element.extend(this.htmlElement);
    this.htmlElement.className = "window_menu";
    if (extra_class != null) {
        this.htmlElement.addClassName(extra_class);
    }

    // Window Top
    var windowTop = document.createElement('div');
    windowTop.className = "window_top";
    this.htmlElement.appendChild(windowTop);

    this._closeListener = this._closeListener.bind(this);
    this.closeButton = new StyledElements.StyledButton({
        'class': "closebutton",
        'plain': true
    });
    this.closeButton.insertInto(windowTop);
    this.closeButton.addEventListener("click", this._closeListener);

    this.titleElement = document.createElement('div');
    Element.extend(this.titleElement);
    this.titleElement.className = "window_title";
    windowTop.appendChild(this.titleElement);

    var clearer = document.createElement('div');
    Element.extend(clearer);
    clearer.addClassName("floatclearer");
    windowTop.appendChild(clearer);

    // Window Content
    this.windowContent = document.createElement('div');
    Element.extend(this.windowContent);
    this.windowContent.className = "window_content";
    this.htmlElement.appendChild(this.windowContent);

    this.iconElement = document.createElement('div');
    Element.extend(this.iconElement);
    this.iconElement.className = "window-icon icon-size";
    this.windowContent.appendChild(this.iconElement);

    this.msgElement = document.createElement('div');
    Element.extend(this.msgElement);
    this.msgElement.className = "msg";
    this.windowContent.appendChild(this.msgElement);

    // Window Bottom
    this.windowBottom = document.createElement('div');
    Element.extend(this.windowBottom);
    this.windowBottom.className = "window_bottom";
    this.htmlElement.appendChild(this.windowBottom);

    // Initial title
    this.setTitle(title);
}


WindowMenu.prototype.setTitle = function(title) {
    this.titleElement.setTextContent('/' + title);
};

/**
 * @private
 *
 * Click Listener for the close button.
 */
WindowMenu.prototype._closeListener = function(e) {
    this.hide();
}

/**
 * Updates the message displayed by this <code>WindowMenu</code>
 */
WindowMenu.prototype.setMsg = function (msg) {
    this.msgElement.setTextContent(msg);

    if (isElement(this.htmlElement.parentNode)) {
        this.calculatePosition();
    }
}

/**
 * @private
 *
 * Calculates a usable absolute position for the window
 */
WindowMenu.prototype.calculatePosition = function() {
    var coordenates = [];

    var windowHeight = BrowserUtilsFactory.getInstance().getHeight();
    var windowWidth = BrowserUtilsFactory.getInstance().getWidth();

    this.htmlElement.setStyle({'max-height' : 'none'});
    var menuHeight = this.htmlElement.getHeight();
    var menuWidth = this.htmlElement.getWidth();

    if (menuWidth > windowWidth/2) {
        menuWidth = windowWidth/2; //IE6 hack
        this.htmlElement.setStyle({'width': menuWidth+'px'});
    }

    coordenates[1] = windowHeight/2 - menuHeight/2;
    coordenates[0] = windowWidth/2 - menuWidth/2;

    if (windowHeight < menuHeight) {
        var windowStyle = document.defaultView.getComputedStyle(this.htmlElement, null);

        var padding;
        padding = windowStyle.getPropertyCSSValue("padding-top").
                  getFloatValue(CSSPrimitiveValue.CSS_PX);
        padding+= windowStyle.getPropertyCSSValue("padding-bottom").
                  getFloatValue(CSSPrimitiveValue.CSS_PX);

        this.htmlElement.setStyle({'max-height': windowHeight - padding + 'px',
                                   'top': '0px'});
    } else {
        this.htmlElement.style.top = coordenates[1]+"px";
    }
    this.htmlElement.style.left = coordenates[0]+"px";

    if (this.childWindow != null) {
        this.childWindow.calculatePosition();
    }
}

/**
 *
 */
WindowMenu.prototype.setHandler = function (handler) {
    this.operationHandler = handler;
}

/**
 * Makes this WindowMenu visible.
 *
 * @param parentWindow
 */
WindowMenu.prototype.show = function (parentWindow) {
    this._parentWindowMenu = parentWindow;

    if (this._parentWindowMenu != null) {
        this._parentWindowMenu._addChildWindow(this);
    } else {
        LayoutManagerFactory.getInstance()._showWindowMenu(this);
    }

    document.body.appendChild(this.htmlElement);
    this.calculatePosition();
    this.htmlElement.style.display = "block";
    this.setFocus();
}

/**
 * Makes this WindowMenu hidden.
 */
WindowMenu.prototype.hide = function () {
    if (!isElement(this.htmlElement.parentNode)) {
        // This windowmenu is currently hidden => Nothing to do
        return;
    }

    this.htmlElement.parentNode.removeChild(this.htmlElement);
    if (this.msgElement != null) {
        this.msgElement.update();
    }
    if (this.childWindow != null) {
        this.childWindow.hide();
    }

    if (this._parentWindowMenu != null) {
        this._parentWindowMenu._removeChildWindow(this);
        this._parentWindowMenu = null;
    } else {
        LayoutManagerFactory.getInstance().hideCover();
    }
}

WindowMenu.prototype._addChildWindow = function (windowMenu) {
    if (windowMenu !== this) {
        this.childWindow = windowMenu;
    } else {
        throw TypeError('Window menus cannot be its own child');
    }
};

WindowMenu.prototype._removeChildWindow = function (windowMenu) {
    if (this.childWindow === windowMenu) {
        this.childWindow = null;
    }
};

WindowMenu.prototype.setFocus = function () {
}

/**
 * Specific class representing alert dialogs
 */
function AlertWindowMenu () {
    WindowMenu.call(this, gettext('Warning'));

    // Warning icon
    this.iconElement.className += ' icon-warning';

    // Accept button
    this.acceptButton = document.createElement('button');

    Element.extend(this.acceptButton);
    this.acceptButton.appendChild(document.createTextNode(gettext('Yes')));
    this._acceptListener = this._acceptListener.bind(this);
    this.acceptButton.observe("click", this._acceptListener);
    this.windowBottom.appendChild(this.acceptButton);

    // Cancel button
    this.cancelButton = document.createElement('button');
    Element.extend(this.cancelButton);
    this.cancelButton.appendChild(document.createTextNode(gettext('No')));
    this.cancelButton.observe("click", this._closeListener);
    this.windowBottom.appendChild(this.cancelButton);

    this.acceptHandler = null;
    this.cancelHandler = null;
}
AlertWindowMenu.prototype = new WindowMenu();

AlertWindowMenu.prototype._acceptListener = function(e) {
    this.acceptHandler();
    this.hide();
}

AlertWindowMenu.prototype._closeListener = function(e) {
    WindowMenu.prototype._closeListener.call(this, e);
    if (this.cancelHandler) this.cancelHandler();
}

AlertWindowMenu.prototype.setHandler = function(acceptHandler, cancelHandler) {
    this.acceptHandler = acceptHandler;
    this.cancelHandler = cancelHandler;
}

AlertWindowMenu.prototype.setFocus = function() {
    this.acceptButton.focus();
}


/**
 * Specific class representing alert dialogs.
 */
function MessageWindowMenu (element) {
    WindowMenu.call(this, '');

    // Accept button
    this.button = document.createElement('button');
    Element.extend(this.button);
    this.button.appendChild(document.createTextNode(gettext('Accept')));
    this.windowBottom.appendChild(this.button);
    this.button.observe("click", this._closeListener);
}
MessageWindowMenu.prototype = new WindowMenu();

MessageWindowMenu.prototype.setFocus = function() {
    setTimeout(this.button.focus.bind(this.button), 0);
    //this.button.focus();
};

MessageWindowMenu.prototype.show = function (parentWindow) {
    WindowMenu.prototype.show.call(this, parentWindow);
    this.setFocus();
};

MessageWindowMenu.prototype.setType = function(type) {
    var titles = ['', gettext('Error'), gettext('Warning'), gettext('Info')];
    var icons = ['', 'icon-error', 'icon-warning', 'icon-info'];

    // Update title
    this.setTitle(titles[type]);

    // Update icon
    this.iconElement.className += ' ' + icons[type];
}

/**
 * Specific class for info dialogs.
 */
function InfoWindowMenu(title) {
    if (arguments.length == 0)
        return;

    WindowMenu.call(this, title);

    // Extra HTML Elements
    this.iconElement.className += ' icon-info';

    this.checkbox = document.createElement('input');
    Element.extend(this.checkbox);
    this.checkbox.setAttribute('type', 'checkbox');
    this.windowBottom.appendChild(this.checkbox);
    this.windowBottom.appendChild(document.createTextNode(gettext('Don\'t show me anymore')));

    // Event Listeners
    this._dontShowAnymore = this._dontShowAnymore.bind(this);

    this.checkbox.observe("click", this._dontShowAnymore);
}
InfoWindowMenu.prototype = new WindowMenu();

InfoWindowMenu.prototype._dontShowAnymore = function(e) {
    var layoutManager = LayoutManagerFactory.getInstance();
    var changes = {};
    changes['tip-' + this.type] = {value: false};
    PreferencesManagerFactory.getInstance().getPlatformPreferences().set(changes);

    this.hide();
}

/**
 *
 */
InfoWindowMenu.prototype.show = function (type, parentWindow) {
    this.type = type;
    this.checkbox.checked = false;

    WindowMenu.prototype.show.call(this, parentWindow);
}

/**
 * Specific class for tip dialogs.
 */
function TipWindowMenu() {
    InfoWindowMenu.call(this, gettext('Do you know what ... ?'));
}
TipWindowMenu.prototype = new InfoWindowMenu();


/**
 * Form dialog.
 */
var FormWindowMenu = function FormWindowMenu (fields, title, extra_class) {

    // Allow hierarchy
    if (arguments.length === 0) {
        return;
    }

    WindowMenu.call(this, title, extra_class);
    // TODO
    this.windowContent.parentNode.removeChild(this.windowContent);
    this.windowContent = null;
    this.iconElement = null;
    this.msgElement = null;
    this.windowBottom.parentNode.removeChild(this.windowBottom);
    this.windowBottom = null;

    this.form = new Form(fields, {
        factory: Wirecloud.form.WirecloudInterfaceFactory
    });
    this.form.insertInto(this.htmlElement);
    this.form.addEventListener('submit', function (form, data) {
        try {
            this.executeOperation(data);
        } catch (e) {};
        this.hide();
    }.bind(this));
    this.form.addEventListener('cancel', this._closeListener);
};
FormWindowMenu.prototype = new WindowMenu();

FormWindowMenu.prototype.setValue = function setValue (newValue) {
    this.form.setData(newValue);
};

FormWindowMenu.prototype.show = function (parentWindow) {
    this.form.reset();
    WindowMenu.prototype.show.call(this, parentWindow);
};

/**
 * Specific class for publish windows
 */
function PublishWindowMenu(workspace) {

    var fields, marketFields;
    marketFields = this._loadAvailableMarkets();

    fields = [
        {
            'type': 'group',
            'shortTitle': gettext('General info'),
            'fields': [
                {name: 'name', label: gettext('Mashup Name'), type: 'text', required: true, initialValue: workspace.getName(), defaultValue: workspace.getName()},
                {name: 'vendor', label: gettext('Vendor'), type:'text',  required: true},
                {name: 'version', label: gettext('Version'), type:'text',  required: true},
                {name: 'email', label: gettext('Email'), type:'text',  required: true},
                {name: 'description', label: gettext('Description'), type:'longtext'},
                {name: 'wikiURI', label: gettext('Homepage'), type:'text'},
                {name: 'author', label: gettext('Author'), type:'text',  initialValue: ezweb_user_name, defaultValue: ezweb_user_name}
            ]
        },
        {
            'type': 'group',
            'shortTitle': gettext('Media'),
            'fields': [
                {
                    name: 'imageURI',
                    label: gettext('Image shown in catalogue (170x80 px)'),
                    type: 'text'
                }
            ]
        },
        {
            'type': 'group',
            'shortTitle': gettext('Advanced'),
            'fields': [
                {name: 'readOnlyWidgets', label: gettext('Block widgets'), type: 'boolean'},
                {name: 'readOnlyConnectables', label: gettext('Block connections'), type: 'boolean'}
            ]
        },
        {
            'type': 'group',
            'shortTitle': gettext('Publish place'),
            'fields': marketFields
        }
    ];

    this._addVariableParametrization(workspace, fields);
    FormWindowMenu.call(this, fields, gettext('Publish Workspace'), 'publish_workspace');

    //fill a warning message
    var warning = document.createElement('div');
    Element.extend(warning);
    warning.addClassName('msg warning');
    warning.update(gettext("WARNING: configured and stored data in your workspace (properties and preferences except passwords) will be shared!"));
    this.htmlElement.insertBefore(warning, this.form.wrapperElement);
}
PublishWindowMenu.prototype = new FormWindowMenu();

PublishWindowMenu.prototype._addVariableParametrization = function (workspace, fields) {
    var i, tab_keys, tab_field;

    this.workspace = workspace;
    tab_keys = workspace.tabInstances.keys();

    for (i = 0; i < tab_keys.length; i += 1) {
        tab_field = this._parseTab(workspace.tabInstances.get(tab_keys[i]));
        if (tab_field !== null) {
            fields.push(tab_field);
        }
    }
};

PublishWindowMenu.prototype._parseTab = function (tab) {

    var i, name, iwidget, iwidgets, iwidget_params, pref_params,
        prop_params, variable, variables, varManager, var_elements,
        fields;

    varManager = tab.workSpace.getVarManager();
    iwidgets = tab.getDragboard().getIWidgets();
    fields = [];

    for (i = 0; i < iwidgets.length; i++) {
        iwidget = iwidgets[i];
        variables = varManager.getIWidgetVariables(iwidget.getId());
        pref_params = [];
        prop_params = [];

        for (name in variables) {
            variable = variables[name];
            if (variable.vardef.aspect === Variable.prototype.USER_PREF) {
                pref_params.push({
                    label: variable.getLabel(),
                    type: 'parametrizableValue',
                    variable: variable,
                    canBeHidden: true,
                    parentWindow: this
                });
            } else if (variable.vardef.aspect === Variable.prototype.PROPERTY) {
                prop_params.push({
                    label: variable.getLabel(),
                    type: 'parametrizableValue',
                    variable: variable,
                    parentWindow: this
                });
            }
        }

        var_elements = {};
        if (pref_params.length !== 0) {
            var_elements['pref'] = {
                label: gettext('Preferences'),
                type: 'fieldset',
                fields: pref_params.sort(this._sortVariables)
            }
        }
        if (prop_params.length !== 0) {
            var_elements['props'] = {
                label: gettext('Properties'),
                type: 'fieldset',
                fields: prop_params.sort(this._sortVariables)
            }
        }

        if (pref_params.length + prop_params.length !== 0) {
            fields.push({
                name: iwidget.id,
                label: iwidget.name,
                type: 'fieldset',
                nested: true,
                fields: var_elements
            });
        }
    }

    if (fields.length > 0) {
        return {
            'shortTitle': tab.tabInfo.name,
            'fields': fields,
            'nested': true,
            'name': 'tab-' + tab.tabInfo.name
        }
    } else {
        return null;
    }
};

PublishWindowMenu.prototype._sortVariables = function (var1, var2) {
    return var1.variable.vardef.order - var2.variable.vardef.order;
};

PublishWindowMenu.prototype._loadAvailableMarkets = function _loadAvailableMarkets() {
    // Take available marketplaces from the instance of marketplace view
    var views = LayoutManagerFactory.getInstance().viewsByName['marketplace'].viewsByName;
    var key, marketInfo = [];

    for (key in views) {
        marketInfo = marketInfo.concat(views[key].getPublishEndpoint());
    }
    return marketInfo;
};

PublishWindowMenu.prototype.show = function(parentWindow) {
    WindowMenu.prototype.show.call(this, parentWindow);
    this.setValue(this.workspace.workSpaceGlobalInfo.workspace.params);
};

PublishWindowMenu.prototype.setFocus = function() {
    this.form.fieldInterfaces['name'].focus();
};

PublishWindowMenu.prototype._createMarketplaceData = function _createMarketplaceData (data) {
    var views = LayoutManagerFactory.getInstance().viewsByName['marketplace'].viewsByName;
    var key, marketplaces = [];
    for (key in views) {
        marketplaces = marketplaces.concat(views[key].getPublishData(data))
    }
    return marketplaces;
};

PublishWindowMenu.prototype.executeOperation = function executeOperation (data) {
    var key;

    data.parametrization = {};
    data.marketplaces = this._createMarketplaceData(data);

    for (key in data) {
        if (key.startsWith('tab-')) {
            EzWebExt.merge(data.parametrization, data[key]);
            delete data[key];
        }
    }
    OpManagerFactory.getInstance().activeWorkSpace.publish(data);
};

/**
 * Specific class for sharing windows
 */
function ShareWindowMenu () {

    var label1 = gettext('Share current workspace with everybody through either a public URL or an embed object')
    var label2 = gettext('Share current workspace only with the following groups')

    var fields = {
        'public_sharing': {label: label1, type:'radio', defaultValue:true, name:'share', onclick: this.hideGroups.bind(this)},
        'group_sharing':  {label: label2, type:'radio', defaultValue:false, name:'share', onclick: this.showGroups.bind(this)},
        'groups':         {label: '', type: 'multiple', options: []}
    }

    FormWindowMenu.call(this, fields, gettext('Share Workspace'));
    // TODO Remove this workaround
    // hide the whole row where the groups select is
    this.fields['groups'].inputInterface.inputElement.parentNode.parentNode.style.display = 'none';
    this.fields['groups'].inputInterface.inputElement.addClassName('window_multiple_select');

    var warning = document.createElement('div');
    Element.extend(warning);
    warning.addClassName('msg warning');
    warning.update(gettext("WARNING: configured and stored data in your workspace (properties and preferences except passwords) will be shared!"));
    this.windowContent.appendChild(warning);
}
ShareWindowMenu.prototype = new FormWindowMenu();

ShareWindowMenu.prototype.showGroups = function() {
    function onError(transport, e) {
        errorMsg = gettext('The available groups cannot be displayed');
        this.setMsg(errorMsg);
        this.calculatePosition();
    }

    function onSuccess(transport) {
        var response = transport.responseText;
        var groups = JSON.parse(response);

        // TODO Remove this workaround
        var select = this.fields['groups'].inputInterface.inputElement;
        select.update();
        var option;
        for (var i = 0; i < groups.length; i++) {
            option = new Option(groups[i]['name'], groups[i]['id']);
            if (groups[i]['sharing']=='true')
                option.disabled = 'disabled';
            try {
                select.add(option, null);
            } catch (e) {
                select.add(option); // IE < 8
            }
        }

        // TODO Remove this workaround
        // Show the row where the groups select is
        this.fields['groups'].inputInterface.inputElement.parentNode.parentNode.style.display = 'table-row';

        this.calculatePosition();
    }

    var url = URIs.GET_SHARE_GROUPS.evaluate({'workspace_id': OpManagerFactory.getInstance().activeWorkSpace.workSpaceState.id});
    Wirecloud.io.makeRequest(url, {
        method: 'GET',
        onSuccess: onSuccess.bind(this),
        onFailure: onError.bind(this)
    });
}

ShareWindowMenu.prototype.hideGroups = function() {
    // TODO Remove this workaround
    // Hide the row where the groups select is
    this.fields['groups'].inputInterface.inputElement.parentNode.parentNode.style.display = 'none';
    this.calculatePosition();
}

ShareWindowMenu.prototype.setFocus = function() {
    this.fields['public_sharing'].inputInterface.focus();
}

ShareWindowMenu.prototype.extraValidation = function(form) {
    if (this.fields['group_sharing'].inputInterface.getValue() && this.fields['groups'].inputInterface.inputElement.selectedIndex == -1){
        return gettext('You must select a group');
    }
    return null
}

ShareWindowMenu.prototype.executeOperation = function(form) {
    var groups = this.fields['groups'].inputInterface.getValue();
    OpManagerFactory.getInstance().activeWorkSpace.shareWorkspace(true, groups);
}

ShareWindowMenu.prototype.show = function(parentWindow) {
    FormWindowMenu.prototype.show.call(this, parentWindow);
    // TODO remove this workaround
    this.hideGroups();
}

/**
 * Specific class for Sharing workspace results window!
 */
 //TODO: change this class to work as the rest of windows
function SharedWorkSpaceMenu() {
    WindowMenu.call(this, gettext('Shared WorkSpace Info'));

    // Extra HTML Elements
    this.iconElement.className += ' icon-info';

    // Extra HTML Elements (url and html_code)
    // Table
    this.addElement('mainTable', 'table', 'windowContent');

    //IE6 and IE7 need a tbody for dynamic tables
    this.addElement('tableElement', 'tbody', 'mainTable');

    // TR1
    this.addElement('tr1Element', 'tr', 'tableElement');
    this.tr1Element.style.display = 'none';

    // TD11
    this.addElement('td11Element', 'td', 'tr1Element');

    // LABEL1
    this.addElement('label1', 'label', 'td11Element');
    this.label1.innerHTML = gettext('URL:');

    // TD12
    this.addElement('td12Element', 'td', 'tr1Element');

    // URL
    this.addElement('urlElement', 'input', 'td12Element');

    // TR2
    this.addElement('tr2Element', 'tr', 'tableElement');
    this.tr2Element.style.display = 'none';

    // TD21
    this.addElement('td21Element', 'td', 'tr2Element');

    // LABEL2
    this.addElement('label2', 'label', 'td21Element');
    this.label2.innerHTML = gettext('HTML code:');

    // TD12
    this.addElement('td22Element', 'td', 'tr2Element');

    // HTML
    this.addElement('html_codeElement', 'textarea', 'td22Element');
    this.html_codeElement.setAttribute('cols', 30);
    this.html_codeElement.setAttribute('rows', 3);
}
SharedWorkSpaceMenu.prototype = new WindowMenu();

SharedWorkSpaceMenu.prototype.addElement = function(element_name, html_tag, father_name) {
    this[element_name] = document.createElement(html_tag);
    Element.extend(this[element_name]);
    this[father_name].appendChild(this[element_name]);
}

SharedWorkSpaceMenu.prototype.setURL = function(url) {
    this.urlElement.value = url;
    this.tr1Element.style.display='table-row';
}

SharedWorkSpaceMenu.prototype.setHTML = function(url) {
    var html_code = '<object width="" height="" data="' + url + '"></object>';

    this.html_codeElement.value = html_code;
    this.tr2Element.style.display='table-row';
}

SharedWorkSpaceMenu.prototype.hide = function(url) {
    this.urlElement.value = "";
    this.html_codeElement.value = "";
    this.tr1Element.style.display='none';
    this.tr2Element.style.display='none';
    WindowMenu.prototype.hide.call(this);
}

/**
 * Specific class for platform preferences windows.
 *
 * @param manager
 *
 * @author jmostazo-upm
 */
function PreferencesWindowMenu(scope, manager) {
    WindowMenu.call(this, '');

    this.manager = manager;
    var table = manager.getPreferencesDef().getInterface();
    this.windowContent.insertBefore(table, this.msgElement);

    // Accept button
    this.acceptButton = document.createElement('button');

    Element.extend(this.acceptButton);
    this.acceptButton.appendChild(document.createTextNode(gettext('Save')));
    this._executeOperation = this._executeOperation.bind(this);
    this.acceptButton.observe("click", this._executeOperation);
    this.windowBottom.appendChild(this.acceptButton);

    // Cancel button
    this.cancelButton = document.createElement('button');

    Element.extend(this.cancelButton);
    this.cancelButton.appendChild(document.createTextNode(gettext('Cancel')));
    this.cancelButton.observe("click", this._closeListener);
    this.windowBottom.appendChild(this.cancelButton);
}
PreferencesWindowMenu.prototype = new WindowMenu();

PreferencesWindowMenu.prototype.setCancelable = function(cancelable) {
    this.closeButton.setDisabled(!cancelable);
    if (cancelable === true) {
        this.cancelButton.style.display = '';
    } else {
        this.cancelButton.style.display = 'none';
    }
};

PreferencesWindowMenu.prototype._executeOperation = function() {
    // Validate input fields
    var validationManager = new ValidationErrorManager();
    for (var fieldId in this.fields)
        validationManager.validate(this.fields[fieldId].inputInterface);

    // Build Error Message
    var errorMsg = validationManager.toHTML();

    // Show error message if needed
    if (errorMsg != "") {
        this.setMsg(errorMsg);
    } else {
        this.manager.save();
        this.hide();
    }
}

PreferencesWindowMenu.prototype.show = function (parentWindow) {
    this.setTitle(this.manager.buildTitle());
    this.manager.resetInterface('platform');
    WindowMenu.prototype.show.call(this, parentWindow);
}

/**
 * Specific class for uploading files.
 *
 * @param scope
 *
 */
function UploadWindowMenu (title, targetElement) {
    WindowMenu.call(this, gettext(title));

    this.targetElement = null;
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('id', 'uploader_frame');
    this.iframe.setAttribute('src', URIs.FILE_UPLOADER);
    this.iframe.setAttribute('width', "100%");
    this.iframe.setAttribute("frameBorder", "0");

    var iframeDiv = document.createElement('div');
    Element.extend(iframeDiv);
    iframeDiv.addClassName('iframeDiv');
    this.windowContent.appendChild(iframeDiv)

    iframeDiv.appendChild(this.iframe);

    var warning = document.createElement('div');
    Element.extend(warning);
    warning.addClassName('msg warning');
    warning.update(gettext("WARNING: Your file will be uploaded to a shared space. <br /> Wirecloud is not responsible for the content of the uploaded files."));
    this.windowContent.appendChild(warning);
}

UploadWindowMenu.prototype = new WindowMenu();

UploadWindowMenu.prototype.show = function(parentWindow, targetElement) {
    //reload the iframe for IE
    this.iframe.setAttribute('src', URIs.FILE_UPLOADER);
    this.targetElement = targetElement;

    WindowMenu.prototype.show.call(this, parentWindow);
}

UploadWindowMenu.prototype._closeListener = function(){

    //Take the value of the URL if it succeed and set that value to the targetElement
    try {
        if (this.iframe.contentDocument) {
            var urlElement = this.iframe.contentDocument.getElementById('url');
        }
        else { //IE
            var urlElement = this.iframe.contentWindow.document.getElementById('url')
        }

        if (urlElement) {
            this.targetElement.value = urlElement.innerHTML;
        }
    }
    catch (err) {
    //do nothing
    }
    finally {
        //hide the window
        this.hide();
    }

}

function ParametrizeWindowMenu(inputInterface) {
    var fields, sourceOptions, statusOptions;

    statusOptions = [
        {label: gettext('Normal'), value: 'normal'},
        {label: gettext('Read Only'), value: 'readonly'}
    ];

    if (inputInterface.canBeHidden) {
        statusOptions.push({label: gettext('Hidden'), value: 'hidden'});
    }

    sourceOptions = [
        {label: gettext('Current value'), value: 'current'},
        {label: gettext('Default value'), value: 'default'},
        {label: gettext('Parametrized value'), value: 'custom'}
    ];

    fields = {
        'status': {label: gettext('Status'), type: 'select', initialEntries: statusOptions, required: true},
        'source': {label: gettext('Value source'), type: 'select', initialEntries: sourceOptions, required: true},
        'separator': {type: 'separator'},
        'value': {label: gettext('Value'), type: 'parametrizedText', variable: inputInterface.variable}
    }
    FormWindowMenu.call(this, fields, gettext('Parametrization'), 'variable_parametrization');

    this.inputInterface = inputInterface;

    // TODO
    var valueInput = this.form.fieldInterfaces['value'];
    var sourceInput = this.form.fieldInterfaces['source'].inputElement;
    var updateFunc = function() {
        this.valueInput.setDisabled(this.sourceInput.getValue() !== 'custom');
    }.bind({valueInput: valueInput, sourceInput: sourceInput});
    valueInput.update = updateFunc;
    Event.observe(sourceInput.inputElement, 'change', updateFunc);
}
ParametrizeWindowMenu.prototype = new FormWindowMenu();

ParametrizeWindowMenu.prototype.executeOperation = function(newValue) {
    this.inputInterface.setValue(newValue);
};
