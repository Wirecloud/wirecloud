/*jshint globalstrict:true */
/*global MashupPlatform*/

(function () {

    "use strict";

    var objectstorage_available = false;
    var api;
    var token;
    var integration_test_account = {
        PROJECT: "WIRECLOUD",
        USER: "wirecloud",
        PASS: "welcome19",
        TENANT_ID: "86ca53b6d21b4cfe98a4e0c49e2931af",
        TOKEN_REQUEST_URL: "http://130.206.80.100:5000/v2.0/tokens"
    };

    if (typeof ObjectStorageAPI !== 'undefined') {
        try {
            api = new ObjectStorageAPI('http://130.206.80.102:8080/v1/AUTH_' + integration_test_account.TENANT_ID + '/');

            objectstorage_available = true;
        } catch (err) {}
    }

    setTimeout(function () {
        if (objectstorage_available) {
            document.getElementById('api_available').textContent = 'Yes';
        } else {
            document.getElementById('api_available').textContent = 'No';
        }

        api.getAuthToken(integration_test_account, {
            onSuccess: function (new_token) {
                token = new_token;
                document.getElementById('api_token').textContent = token;
            }
        });
    }, 0);

})();
