/*jshint globalstrict:true */
/*global MashupPlatform*/

(function () {

    "use strict";

    var ngsi_available = false;
    var connection, msg, button;

    if (typeof NGSI !== 'undefined' && NGSI.Connection != null) {
        try {
            connection = new NGSI.Connection('http://wirecloud-demo.testbed.fi-ware.eu:1026');

            ngsi_available = true;
        } catch (err) {}
    }

    var fail = function fail() {
        msg = document.createElement('div');
        msg.className = 'alert alert-block alert-error';
        msg.textContent = 'Failure!';
        document.body.appendChild(msg);

        msg.scrollIntoView();
        button.enable();
    };

    var onRegisterContextSuccess = function onRegisterContextSuccess() {
        document.getElementById('register_context').textContent = 'OK';

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
                    fail();
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
                    fail();
                }
            }
        );
    };

    var onUpdateAttributesSuccess = function onUpdateAttributesSuccess() {
        document.getElementById('update_context_update').textContent = 'OK';

        msg = document.createElement('div');
        msg.className = 'alert alert-block alert-success';
        msg.textContent = 'Success!';
        document.body.appendChild(msg);

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
                        fail();
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
