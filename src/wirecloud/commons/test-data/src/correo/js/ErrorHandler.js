/**
 *
 */
EzWebExt.ErrorHandler = function(gadget, data) {
    this.alerts = {};
    this.gadget = gadget;

    this.data = data ? data : {};
    this.data.logErrorLevels = EzWebExt.merge({
        '404': EzWebAPI.WARN_MSG
    }, this.data.logErrorLevels);
}

EzWebExt.ErrorHandler.prototype._onSuccessCallback = function(transport) {
    var group, alert, exception = false;

    try {
        this.errorHandler._handleSuccess(this, transport);
    } catch (e) {
        exception = true;
        this.errorHandler._onExceptionCallback.call(this, transport, e);
    }

    if (this.onComplete) {
        try {
            this.onComplete(transport);
        } catch (e) {
            exception = true;
            this.errorHandler._onExceptionCallback.call(this, transport, e);
        }
    }

    if (!exception) {
        group = this.errorHandler._getData('group');
        alert = this.errorHandler._getGroupAlert(group, false);
        if (alert) {
            alert.close();
        }
    }
}

EzWebExt.ErrorHandler.prototype._onExceptionCallback = function(transport, e)  {
    var msg, context, fullMsg;

    context = {url: this.url, method: this.method, errorDesc: e.message};

    if (e.lineNumber !== undefined) {
        // Firefox
        context.errorFile = e.fileName;
        context.errorLine = e.lineNumber;
    } else if (e.line !== undefined) {
        // Webkit
        context.errorFile = e.sourceURL;
        context.errorLine = e.line;
    }
    msg = "JavaScript exception processing %(method)s response (%(url)s): %(errorDesc)s";
    msg = EzWebExt.interpolate(msg, context);
    this.errorHandler._alert(msg, EzWebExt.ALERT_ERROR);

    if (context.errorFile) {
        fullMsg = "JavaScript exception on file \"%(errorFile)s\"(line: %(errorLine)s) while processing %(method)s response (%(url)s): %(errorDesc)s";
    } else {
        fullMsg = "JavaScript exception processing %(method)s response (%(url)s): %(errorDesc)s";
    }
    fullMsg = EzWebExt.interpolate(fullMsg, context);
    EzWebAPI.log(fullMsg, EzWebAPI.ERROR_MSG);
};

EzWebExt.ErrorHandler.prototype._createAlert = function () {
    var options, target, alert;

    options = {
        'type': EzWebExt.ALERT_ERROR,
        'closable': this._getData('closable')
    };

    target = this._getData('alertTarget');
    if (target != null) {
        alert = new StyledElements.StyledAlert("Error", "", options);
        alert.insertInto(target);
        return alert;
    } else {
        return this.gadget.alert("Error", "", options);
    }
};

EzWebExt.ErrorHandler.prototype._getGroupAlert = function (group, create, instance) {
    var alert;
    create = create != null ? create : true;

    alert = this.alerts[group];

    if (!alert && create) {
        alert = instance._createAlert();
        this.alerts[group] = alert;
        alert.addEventListener('close', EzWebExt.bind(function () {
            delete this.errorHandler.alerts[this.group];
        }, {errorHandler: this, group: group}));
    }
    return alert;
};

EzWebExt.ErrorHandler.prototype._alert = function(msg) {
    var wrapper, p, group, alert;

    group = this._getData('group');
    if (group) {
        alert = this._getGroupAlert(group, true, this);
    } else {
        alert = this._createAlert();
    }

    wrapper = document.createElement('div');
    wrapper.className = "error_desc";

    p = document.createElement('p');
    p.className = "action_desc";
    EzWebExt.setTextContent(p, this._getData('action'));
    wrapper.appendChild(p);

    p = document.createElement('p');
    p.className = "cause_desc";
    EzWebExt.setTextContent(p, msg);
    wrapper.appendChild(p);

    alert.appendChild(wrapper);

    return alert;
};

EzWebExt.ErrorHandler.prototype._getData = function(key) {
    return this.data[key];
};

EzWebExt.ErrorHandler.prototype._getMergedData = function(key) {
    return this.data[key];
};

EzWebExt.ErrorHandler.prototype._handleSuccess = function(context, transport) {
    if (context['on' + transport.status]) {
        context['on' + transport.status](transport);
    } else if (context.onSuccess) {
        context.onSuccess(transport);
    }
}

