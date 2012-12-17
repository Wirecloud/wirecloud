(function () {

    "use strict";

    MashupPlatform.wiring.registerCallback('input', function (data) {
        MashupPlatform.wiring.pushEvent('output', data);
    });

})();
