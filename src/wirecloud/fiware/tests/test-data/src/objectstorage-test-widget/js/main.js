/*jshint globalstrict:true */
/*global MashupPlatform*/

(function () {

    "use strict";

    var objectstorage_available = false;
    var api;
    var integration_test_account = {
        PROJECT: "WIRECLOUD",
        USER: "wirecloud",
        PASS: "welcome19",
        TENANT_ID: "86ca53b6d21b4cfe98a4e0c49e2931af",
        TOKEN_REQUEST_URL: "http://130.206.80.100:5000/v2.0/tokens"
    };
    var token, msg, button;

    if (typeof ObjectStorageAPI !== 'undefined') {
        try {
            api = new ObjectStorageAPI('http://130.206.80.102:8080/v1/AUTH_' + integration_test_account.TENANT_ID + '/');

            objectstorage_available = true;
        } catch (err) {}
    }

    var onGetAuthTokenSuccess = function onGetAuthTokenSuccess(new_token) {
        token = new_token;
        document.getElementById('api_token').textContent = token;

        api.listContainer('integrationTests', token, {
            onSuccess: onListContainterSuccess,
            onFailure: function () {
                document.getElementById('file_count').textContent = 'Fail';
            }
        })
    };

    var onListContainterSuccess = function onListContainterSuccess(file_list) {
        var i, found;

        var base_file_name = 'test';
        var ext = '.txt';
        var file_name = 'test1.txt';

        document.getElementById('file_count').textContent = file_list.length;
        do {
            found = false;
            for (i = 0; i < file_list.length; i+=1) {
                if (file_list[i].name === file_name) {
                    found = true;
                    break;
                }
            }
        } while (found);

        document.getElementById('file_name').textContent = file_name;
        var blob = new Blob(["Hello world!"], { type: "text/plain" });
        api.uploadFile('integrationTests', blob, token, {
            file_name: file_name,
            onSuccess: onUploadFileSuccess.bind(null, file_name),
            onFailure: function () {
                document.getElementById('file_upload').textContent = 'Fail';
            }
        });
    };

    var onUploadFileSuccess = function onUploadFileSuccess(file_name) {
        document.getElementById('file_upload').textContent = 'OK';
        api.deleteFile('integrationTests', file_name, token, {
            onSuccess: onDeleteFileSuccess,
            onFailure: function () {
                document.getElementById('file_deletion').textContent = 'Fail';
            }
        });
    };

    var onDeleteFileSuccess = function onDeleteFileSuccess() {
        document.getElementById('file_deletion').textContent = 'OK';
        document.getElementById('api_token').textContent = token;

        msg = document.createElement('div');
        msg.className = 'alert alert-block alert-success';
        msg.textContent = 'Success!';
        document.body.appendChild(msg);

        msg.scrollIntoView();
        button.enable();
    };

    setTimeout(function () {
        if (objectstorage_available) {
            document.getElementById('api_available').textContent = 'Yes';
        } else {
            document.getElementById('api_available').textContent = 'No';
        }

        button = new StyledElements.StyledButton({
            'text': 'Pass integration tests',
            'class': 'btn-primary'
        });
        button.insertInto(document.body);
        button.addEventListener('click', function () {
            button.disable();

            if (msg != null) {
                msg.parentElement.removeChild(msg);
                msg = null;
            }

            api.getAuthToken(integration_test_account, {
                onSuccess: onGetAuthTokenSuccess,
                onFailure: function () {
                    document.getElementById('api_token').textContent = 'Fail';
                }
            });
        });
    }, 0);

})();
