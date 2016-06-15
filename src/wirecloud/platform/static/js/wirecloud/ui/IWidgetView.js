/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements, Wirecloud */

(function (utils) {

    "use strict";

    var builder = new StyledElements.GUIBuilder();

    /* TODO remove view parameter */
    var IWidgetView = function IWidgetView(iwidget, template, view) {

        var layout;

        StyledElements.ObjectWithEvents.call(this, ['highlight', 'unhighlight']);
        Object.defineProperties(this, {
            widget: {value: iwidget},
            layout: {
                get: function () {
                    return layout;
                },
                set: function (new_layout) {
                    layout = new_layout;
                    this.updateCSSClasses();
                }
            }
        });

        var tmp = {};

        var ui_fragment = builder.parse(template, {
            'closebutton': function () {
                var button = new StyledElements.Button({
                    'plain': true,
                    'class': 'icon-remove',
                    'title': utils.gettext('Close')
                });

                button.addEventListener("click",
                    function () {
                        iwidget.remove();
                    });

                tmp.closebutton = button;
                return button;
            },
            'errorbutton': function () {
                var button = new StyledElements.Button({
                    'plain': true,
                    'class': 'errorbutton icon-warning-sign'
                });
                button.addEventListener("click",
                    function (button) {
                        var dialog = new Wirecloud.ui.LogWindowMenu(this.logManager);
                        dialog.show();
                    }.bind(this));
                button.disable();

                tmp.errorbutton = button;
                return button;
            }.bind(iwidget),
            'menubutton': function () {
                var button = new StyledElements.PopupButton({
                    class: 'wc-menu-btn icon-cogs',
                    menu: view.menu,
                    plain: true,
                    title: utils.gettext('Menu')
                });
                tmp.menubutton = button;
                return button;
            },
            'minimizebutton': function () {
                var button = new StyledElements.Button({
                    'plain': true
                });
                button.addEventListener("click",
                    function (button) {
                        view.toggleMinimizeStatus(true);
                    });
                tmp.minimizebutton = button;
                return button;
            },
            'title': function () {
                var element = new StyledElements.EditableElement({initialContent: iwidget.title});
                element.addEventListener('change', function (element, new_title) { iwidget.setTitle(new_title); });
                this.titleelement = element;
                return element;
            }.bind(this),
            'bottomresizehandle': function () {
                var handle = new Wirecloud.ui.IWidgetResizeHandle(view, {resizeLeftSide: true, fixWidth: true});
                tmp.bottomresizehandle = handle;
                handle.addClassName("bottomResizeHandle");
                return handle;
            },
            'leftresizehandle': function () {
                var handle = new Wirecloud.ui.IWidgetResizeHandle(view, {resizeLeftSide: true});
                tmp.leftresizehandle = handle;
                handle.addClassName("leftResizeHandle");
                return handle;
            },
            'rightresizehandle': function () {
                var handle = new Wirecloud.ui.IWidgetResizeHandle(view, {resizeLeftSide: false});
                tmp.rightresizehandle = handle;
                handle.addClassName("rightResizeHandle");
                return handle;
            },
            'iframe': function (options, tcomponents, iwidget) {
                var content = document.createElement("iframe");
                content.classList.add("widget_object");
                content.setAttribute("type", iwidget.widget.codecontenttype);
                content.setAttribute("frameBorder", "0");
                content.addEventListener("load", iwidget._notifyLoaded.bind(iwidget, content), true);

                var requirements = iwidget.widget.requirements;
                for (var i = 0; i < requirements.length; i++) {
                    if (requirements[i].type === 'feature' && requirements[i].name === 'FullscreenWidget') {
                        content.setAttribute('allowfullscreen', 'true');
                        break;
                    }
                }
                this.content = content;
                return content;
            }.bind(this)
        }, iwidget);

        if ('bottomresizehandle' in tmp) {
            tmp.bottomresizehandle.setResizableElement(ui_fragment.elements[1]);
        }
        if ('leftresizehandle' in tmp) {
            tmp.leftresizehandle.setResizableElement(ui_fragment.elements[1]);
        }
        if ('rightresizehandle' in tmp) {
            tmp.rightresizehandle.setResizableElement(ui_fragment.elements[1]);
        }

        this.element = ui_fragment.elements[1];
        this.element.classList.add('iwidget');
        this.element.setAttribute('data-id', this.widget.id);
        this.tmp = tmp;

        iwidget.addEventListener('title_changed', function (title) {
            this.titleelement.setTextContent(title);
        }.bind(this));

        iwidget.addEventListener('unload', function (title) {
            this.unhighlight();
        }.bind(this));

        iwidget.addEventListener('upgraded', function () {
            this.updateCSSClasses();
            this.reload();
        }.bind(this));
        this.updateCSSClasses();
    };
    IWidgetView.prototype = new StyledElements.ObjectWithEvents();

    IWidgetView.prototype.updateCSSClasses = function updateCSSClasses() {
        if (this.widget.missing) {
            this.element.classList.add('wc-missing-widget');
        } else {
            this.element.classList.remove('wc-missing-widget');
        }

        if (this.layout != null && this.layout instanceof Wirecloud.ui.FreeLayout) {
            this.element.classList.add('wc-floating-widget');
        } else {
            this.element.classList.remove('wc-floating-widget');
        }
    };

    IWidgetView.prototype.reload = function reload() {
        var prev = this.content.src;
        this.content.src = this.widget.codeurl;
        this.content.setAttribute("type", this.widget.meta.codecontenttype);
        if (this.content.src === prev) {
            this.content.contentDocument.location.reload();
        }
    };

    IWidgetView.prototype.highlight = function highlight() {
        this.element.classList.add('panel-success');
        this.element.classList.remove('panel-default');
        if (!this.element.classList.contains('wc-widget-highlight')) {
            this.element.classList.add('wc-widget-highlight');
            this.trigger('highlight');
        } else {
            // Reset highlighting animation
            this.element.classList.remove('wc-widget-highlight');
            setTimeout(function () {
                this.element.classList.add('wc-widget-highlight');
            }.bind(this));
        }
    };

    IWidgetView.prototype.unhighlight = function unhighlight() {
        this.element.classList.remove('panel-success');
        this.element.classList.add('panel-default');
        if (this.element.classList.contains('wc-widget-highlight')) {
            this.element.classList.remove('wc-widget-highlight');
            this.trigger('unhighlight');
        }
    };

    Wirecloud.ui.IWidgetView = IWidgetView;

})(Wirecloud.Utils);
