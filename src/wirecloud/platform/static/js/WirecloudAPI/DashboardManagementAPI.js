(function () {

    "use strict";

    var platform = window.parent;
    var Wirecloud = platform.Wirecloud;
    var resource = MashupPlatform.resource;
    var resource_element = resource.workspace.getIWidget(resource.id).content;
    var counter = 1;

    MashupPlatform.mashup.addWidget = function addWidget(ref, options) {
        // default options
        options = Wirecloud.Utils.merge({
            title: null,
            ref_position: null,
            preferences: {},
            properties: {},
            top: "0px",
            left: "0px",
            width: null, //auto
            height: null
        }, options);

        var widget_def = Wirecloud.LocalCatalogue.getResourceId(ref);
        var widget_title = options.title ? options.title : widget_def.title;
        var layout = Wirecloud.activeWorkspace.getActiveDragboard().freeLayout;

        if (options.ref_position != null) {
            var current_position = Wirecloud.Utils.getRelativePosition(resource_element, resource.tab.wrapperElement);
            options.left = (current_position.x + options.ref_position.left - layout.dragboardLeftMargin) + "px";
            options.top = (current_position.y + options.ref_position.bottom - layout.dragboardTopMargin) + "px";
        }

        var iwidgetinfo = {
            id: resource.id + '/' + counter++,
            name: widget_title,
            volatile: true,
            permissions: {
                close: true,
                rename: false
            },
            properties: options.properties,
            preferences: options.preferences,
            top: options.top,
            left: options.left,
            width: options.width,
            height: options.height
        };
        var iwidget = new platform.IWidget(widget_def, layout, iwidgetinfo);
        Wirecloud.activeWorkspace.getActiveDragboard().addIWidget(iwidget, {
            "setDefaultValues" : function () {}
        });

        /*
        var tmp_enpdoint = new Wirecloud.wiring.WidgetTargetEndpoint(resource, {
            name: 'status-' + iwidgetinfo.id,
        });
        iwidget.internal_iwidget.outputs["call-state"].connect(tmp_enpdoint);
        var registered_count = 0;
        tmp_enpdoint.callback = function (state) {
            if (state === 'REGISTERED') {
                iwidget.internal_iwidget.inputs["user-id"].propagate("tmendoza");
                iwidget.internal_iwidget.inputs["call-user"].propagate("anonymous");
            }
        };
        */
        return iwidget;
    };

})();
