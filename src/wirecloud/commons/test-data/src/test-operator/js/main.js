(function () {

    "use strict";

    MashupPlatform.wiring.registerCallback('input', function (data) {
        if (MashupPlatform.prefs.get('exception_on_event')) {
            throw new Error();
        }
        MashupPlatform.wiring.pushEvent('output', MashupPlatform.prefs.get('prefix') + data);
    });

    MashupPlatform.prefs.registerCallback(function (new_values) {
        if (new_values.test_logging === true) {
            MashupPlatform.operator.log('error message');
            MashupPlatform.operator.log('error message2', MashupPlatform.log.ERROR);
            MashupPlatform.operator.log('warn message', MashupPlatform.log.WARN);
            MashupPlatform.operator.log('info message', MashupPlatform.log.INFO);
        }
        MashupPlatform.wiring.pushEvent('output', 'preferences changed: ' + Object.keys(new_values));
    });

})();
