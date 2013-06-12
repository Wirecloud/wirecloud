/*jshint globalstrict:true */
/*global MashupPlatform*/

"use strict";

var OK_HTML = '<b>Success!!</b>';

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
    onSuccess: function (transport) {
        if (transport.responseText === 'remote makerequest succeded') {
            document.getElementById('makerequest_test').innerHTML = OK_HTML;
        }
    }
});

MashupPlatform.wiring.registerCallback('inputendpoint', function (data) {
    document.getElementById('registercallback_test').innerHTML = data;
});
MashupPlatform.wiring.pushEvent('outputendpoint', 'Success!!');

MashupPlatform.prefs.registerCallback(function (new_values) {
    document.getElementById('pref_registercallback_test').innerHTML = new_values.text;
});

setTimeout(function () {
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
