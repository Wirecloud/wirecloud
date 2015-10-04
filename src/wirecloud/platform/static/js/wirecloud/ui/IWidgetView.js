/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

        Object.defineProperties(this, {
            widget: {value: iwidget}
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
                var button = new StyledElements.Button({
                    'plain': true,
                    'class': 'icon-cogs',
                    'title': utils.gettext('Menu')
                });
                button.addEventListener("click",
                    function (button) {
                        view.menu.show(button.getBoundingClientRect());
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
                content.setAttribute("type", iwidget.widget.code_content_type);
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
        this.tmp = tmp;

        iwidget.addEventListener('title_changed', function (title) {
            this.titleelement.setTextContent(title);
        }.bind(this));

        iwidget.addEventListener('upgraded', this.reload.bind(this));
    };

    IWidgetView.prototype.reload = function () {
        var prev = this.content.src;
        this.content.src = this.widget.codeURL;
        this.content.setAttribute("type", this.widget.meta.code_content_type);
        if (this.content.src === prev) {
            this.content.contentDocument.location.reload();
        }
    };

    Wirecloud.ui.IWidgetView = IWidgetView;

})(Wirecloud.Utils);
