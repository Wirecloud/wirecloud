(function () {

    "use strict";

    var EndpointException = function EndpointException(message) {
        this.name = "EndpointException";
        this.message = message || "";
    };
    EndpointException.prototype = new Error();
    EndpointException.prototype.constructor = EndpointException;

    Object.freeze(EndpointException.prototype);
    Object.freeze(EndpointException);

    Wirecloud.wiring.EndpointException = EndpointException;

})();
