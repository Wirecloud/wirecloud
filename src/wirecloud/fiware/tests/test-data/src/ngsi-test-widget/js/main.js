/* jshint globalstrict:true */
/* globals MashupPlatform */


(function () {

    "use strict";

    var ngsi_available = false;
    var connection, msg, button, context_id;

    if (typeof NGSI !== 'undefined' && NGSI.Connection != null) {
        try {
            connection = new NGSI.Connection(MashupPlatform.prefs.get('ngsi_server'));

            ngsi_available = true;
        } catch (err) {}
    }

    var fail = function fail(e) {
        msg = document.createElement('div');
        msg.className = 'alert alert-block alert-error';
        msg.innerHTML = '<h4>Failure!</h4>';
        if (e != null) {
            msg.innerHTML += '<p>' + e.message + '</p>';
        }
        document.body.appendChild(msg);

        msg.scrollIntoView();
        button.enable();
    };

    var onRegisterContextSuccess = function onRegisterContextSuccess(registration_info) {

        context_id = registration_info.registrationId;
        document.getElementById('register_context').textContent = 'OK (' + context_id + ')';

        connection.addAttributes([
                {
                    'entity': {type: 'TestEntity', id: 'test1'},
                    'attributes': [{
                        'name': 'new_attribute',
                        'type': 'string',
                        'contextValue': 'value'
                    }]
                }
            ], {
                onSuccess: onAddAttributesSuccess,
                onFailure: function (e) {
                    document.getElementById('update_context_append').textContent = 'Fail';
                    fail(e);
                }
            }
        );
    };

    var onAddAttributesSuccess = function onAddAttributesSuccess() {
        document.getElementById('update_context_append').textContent = 'OK';

        connection.updateAttributes([
                {
                    'entity': {type: 'TestEntity', id: 'test1'},
                    'attributes': [{
                        'name': 'new_attribute',
                        'type': 'string',
                        'contextValue': 'new_value'
                    }]
                }
            ], {
                onSuccess: onUpdateAttributesSuccess,
                onFailure: function (e) {
                    document.getElementById('update_context_update').textContent = 'Fail';
                    fail(e);
                }
            }
        );
    };

    var onUpdateAttributesSuccess = function onUpdateAttributesSuccess() {
        document.getElementById('update_context_update').textContent = 'OK';

        connection.cancelRegistration(context_id, {
                onSuccess: onCancelRegistrationSuccess,
                onFailure: function (e) {
                    document.getElementById('cancel_registration').textContent = 'Fail';
                    fail(e);
                }
            }
        );
    };

    var onCancelRegistrationSuccess = function onCancelRegistrationSuccess() {
        document.getElementById('cancel_registration').textContent = 'OK';

        msg = document.createElement('div');
        msg.className = 'alert alert-block alert-success';
        msg.textContent = 'Success!';
        document.body.appendChild(msg);

        msg.scrollIntoView();
        button.enable();
    };

    setTimeout(function () {
        button = new StyledElements.Button({
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

            connection = new NGSI.Connection(MashupPlatform.prefs.get('ngsi_server'), {use_user_fiware_token: MashupPlatform.prefs.get('use_user_fiware_token')});
            connection.createRegistration([
                    {type: 'TestEntity', id: 'test1'}
                ],
                [],
                'PT2M',
                'http://app.example.com/',
                {
                    onSuccess: onRegisterContextSuccess,
                    onFailure: function (e) {
                        document.getElementById('register_context').textContent = 'Fail';
                        fail(e);
                    }
                }
            );
        });

        if (ngsi_available) {
            document.getElementById('api_available').textContent = 'Yes';
        } else {
            document.getElementById('api_available').textContent = 'No';
            fail();
            button.disable();
        }
    }, 0);

})();
