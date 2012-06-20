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
    Object.defineProperty(window.MashupPlatform, 'http', {value: {}});
    Object.defineProperty(window.MashupPlatform.http, 'buildProxyURL', {value: platform.Wirecloud.io.buildProxyURL});
    Object.defineProperty(window.MashupPlatform.http, 'makeRequest', {value: platform.Wirecloud.io.makeRequest});
    Object.preventExtensions(window.MashupPlatform.http);

    Object.defineProperty(window.MashupPlatform, 'widget', {value: {}});
    Object.defineProperty(window.MashupPlatform.widget, 'id', {value: id});
    Object.preventExtensions(window.MashupPlatform.widget);

    Object.preventExtensions(window.MashupPlatform);

    // Remove link to wirecloud
    window.parent = window;
})();
