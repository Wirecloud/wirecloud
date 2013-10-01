(function () {

    "use strict";

    MashupPlatform.wiring.registerCallback('input', function (data) {
        MashupPlatform.wiring.pushEvent('output', MashupPlatform.prefs.get('prefix') + data);
    });

})();
