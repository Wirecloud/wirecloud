
var UserInterfaceHandlers = {};

UserInterfaceHandlers.goback = function() {
    // TODO
};

UserInterfaceHandlers.instanciate = function(catalogue, resource) {
    return function (e) {
        Event.stop(e);
        catalogue.instanciate(resource);
        LayoutManagerFactory.getInstance().changeCurrentView('workspace');
    }
};
