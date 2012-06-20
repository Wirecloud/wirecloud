/*jshint globalstrict:true */
/*global MashupPlatform*/

"use strict";

MashupPlatform.http.makeRequest('http://localhost:8001/api-test/data/success.html', {
    method: 'GET',
    onSuccess: function (transport) {
        document.body.innerHTML = transport.responseText;
    }
});
