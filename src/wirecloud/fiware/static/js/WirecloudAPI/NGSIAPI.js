(function () {

    "use strict";

    var key, manager = window.parent.NGSIManager, NGSIAPI = {};

    if (MashupPlatform.operator != null) {
        NGSIAPI.Connection = function Connection(url, options) {
            manager.Connection.call(this, 'operator', MashupPlatform.operator.id, url, options);
        };
    } else if (MashupPlatform.widget != null) {
        NGSIAPI.Connection = function Connection(url, options) {
            manager.Connection.call(this, 'widget', MashupPlatform.widget.id, url, options);
        };
    } else {
        throw new Error('Unknown resource type');
    }
    NGSIAPI.Connection.prototype = window.parent.NGSIManager.Connection.prototype;

    Object.freeze(NGSIAPI);

    window.NGSI = NGSIAPI;
})();
