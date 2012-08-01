/////////////////////////////////////////////
///////// Class ClienteCorreo ///////////////
/////////////////////////////////////////////

// Overwrite
var ClienteCorreo_afterInit = ClienteCorreo.prototype.afterInit;

ClienteCorreo.prototype.afterInit = function() {
    this._modifyConfigInterface(false);
    ClienteCorreo_afterInit.call(this);
    this.setAdvancedConfig(AccountsManager.getAdvancedConfig());
}

// New
ClienteCorreo.prototype._modifyConfigInterface = function(advanced) {
    var header = EzWebExt.getElementsByClassName(EzWebExt.getElementsByClassName(this.configAlternative.wrapperElement, "headerrow")[0], "row")[0];

    var title = EzWebExt.getElementsByClassName(header, "alternative_title")[0];
    
    var div = document.createElement("div");
    EzWebExt.addClassName(div, "checkbox");
    header.appendChild(div);
    
    var span = document.createElement("span");
    span.innerHTML = _("Advanced");
    div.appendChild(span);
    
    this.advancedConfigCheckbox = document.createElement("input");
    this.advancedConfigCheckbox.type = "checkbox";
    this.advancedConfigCheckbox.checked = advanced;
    
    var context = {
        self: this,
        title: title,
        checkbox: this.advancedConfigCheckbox,
        span: span
    };
    this._renameConfiglabels(advanced, context);
    
    EzWebExt.addEventListener(this.advancedConfigCheckbox, "click", EzWebExt.bind(function(e) {
        var advanced = this.checkbox.checked;
        this.self._renameConfiglabels(advanced, this);
        AccountsManager.shareInfoBetweenForms(advanced);
        this.self.setAdvancedConfig(advanced);
    }, context), true);
    div.appendChild(this.advancedConfigCheckbox);
    
    var body = EzWebExt.getElementsByClassName(this.configAlternative.wrapperElement, "tablebody")[0];
    
    this.advancedConfigDiv = EzWebExt.getElementsByClassName(body, "hpaned")[0];
    
    this.defaultConfigDiv = document.createElement("div");
    EzWebExt.addClassName(this.defaultConfigDiv, "config_content");
    body.appendChild(this.defaultConfigDiv);
    
    var default_name_text = new StyledElements.StyledTextField();
    var default_account_text = new StyledElements.StyledTextField();
	var default_username_text = new StyledElements.StyledTextField();
	var default_password_text = new StyledElements.StyledPasswordField();

    this.form_default_config = {};
    this.form_default_config["name"] = default_name_text;
	this.form_default_config["account"] = default_account_text;
	this.form_default_config["username"] = default_username_text;
	this.form_default_config["password"] = default_password_text;

	var row = document.createElement("div");
	EzWebExt.addClassName(row, "row");
	EzWebExt.addClassName(row, "config");
	EzWebExt.addClassName(row, "config_title");
	row.appendChild(document.createTextNode(_("Account default settings")));
	this.defaultConfigDiv.appendChild(row);

    row = document.createElement("div");
	EzWebExt.addClassName(row, "row");
	EzWebExt.addClassName(row, "config");
	EzWebExt.addClassName(row, "big");
	row.appendChild(this._createCell(document.createTextNode(_("Name") + ":"), "title"));
	row.appendChild(this._createCell(default_name_text, "value"));
	this.defaultConfigDiv.appendChild(row);

    row = document.createElement("div");
	EzWebExt.addClassName(row, "row");
	EzWebExt.addClassName(row, "config");
	EzWebExt.addClassName(row, "big");
	row.appendChild(this._createCell(document.createTextNode(_("Account") + ":"), "title"));
	row.appendChild(this._createCell(default_account_text, "value"));
	this.defaultConfigDiv.appendChild(row);
	
	row = document.createElement("div");
	EzWebExt.addClassName(row, "row");
	EzWebExt.addClassName(row, "config");
	row.appendChild(this._createCell(document.createTextNode(_("Username") + ":"), "title"));
	row.appendChild(this._createCell(default_username_text, "value"));
	this.defaultConfigDiv.appendChild(row);
	
	row = document.createElement("div");
	EzWebExt.addClassName(row, "row");
	EzWebExt.addClassName(row, "config");
	row.appendChild(this._createCell(document.createTextNode(_("Password") + ":"), "title"));
	row.appendChild(this._createCell(default_password_text, "value"));
	this.defaultConfigDiv.appendChild(row);
}

// New
ClienteCorreo.prototype._renameConfiglabels = function(advanced, elements) {
    if (advanced) {
        elements.title.innerHTML = _("ADVANCED SETTINGS");
        elements.checkbox.title = _("Disable advanced settings");
    }
    else {
        elements.title.innerHTML = _("DEFAULT SETTINGS");
        elements.checkbox.title = _("Enable advanced settings");
    }
}

