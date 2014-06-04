/*
 *     (C) Copyright 2013 Universidad Politécnica de Madrid
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

(function () {

    var builder = new StyledElements.GUIBuilder();

    var IWidgetView = function IWidgetView(iwidget, template, /* TODO */ view) {

        var tmp = {};

        var ui_fragment = builder.parse(template, {
            'closebutton': function () {
                var button = new StyledElements.StyledButton({
                    'plain': true,
                    'class': 'icon-remove',
                    'title': gettext('Close')
                });

                button.addEventListener("click",
                    function () {
                        iwidget.remove();
                    });

                tmp.closebutton = button;
                return button;
            },
            'errorbutton': function () {
                var button = new StyledElements.StyledButton({
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
                var button = new StyledElements.StyledButton({
                    'plain': true,
                    'class': 'icon-cogs',
                    'title': gettext('Menu')
                });
                button.addEventListener("click",
                    function (button) {
                        view.menu.show(button.getBoundingClientRect());
                    });
                tmp.menubutton = button;
                return button;
            },
            'minimizebutton': function () {
                var button = new StyledElements.StyledButton({
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
                var element = new StyledElements.EditableElement({initialContent: view.name});
                element.addEventListener('change', function (element, new_name) { iwidget.setName(new_name); });
                tmp.titleelement = element;
                return element;
            },
            'bottomresizehandle': function () {
                var handle = new IWidgetResizeHandle(view, {resizeLeftSide: true, fixWidth: true});
                tmp.bottomresizehandle = handle;
                handle.addClassName("bottomResizeHandle");
                return handle;
            },
            'leftresizehandle': function () {
                var handle = new IWidgetResizeHandle(view, {resizeLeftSide: true});
                tmp.leftresizehandle = handle;
                handle.addClassName("leftResizeHandle");
                return handle;
            },
            'rightresizehandle': function () {
                var handle = new IWidgetResizeHandle(view, {resizeLeftSide: false});
                tmp.rightresizehandle = handle;
                handle.addClassName("rightResizeHandle");
                return handle;
            },
            'iframe': function () {
                var content = document.createElement("iframe");
                content.classList.add("widget_object");
                content.setAttribute("type", this.widget.code_content_type);
                content.setAttribute("frameBorder", "0");
                content.addEventListener("load", iwidget._notifyLoaded.bind(iwidget, content), true);

                return content;
            }.bind(iwidget)
        });

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
    };

    Wirecloud.ui.IWidgetView = IWidgetView;
})();
