(function () {

    "use strict";

    var tutorials = [];

    var TutorialCatalogue = {};

    TutorialCatalogue.add = function add(tutorial) {
        if (!(tutorial instanceof Wirecloud.ui.Tutorial)) {
            throw new TypeError('tutorial must be an instance of Wirecloud.ui.Tutorial');
        }

        tutorials.push(tutorial);
    };

    Object.defineProperty(TutorialCatalogue, 'tutorials', {
        get: function () { return tutorials; }
    });
    Object.freeze(TutorialCatalogue);

    Wirecloud.TutorialCatalogue = TutorialCatalogue;

})();
