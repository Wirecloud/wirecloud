/*jshint globalstrict:true */
/*global MashupPlatform*/

"use strict";

var OK_HTML = '<b>Success!!</b>';
var FAILURE_HTML = '<b>Failure!!</b>';

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

    document.getElementById('check_preference_exceptions_button').onclick = function () {
        var success_count = 0;
        try {
            MashupPlatform.prefs.get('nonexistent');
        } catch (error) {
            if (error instanceof MashupPlatform.prefs.PreferenceError) {
                success_count += 1;
            }
        }

        try {
            MashupPlatform.prefs.set('nonexistent');
        } catch (error) {
            if (error instanceof MashupPlatform.prefs.PreferenceError) {
                success_count += 1;
            }
        }

        if (success_count === 2) {
            document.getElementById('preference_exceptions_test').innerHTML = OK_HTML;
        }
    };

    document.getElementById('check_endpoint_exceptions_button').onclick = function () {
        var success_count = 0;
        try {
            MashupPlatform.wiring.pushEvent('nonexistent', '');
        } catch (error) {
            if (error instanceof MashupPlatform.wiring.EndpointError) {
                success_count += 1;
            }
        }

        try {
            MashupPlatform.wiring.getReachableEndpoints('nonexistent');
        } catch (error) {
            if (error instanceof MashupPlatform.wiring.EndpointError) {
                success_count += 1;
            }
        }

        try {
            MashupPlatform.wiring.registerCallback('nonexistent', function () {});
        } catch (error) {
            if (error instanceof MashupPlatform.wiring.EndpointError) {
                success_count += 1;
            }
        }

        if (success_count === 3) {
            document.getElementById('endpoint_exceptions_test').innerHTML = OK_HTML;
        }
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