// New
ClienteCorreo.prototype.setAdvancedConfig = function(advanced) {
    if (!advanced) {
        this.advancedConfigDiv.style.display = "none";
        this.defaultConfigDiv.style.display = "block";
    }
    else {
        this.defaultConfigDiv.style.display = "none";    
        this.advancedConfigDiv.style.display = "block";
        this.config_hpaned.repaint();
    }
}

/////////////////////////////////////////////////////
/////// Class AccountsManagerSpecific ///////////////
/////////////////////////////////////////////////////

var AccountsManagerSpecific = function() {
	/* Call to the parent constructor */
	AccountsManagerBasic.call(this);
	
	this.defaultInAccount = null;
	this.defaultOutAccount = null;
	this.advancedConfig = false;
	this.defaultSettings = defaultAccountSettings;
}

AccountsManagerSpecific.prototype = new AccountsManagerBasic(); /* Extend from AccountsManagerBasic */

// Overwrite
AccountsManagerSpecific.prototype.getInAccount = function() {
    if (this.advancedConfig) {
        return AccountsManagerBasic.prototype.getInAccount.call(this);
    }
    else {
        return this.defaultInAccount;
    }
}

// Overwrite
AccountsManagerSpecific.prototype.getOutAccount = function() {
    if (this.advancedConfig) {
        return AccountsManagerBasic.prototype.getOutAccount.call(this);
    }
    else {
        return this.defaultOutAccount;
    }
}

// New
AccountsManagerSpecific.prototype.getAdvancedConfig = function() {
    return this.advancedConfig;
}

// New
AccountsManagerSpecific.prototype.setDefaultInAccount = function(config) {
	this.defaultInAccount = new Account(config);
}

// New
AccountsManagerSpecific.prototype.setDefaultOutAccount = function(config) {
	this.defaultOutAccount = new Account(config);
}

// Overwrite
AccountsManagerSpecific.prototype.isConfigured = function() {
    if (this.advancedConfig) {
        return AccountsManagerBasic.prototype.isConfigured.call(this);
	}
	else {
	    return (this.defaultInAccount != null) && (this.defaultOutAccount != null);
	}
}

// Overwrite
AccountsManagerSpecific.prototype.toJSON = function() {
    return Utils.toJSON({
		inAccount: this.inAccount, 
		outAccount: this.outAccount,
		defaultInAccount: this.defaultInAccount, 
		defaultOutAccount: this.defaultOutAccount,
		advancedConfig: this.advancedConfig
	});
}

// Overwrite
AccountsManagerSpecific.prototype.restore = function() {
    AccountsManagerBasic.prototype.restore.call(this);
    try {
        var accounts = eval("(" + ClienteCorreo.accountsProp.get() + ")");
        if (accounts) { 
            if (("defaultInAccount" in accounts) && (accounts.defaultInAccount != null)) {
                this.setDefaultInAccount(accounts.defaultInAccount);
            }
            if (("defaultOutAccount" in accounts) && (accounts.defaultOutAccount != null)) {
                this.setDefaultOutAccount(accounts.defaultOutAccount);
            }
            if ("advancedConfig" in accounts) {
                this.advancedConfig = accounts.advancedConfig;
            }
        }
    }
    catch(e){}
}

// Overwrite
AccountsManagerSpecific.prototype.saveForm = function() {
    this.advancedConfig = ClienteCorreo.advancedConfigCheckbox.checked;
    if (this.advancedConfig) {
        return AccountsManagerBasic.prototype.saveForm.call(this);
    }
    else {
        if (!this.validateDefaultForm()) {
            return false;
        }
	    this.setDefaultInAccount({
		    "name":       "",
		    "account":    ClienteCorreo.form_default_config["account"].getValue(),
		    "protocol":   this.defaultSettings["in"]["protocol"],
		    "connection": this.defaultSettings["in"]["connection"],
		    "host":       this.defaultSettings["in"]["host"],
		    "port":       this.defaultSettings["in"]["port"],
		    "username":   ClienteCorreo.form_default_config["username"].getValue(),
		    "password":   ClienteCorreo.form_default_config["password"].getValue()
	    });
	    this.setDefaultOutAccount({
		    "name":       ClienteCorreo.form_default_config["name"].getValue(),
		    "account":    ClienteCorreo.form_default_config["account"].getValue(),
		    "protocol":   this.defaultSettings["out"]["protocol"],
		    "connection": this.defaultSettings["out"]["connection"],
		    "host":       this.defaultSettings["out"]["host"],
		    "port":       this.defaultSettings["out"]["port"],
		    "username":   ClienteCorreo.form_default_config["username"].getValue(),
		    "password":   ClienteCorreo.form_default_config["password"].getValue()
	    });
	    this.save();
	    return true;
	}
}

