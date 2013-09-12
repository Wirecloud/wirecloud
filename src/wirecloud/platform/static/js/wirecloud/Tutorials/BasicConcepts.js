/*global Wirecloud*/

(function () {

    "use strict";

    var create_workspace = function create_workspace(autoAction) {
        LayoutManagerFactory.getInstance().changeCurrentView('workspace');
        opManager.addWorkspace('Basic concepts tutorial', {
            onSuccess: function () {
                autoAction.nextHandler();
            }
        });
    };

    var install_widget_step2 = function install_widget_step2(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/wms-viewer-geowidget/0.1')) {
            Wirecloud.LocalCatalogue.addResourceFromURL('http://conwet.fi.upm.es/docs/download/attachments/1278018/CoNWeT_wms-viewer-geowidget_0.1.wgt', {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var install_widgets = function install_widget(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/weather-example/1.0.1')) {
            Wirecloud.LocalCatalogue.addResourceFromURL('http://conwet.fi.upm.es/docs/download/attachments/1278018/CoNWeT_weather-example_1.0.1.wgt', {
                packaged: true,
                onSuccess: install_widget_step2.bind(null, autoAction)
            });
        } else {
            install_widget_step2(autoAction);
        }
    };

    Wirecloud.TutorialCatalogue.add(new Wirecloud.ui.Tutorial(gettext('Basic concepts'), [
            {'type': 'simpleDescription', 'msg': gettext("<p>This tutorial will show you the basic concepts behind Wirecloud.</p>"), 'elem': null},
            {'type': 'autoAction', 'action': create_workspace},
            {'type': 'simpleDescription', 'msg': gettext("<p>This is the Editor view. In this view, you will see your current workspace. Currently you are in the 'Basic concepts tutorial' workspace and it's empty.</p><p>You </p>"), 'elem': null},
            {'type': 'autoAction', 'action': install_widgets},
            {'type': 'simpleDescription', 'msg': gettext("<p>Congratulations! You have finished the basic concepts tutorial. You should be ready for using Wirecloud.</p>"), 'elem': null}
    ]));

})();
