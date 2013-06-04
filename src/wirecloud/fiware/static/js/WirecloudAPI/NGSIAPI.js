(function () {

    "use strict";

    var key, manager = window.parent.NGSIManager, NGSIAPI = {};

    NGSIAPI.Connection = function Connection(url, options) {
        manager.Connection.call(this, 'operator', MashupPlatform.operator.id, url, options);
    };
    NGSIAPI.Connection.prototype = window.parent.NGSIManager.Connection.prototype;

    Object.freeze(NGSIAPI);

    window.NGSI = NGSIAPI;
})();
