/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*global gettext, StyledElements, Wirecloud */

(function () {

    "use strict";

    var ResourceDetailsView = function ResourceDetailsView(id, options) {
        var extra_context;

        this.mainview = options.catalogue;
        options['class'] = 'details_interface loading';
        StyledElements.Alternative.call(this, id, options);

        extra_context = function (resource) {
            return {
                'details': function (options, context) {
                    var details, i, entries, versions;

                    details = new StyledElements.StyledNotebook();
                    details.addEventListener('changed', function (notebook, oldTab, newTab, context) {
                        if (context == null || context.init !== true) {
                            var new_status = this.mainview.buildStateData();
                            Wirecloud.HistoryManager.pushState(new_status);
                        }
                        LayoutManagerFactory.getInstance().header.refresh();
                    }.bind(this));

                    var select = new StyledElements.StyledSelect({'class': 'versions'});
                    entries = [];
                    versions = resource.getAllVersions();
                    for (i = 0; i < versions.length; i++) {
                        entries.push({
                            'label': 'v' + versions[i].text,
                            'value': versions[i].text
                        });
                    }
                    select.addEntries(entries);
                    details.addButton(select, 'left');
                    select.setDisabled(versions.length === 1);
                    select.setValue(resource.version.text);
                    select.addEventListener('change', function (select) {
                        LayoutManagerFactory.getInstance().header._notifyViewChange();
                        resource.changeVersion(select.getValue());
                        this.mainview.createUserCommand('showDetails', resource, {
                                onComplete: function () {
                                    var new_status = this.mainview.buildStateData();
                                    Wirecloud.HistoryManager.pushState(new_status);
                                    LayoutManagerFactory.getInstance().header.refresh();
                                }.bind(this)
                            })();
                    }.bind(this));

                    var main_description = details.createTab({'name': gettext('Main Info'), 'closable': false});
                    main_description.appendChild(this.main_details_painter.paint(resource));

                    if (resource.doc) {
                        var documentation = details.createTab({'name': gettext('Documentation'), 'containerOptions': {'class': 'documentation loading'}, 'closable': false});
                        documentation.addEventListener('show', function (tab) {
                            tab.disable();
                            var doc_url = resource.catalogue.RESOURCE_USERGUIDE_ENTRY.evaluate(resource);
                            Wirecloud.io.makeRequest(doc_url, {
                                method: 'GET',
                                onSuccess: function (response) {
                                    var article = document.createElement('article');
                                    article.className = 'markdown-body';
                                    article.innerHTML = response.responseText;
                                    documentation.clear();
                                    documentation.appendChild(article);
                                }.bind(this),
                                onComplete: function () {
                                    tab.enable();
                                }
                            });
                        }.bind(this));
                    }

                    if (resource.changelog) {
                        var changelog = details.createTab({'name': gettext('Change Log'), 'containerOptions': {'class': 'changelog loading'}, 'closable': false});
                        changelog.addEventListener('show', function (tab) {
                            tab.disable();
                            Wirecloud.io.makeRequest(this.mainview.catalogue.RESOURCE_CHANGELOG_ENTRY.evaluate(resource), {
                                method: 'GET',
                                onSuccess: function (response) {
                                    var article = document.createElement('article');
                                    article.className = 'markdown-body';
                                    article.innerHTML = response.responseText;
                                    changelog.clear();
                                    changelog.appendChild(article);
                                }.bind(this),
                                onComplete: function () {
                                    tab.enable();
                                }
                            });
                        }.bind(this));
                    }

                    this.currentNotebook = details;
                    return details;
                }.bind(this)
            };
        }.bind(this);

        this.main_details_painter = new Wirecloud.ui.ResourcePainter(this.mainview, Wirecloud.currentTheme.templates.catalogue_main_resource_details_template, this);
        this.resource_details_painter = new Wirecloud.ui.ResourcePainter(this.mainview, Wirecloud.currentTheme.templates.catalogue_resource_details_template, this, extra_context);
    };
    ResourceDetailsView.prototype = new StyledElements.Alternative();

    ResourceDetailsView.prototype.view_name = 'details';

    ResourceDetailsView.prototype.buildStateData = function buildStateData(data) {
        if (this.currentEntry != null) {
            data.resource = this.currentEntry.uri;

            if (this.currentNotebook) {
                data.tab = this.currentNotebook.getVisibleTab().nameText;
            }
        }
    };

    ResourceDetailsView.prototype.paint = function paint(resource, options) {
        if (options == null) {
            options = {};
        }

        this.currentEntry = resource;
        this.clear();
        this.appendChild(this.resource_details_painter.paint(resource));

        if (options.tab != null) {
            this.currentNotebook.goToTab(this.currentNotebook.getTabByLabel(options.tab), {
                context: {init: true}
            });
        }
    };

    Wirecloud.ui.WirecloudCatalogue.ResourceDetailsView = ResourceDetailsView;
})();
