/*jshint globalstrict:true */
/*global MashupPlatform*/

"use strict";

MashupPlatform.http.makeRequest('http://localhost:8001/api-test/data/success.html', {
    method: 'GET',
    onSuccess: function (transport) {
        document.getElementById('makerequest_test').innerHTML = transport.responseText;
    }
});

MashupPlatform.wiring.registerCallback('slot', function (data) {
    document.getElementById('registercallback_test').innerHTML = data;
});
MashupPlatform.wiring.pushEvent('event', 'Success!!');
