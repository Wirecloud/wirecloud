/*jshint globalstrict:true */
/*global MashupPlatform*/

"use strict";

var OK_HTML = '<b>Success!!</b>';

MashupPlatform.http.makeRequest('http://localhost:8001/api-test/data/success.html', {
    method: 'GET',
    onSuccess: function (transport) {
        document.getElementById('makerequest_test').innerHTML = transport.responseText;
    }
});

MashupPlatform.wiring.registerCallback('inputendpoint', function (data) {
    document.getElementById('registercallback_test').innerHTML = data;
});
MashupPlatform.wiring.pushEvent('outputendpoint', 'Success!!');

MashupPlatform.pref.registerCallback(function (new_values) {
    document.getElementById('pref_registercallback_test').innerHTML = new_values.text;
});

setTimeout(function () {
    if (MashupPlatform.pref.get('text') === 'initial text') {
        document.getElementById('pref_get_test').innerHTML = OK_HTML;
        MashupPlatform.pref.set('text', 'success!!');
        if (MashupPlatform.pref.get('text') === 'success!!') {
            document.getElementById('pref_set_test').innerHTML = OK_HTML;
            MashupPlatform.pref.set('text', 'initial text');
        }
    }
}, 0);
