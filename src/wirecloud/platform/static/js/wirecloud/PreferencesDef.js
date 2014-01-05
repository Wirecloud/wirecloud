(function () {

    "use strict";

    /**
     * 
     */
    var PreferencesDef = function PreferencesDef(definitions) {
        if (arguments.length == 0) {
            return;
        }

        Object.defineProperty(this, 'preferences', {value: definitions});
    };

    Wirecloud.PreferencesDef = PreferencesDef;

})();