EzWebExt.ErrorHandler.prototype._handleFailure = function(context, transport, errorInfo) {
    if (context['on' + transport.status]) {
        context['on' + transport.status](transport, errorInfo);
    } else if (context.onFailure) {
        context.onFailure(transport, errorInfo);
    }
}

EzWebExt.ErrorHandler.prototype._onFailureCallback = function(transport) {
    var ignoreStatusCodes, errorNode, errorInfo, msg, logErrorLevels, logLevel,
        alert, errorInfo;

    ignoreStatusCodes = this.errorHandler._getMergedData('ignoreStatusCodes');
    if (ignoreStatusCodes instanceof Array && ignoreStatusCodes.indexOf(transport.status) !== -1) {
        this.errorHandler._onSuccessCallback.call(this, transport);
        return;
    }

    if (transport.responseXML && transport.responseXML.documentElement != null) {
        errorNode = transport.responseXML.documentElement.getElementsByTagName('Message');
        if (errorNode.length > 0) {
            msg = errorNode[0].textContent;
        }
    } else {
        try {
            errorInfo = JSON.parse(transport.responseText);
            errorNode = errorInfo.error;
            msg = errorNode.message;
        } catch (e) {
        }
    }

    // Provide a fallback message
    if (!msg) {
        msg = EzWebAPI.getHTTPStatusCodeDescription(transport.status);
    }
    msg = EzWebExt.interpolate(this.errorHandler._getData('msgFormat'), {errorDesc: msg});

    alert = this.errorHandler._alert(msg);

    logErrorLevels = this.errorHandler._getMergedData('logErrorLevels');
    logLevel = EzWebAPI.ERROR_MSG;
    if (logErrorLevels && logErrorLevels[transport.status] != null) {
        logLevel = logErrorLevels[transport.status];
    }
    if (logLevel !== EzWebAPI.NO_LOG_MSG) {
        EzWebAPI.log(msg, logLevel);
    }

    errorInfo = {
        msg: msg,
        logLevel: logLevel,
        alert: alert
    };
    try {
        this.errorHandler._handleFailure(this, transport, errorInfo);
    } catch (e) {
        this.errorHandler._onExceptionCallback.call(this, transport, e);
    }

    try {
        if (this.onComplete) {
            this.onComplete(transport);
        }
    } catch (e) {
        this.errorHandler._onExceptionCallback.call(this, transport, e);
    }
};

EzWebExt.ErrorHandler.prototype.subHandler = function(options) {
    return new EzWebExt.SubErrorHandler(this, options);
};

/**
 *
 */
EzWebExt.SubErrorHandler = function(parentHandler, options) {
    this.parentErrorHandler = parentHandler;
    this.data = options;
    this.gadget = parentHandler.gadget;
}
EzWebExt.SubErrorHandler.prototype = new EzWebExt.ErrorHandler();

EzWebExt.SubErrorHandler.prototype._getGroupAlert = function (group, create, instance) {
    return this.parentErrorHandler._getGroupAlert(group, create, instance);
};

EzWebExt.SubErrorHandler.prototype._getData = function(key) {
    if (this.data[key] === undefined) {
        return this.parentErrorHandler._getData(key);
    } else {
        return this.data[key];
    }
}

EzWebExt.ErrorHandler.prototype._getMergedData = function(key) {
    var base = this.parentErrorHandler._getData(key);
    if (base instanceof Array) {
        if (this.data[key] instanceof Array) {
            return base.concat(this.data[key]);
        } else {
            return base;
        }
    } else if (base != null) {
        return EzWebExt.merge(base, this.data[key]);
    } else {
        return this.data[key];
    }
};

/**
 *
 */
EzWebExt.send = function(url, options) {
    var context, index;

    options = EzWebExt.merge({
        'method': 'get',
        'errorHandler': null,
        'context': null
    }, options);

    if (options.errorHandler) {
        context = {
            url: url,
            errorHandler: options.errorHandler,
            method: options.method.toUpperCase()
        };
        
        var handlerRegExp = new RegExp(/^on(?:Complete|Exception|Failure|Success|\d{3})$/);
        for (index in options) {
            if (index.match(handlerRegExp) && options[index]) {
                var handler = options[index];
                if (options.context) {
                    handler = EzWebExt.bind(handler, options.context);
                }
                context[index] = handler;
                delete options[index];
            }
        }

        options.context = null;
        options.onFailure = EzWebExt.bind(options.errorHandler._onFailureCallback, context);
        options.onSuccess = EzWebExt.bind(options.errorHandler._onSuccessCallback, context);
    }
    EzWebAPI.send(url, options.context, options);
};


