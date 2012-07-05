(function () {

    "use strict";

    var platform, id, idx, tmp, i, current;

    platform = window.parent;

    // Get id from the URL
    idx = document.URL.lastIndexOf('#');
    tmp = document.URL.substr(idx + 1);
    tmp = tmp.split("&");
    for (i = 0; i < tmp.length; i++) {
        current = tmp[i];
        current = current.split("=", 2);
        if (current[0] === "id") {
            id = parseInt(current[1], 10);
            break;
        }
    }

    // API declaration
    Object.defineProperty(window, 'MashupPlatform', {value: {}});

    // HTTP module
    Object.defineProperty(window.MashupPlatform, 'http', {value: {}});
    Object.defineProperty(window.MashupPlatform.http, 'buildProxyURL', {value: platform.Wirecloud.io.buildProxyURL});
    Object.defineProperty(window.MashupPlatform.http, 'makeRequest', {value: platform.Wirecloud.io.makeRequest});
    Object.preventExtensions(window.MashupPlatform.http);

    // Widget Module
    Object.defineProperty(window.MashupPlatform, 'widget', {value: {}});
    Object.defineProperty(window.MashupPlatform.widget, 'id', {value: id});
    Object.preventExtensions(window.MashupPlatform.widget);

    // Wiring Module
    Object.defineProperty(window.MashupPlatform, 'wiring', {value: {}});
    Object.defineProperty(window.MashupPlatform.wiring, 'registerCallback', {
        value: function registerCallback(inputName, callback) {
            platform.opManager.activeWorkSpace.wiring.registerCallback(id, inputName, callback);
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'pushEvent', {
        value: function pushEvent(outputName, data) {
            platform.opManager.activeWorkSpace.wiring.pushEvent(id, outputName, data);
        }
    });
    Object.preventExtensions(window.MashupPlatform.wiring);

    Object.preventExtensions(window.MashupPlatform);

    // Remove link to wirecloud
    window.parent = window;
})();
