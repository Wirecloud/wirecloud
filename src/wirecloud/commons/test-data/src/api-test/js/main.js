/*jshint globalstrict:true */
/*global MashupPlatform*/

"use strict";

var OK_HTML = '<b>Success!!</b>';
var FAILURE_HTML = '<b>Failure!!</b>';
var INVALID_CALLBACK_VALUES = [null, undefined, 1, true, "test", [], {}];
var CONTEXT_ENVIRONMENTS = [MashupPlatform.context, MashupPlatform.widget.context, MashupPlatform.mashup.context];

MashupPlatform.http.makeRequest('data/success.html', {
    method: 'GET',
    onSuccess: function (transport) {
        if (transport.responseText === 'local makerequest succeded') {
            document.getElementById('makerequest_local_test').innerHTML = OK_HTML;
        }
    }
});

MashupPlatform.http.makeRequest('http://example.com/success.html', {
    method: 'GET',
    onSuccess: function (response) {
        if (response.status === 200 && response.responseText === 'remote makerequest was successful') {
            document.getElementById('makerequest_test').innerHTML = OK_HTML;
        }
    }
});

MashupPlatform.wiring.registerCallback('inputendpoint', function (data) {
    document.getElementById('registercallback_test').innerHTML = data;
});
MashupPlatform.wiring.pushEvent('outputendpoint', 'Success!!');

MashupPlatform.prefs.registerCallback(function (new_values) {
    if (Object.keys(new_values).length == 1 && 'text' in new_values) {
        document.getElementById('pref_registercallback_test').innerHTML = new_values.text;
    } else {
        document.getElementById('pref_registercallback_test').innerHTML = FAILURE_HTML;
    }
});

setTimeout(function () {

    document.getElementById('check_logs_button').onclick = function () {
        MashupPlatform.widget.log('error message');
        MashupPlatform.widget.log('error message2', MashupPlatform.log.ERROR);
        MashupPlatform.widget.log('warn message', MashupPlatform.log.WARN);
        MashupPlatform.widget.log('info message', MashupPlatform.log.INFO);
        document.getElementById('widget_log_test').innerHTML = OK_HTML;
    };

    document.getElementById('check_context_exceptions_button').onclick = function () {
        var success_count = 0;

        for (var i = 0; i < CONTEXT_ENVIRONMENTS.length; i++) {
            var context_environment = CONTEXT_ENVIRONMENTS[i];
            for (var j = 0; j < INVALID_CALLBACK_VALUES.length; j++) {
                try {
                    context_environment.registerCallback(INVALID_CALLBACK_VALUES[j]);
                } catch (error) {
                    if (error instanceof TypeError) {
                        success_count += 1;
                    }
                }
            }
        }

        if (success_count === (CONTEXT_ENVIRONMENTS.length * INVALID_CALLBACK_VALUES.length)) {
            document.getElementById('context_exceptions_test').innerHTML = OK_HTML;
        }
    };

    document.getElementById('check_preference_exceptions_button').onclick = function () {
        var success_count = 0;
        try {
            MashupPlatform.prefs.get('nonexistent');
        } catch (error) {
            if (error instanceof MashupPlatform.prefs.PreferenceDoesNotExistError) {
                success_count += 1;
            }
        }

        try {
            MashupPlatform.prefs.set('nonexistent');
        } catch (error) {
            if (error instanceof MashupPlatform.prefs.PreferenceDoesNotExistError) {
                success_count += 1;
            }
        }

        for (var i = 0; i < INVALID_CALLBACK_VALUES.length; i++) {
            try {
                MashupPlatform.prefs.registerCallback(INVALID_CALLBACK_VALUES[i]);
            } catch (error) {
                if (error instanceof TypeError) {
                    success_count += 1;
                }
            }
        }

        if (success_count === (2 + INVALID_CALLBACK_VALUES.length)) {
            document.getElementById('preference_exceptions_test').innerHTML = OK_HTML;
        }
    };

    document.getElementById('check_endpoint_exceptions_button').onclick = function () {
        var success_count = 0;
        try {
            MashupPlatform.wiring.pushEvent('nonexistent', '');
        } catch (error) {
            if (error instanceof MashupPlatform.wiring.EndpointDoesNotExistError) {
                success_count += 1;
            }
        }

        try {
            MashupPlatform.wiring.getReachableEndpoints('nonexistent');
        } catch (error) {
            if (error instanceof MashupPlatform.wiring.EndpointDoesNotExistError) {
                success_count += 1;
            }
        }

        try {
            MashupPlatform.wiring.registerCallback('nonexistent', function () {});
        } catch (error) {
            if (error instanceof MashupPlatform.wiring.EndpointDoesNotExistError) {
                success_count += 1;
            }
        }

        for (var i = 0; i < INVALID_CALLBACK_VALUES.length; i++) {
            try {
                MashupPlatform.wiring.registerCallback('inputendpoint', INVALID_CALLBACK_VALUES[i]);
            } catch (error) {
                if (error instanceof TypeError) {
                    success_count += 1;
                }
            }
        }

        if (success_count === (3 + INVALID_CALLBACK_VALUES.length)) {
            document.getElementById('endpoint_exceptions_test').innerHTML = OK_HTML;
        }
    };

    document.getElementById('check_general_exceptions_button').onclick = function () {
        throw new Error('General exception test');
    };

    var input = document.getElementById('update_prop_input');
    var variable = MashupPlatform.widget.getVariable('prop');
    input.value = variable.get();
    document.getElementById('update_prop_button').addEventListener('click', function () {
        variable.set(input.value);
    });

    if (MashupPlatform.prefs.get('text') === 'initial text') {
        document.getElementById('pref_get_test').innerHTML = OK_HTML;
        MashupPlatform.prefs.set('text', 'success!!');
        if (MashupPlatform.prefs.get('text') === 'success!!') {
            document.getElementById('pref_set_test').innerHTML = OK_HTML;
            MashupPlatform.prefs.set('text', 'initial text');
        }
    }
}, 0);
