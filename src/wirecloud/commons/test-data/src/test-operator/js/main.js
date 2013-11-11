(function () {

    "use strict";

    MashupPlatform.wiring.registerCallback('input', function (data) {
        if (MashupPlatform.prefs.get('exception_on_event')) {
            throw new Error();
        }
        MashupPlatform.wiring.pushEvent('output', MashupPlatform.prefs.get('prefix') + data);
    });

    MashupPlatform.prefs.registerCallback(function (new_values) {
        MashupPlatform.wiring.pushEvent('output', 'preferences changed: ' + Object.keys(new_values));
    });

})();
