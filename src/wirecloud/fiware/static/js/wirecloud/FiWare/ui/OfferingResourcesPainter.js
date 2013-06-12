/*global gettext, LayoutManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var OfferingResourcePainter = function OfferingResourcePainter() {
    };

    var MAC_MIMETYPES = ['application/x-widget+mashable-application-component', 'application/x-operator+mashable-application-component', 'application/x-mashup+mashable-application-component'];

    var is_mac_mimetype = function is_mac_mimetype(mimetype) {
        return MAC_MIMETYPES.indexOf(mimetype) !== -1;
    };

    var install = function install(url, catalogue, store, button) {
        var layoutManager, local_catalogue_view;

        local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local;
        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Importing resource into local repository"), 3);
        layoutManager.logSubTask(gettext('Uploading resource'));

        local_catalogue_view.catalogue.addResourceFromURL(url, {
            packaged: true,
            forceCreate: true,
            market_info: {
                name: catalogue.market_name,
                store: store
            },
            onSuccess: function () {
                LayoutManagerFactory.getInstance().logSubTask(gettext('Resource installed successfully'));
                LayoutManagerFactory.getInstance().logStep('');
                button.addClassName('btn-success');
                button.setLabel(gettext('Installed'));

                local_catalogue_view.refresh_search_results();
            },
            onFailure: function (msg) {
                button.enable();
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                LogManagerFactory.getInstance().log(msg);
            },
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    var onClick = function onClick(url, catalogue, store, button) {
        button.disable();
        install(url, catalogue, store, button);
    };

    OfferingResourcePainter.prototype.paint = function paint(offering, dom_element, catalogue) {
        var i, resource, wrapper, li, button;

        wrapper = document.createElement('ul');
        dom_element.appendChild(wrapper);

        for (i = 0; i < offering.resources.length; i += 1) {
            resource = offering.resources[i];

            li = document.createElement('li');
            li.textContent = resource.name;
            if ('url' in resource) {
                if (is_mac_mimetype(resource.content_type)) {

                    if (Wirecloud.LocalCatalogue.resourceExistsId(resource.id)) {
                        button = new StyledElements.StyledButton({'class': 'btn-success', text: gettext('Installed')});
                        button.disable();
                    } else {
                        button = new StyledElements.StyledButton({text: gettext('Install')});
                        button.addEventListener('click', onClick.bind(null, resource.url, catalogue, offering.getStore()));
                    }

                } else {

                    button = new StyledElements.StyledButton({'class': 'btn-info', text: gettext('Download')});

                }
                button.insertInto(li);
            }
            wrapper.appendChild(li);
        }
    };

    Wirecloud.FiWare.ui.OfferingResourcePainter = OfferingResourcePainter;

})();