// New
AccountsManagerSpecific.prototype.validateDefaultForm = function() {
    for (var k in ClienteCorreo.form_default_config) {
        if (ClienteCorreo.form_default_config[k] == "") {
            return false;
        }
    }
    return true;
}

// Overwrite
AccountsManagerSpecific.prototype.resetForm = function() {
    AccountsManagerBasic.prototype.resetForm.call(this);
    
    if (ClienteCorreo.advancedConfigCheckbox) {
	    ClienteCorreo.advancedConfigCheckbox.checked = this.advancedConfig;
	    ClienteCorreo.setAdvancedConfig(this.advancedConfig);
	}
    
    if (ClienteCorreo.form_default_config) {
        if (this.defaultInAccount && this.defaultOutAccount) {
		    ClienteCorreo.form_default_config["account"].setValue(this.defaultInAccount["account"]);
		    ClienteCorreo.form_default_config["username"].setValue(this.defaultInAccount["username"]);
		    ClienteCorreo.form_default_config["password"].setValue(this.defaultInAccount["password"]);
		    ClienteCorreo.form_default_config["name"].setValue(this.defaultOutAccount["name"]);
	    }
	    else {
		    if (ClienteCorreo.form_default_config["account"]) ClienteCorreo.form_default_config["account"].reset();
		    if (ClienteCorreo.form_default_config["name"]) ClienteCorreo.form_default_config["name"].reset();
		    if (ClienteCorreo.form_default_config["username"]) ClienteCorreo.form_default_config["username"].reset();
		    if (ClienteCorreo.form_default_config["password"]) ClienteCorreo.form_default_config["password"].reset();
	    }
	}	
}

// New
AccountsManagerSpecific.prototype.shareInfoBetweenForms = function(advanced) {
    if (advanced) {
        var name = ClienteCorreo.form_default_config["name"].getValue();
        if (name != "") {
            ClienteCorreo.form_out_config["name"].setValue(name);
        }
        
        var account = ClienteCorreo.form_default_config["account"].getValue();
        if (account != "") {
            ClienteCorreo.form_in_config["account"].setValue(account);
            ClienteCorreo.form_out_config["account"].setValue(account);
        }
        
        var username = ClienteCorreo.form_default_config["username"].getValue();
        if (username != "") {
            ClienteCorreo.form_in_config["username"].setValue(username);
            ClienteCorreo.form_out_config["username"].setValue(username);
        }
        
        var password = ClienteCorreo.form_default_config["password"].getValue();
        if (password != "") {
            ClienteCorreo.form_in_config["password"].setValue(password);
            ClienteCorreo.form_out_config["password"].setValue(password);
        }
        
        ClienteCorreo.form_in_config["protocol"].setValue(this.defaultSettings["in"]["protocol"]);
        ClienteCorreo.form_out_config["protocol"].setValue(this.defaultSettings["out"]["protocol"]);
        
        ClienteCorreo.form_in_config["connection"].setValue(this.defaultSettings["in"]["connection"]);
        ClienteCorreo.form_out_config["connection"].setValue(this.defaultSettings["out"]["connection"]);
        
        ClienteCorreo.form_in_config["host"].setValue(this.defaultSettings["in"]["host"]);
        ClienteCorreo.form_out_config["host"].setValue(this.defaultSettings["out"]["host"]);
        
        ClienteCorreo.form_in_config["port"].setValue(this.defaultSettings["in"]["port"]);
        ClienteCorreo.form_out_config["port"].setValue(this.defaultSettings["out"]["port"]);

    }
    else {
        var name = ClienteCorreo.form_out_config["name"].getValue();
        if (name != "") {
            ClienteCorreo.form_default_config["name"].setValue(name);
        }
        
        var account = ClienteCorreo.form_in_config["account"].getValue();
        if (account != "") {
            ClienteCorreo.form_default_config["account"].setValue(account);
        }
        
        var username = ClienteCorreo.form_in_config["username"].getValue();
        if (username != "") {
            ClienteCorreo.form_default_config["username"].setValue(username);
        }
        
        var password = ClienteCorreo.form_in_config["password"].getValue();
        if (password != "") {
            ClienteCorreo.form_default_config["password"].setValue(password);
        }
    }
}

/******************** INIT **************************/

/* Instanciate Classes */
ClienteCorreo = new ClienteCorreo();
var AccountsManager = new AccountsManagerSpecific();
SlotManager = new SlotManager();

/* Init Tiny MCE */
tinyMCE_config["content_css"] = ClienteCorreo.getResourceURL("css/tinymce_content.css");
tinyMCE.init(tinyMCE_config);
