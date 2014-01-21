/*jshint globalstrict:true */
/*global MashupPlatform, ObjectStorageAPI, StyledElements*/

(function () {

    "use strict";

    var objectstorage_available = false;
    var keystone, api;
    var token, msg, button;

    if (typeof ObjectStorageAPI !== 'undefined') {
        try {
            keystone = new KeystoneAPI('');
            api = new ObjectStorageAPI('');

            objectstorage_available = true;
        } catch (err) {}

        keystone = null;
        api = null;
    }

    var onGetTenants = function onGetTenants(data) {
        document.getElementById('tenantId').textContent = data.tenants[0].id;

        keystone.getAuthToken({
            tenantId: data.tenants[0].id,
            onSuccess: onGetAuthTokenSuccess,
            onFailure: function () {
                document.getElementById('api_token').textContent = 'Fail';
                fail();
            }
        });
    };

    var onGetAuthTokenSuccess = function onGetAuthTokenSuccess(new_token, data) {
        var i, object_storage;

        token = new_token;
        document.getElementById('api_token').textContent = token;

        for (i = 0; i < data.access.serviceCatalog.length; i++) {
            if (data.access.serviceCatalog[i].type === 'object-store') {
                object_storage = data.access.serviceCatalog[i].endpoints[0].publicURL;
                break;
            }
        }

        api = new ObjectStorageAPI(object_storage);
        api.listContainer('integrationTests', {
            token: token,
            onSuccess: onListContainterSuccess,
            onFailure: function () {
                document.getElementById('file_count').textContent = 'Fail';
                fail();
            }
        });
    };

    var onListContainterSuccess = function onListContainterSuccess(file_list) {
        var i, j, file_name, found = true; /* At least an iteration */

        var base_file_name = 'test';
        var ext = '.txt';

        document.getElementById('file_count').textContent = file_list.length;
        for (i = 1; found; i += 1) {
            file_name = base_file_name + i + ext;
            found = false;
            for (j = 0; j < file_list.length; j += 1) {
                if (file_list[j].name === file_name) {
                    found = true;
                    break;
                }
            }
        };

        document.getElementById('file_name').textContent = file_name;
        var blob = new Blob(["Hello world!"], { type: "text/plain" });
        api.uploadFile('integrationTests', blob, {
            token: token,
            file_name: file_name,
            onSuccess: onUploadFileSuccess.bind(null, file_name),
            onFailure: function () {
                document.getElementById('file_upload').textContent = 'Fail';
                fail();
            }
        });
    };

    var onUploadFileSuccess = function onUploadFileSuccess(file_name) {
        document.getElementById('file_upload').textContent = 'OK';

        api.deleteFile('integrationTests', file_name, {
            token: token,
            onSuccess: onDeleteFileSuccess,
            onFailure: function () {
                document.getElementById('file_deletion').textContent = 'Fail';
                fail();
            }
        });
    };

    var onDeleteFileSuccess = function onDeleteFileSuccess() {
        document.getElementById('file_deletion').textContent = 'OK';

        msg = document.createElement('div');
        msg.className = 'alert alert-block alert-success';
        msg.textContent = 'Success!';
        document.body.appendChild(msg);

        msg.scrollIntoView();
        button.enable();
        keystone = null;
        api = null;
    };

    var fail = function fail() {
        msg = document.createElement('div');
        msg.className = 'alert alert-block alert-error';
        msg.textContent = 'Failure!';
        document.body.appendChild(msg);

        keystone = null;
        api = null;

        msg.scrollIntoView();
        button.enable();
    };

    setTimeout(function () {
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
            document.getElementById('tenantId').textContent = '';
            document.getElementById('api_token').textContent = '';
            document.getElementById('file_count').textContent = '';
            document.getElementById('file_name').textContent = '';
            document.getElementById('file_upload').textContent = '';
            document.getElementById('file_deletion').textContent = '';
            keystone = new KeystoneAPI(MashupPlatform.prefs.get('keystone_url'), {
                use_user_fiware_token: true
            });

            keystone.getTenants({
                onSuccess: onGetTenants,
                onFailure: function () {
                    document.getElementById('tenantId').textContent = 'Fail';
                    fail();
                }
            });
        });

        if (objectstorage_available) {
            document.getElementById('api_available').textContent = 'Yes';
        } else {
            document.getElementById('api_available').textContent = 'No';
            fail();
            button.disable();
        }
    }, 0);

})();
