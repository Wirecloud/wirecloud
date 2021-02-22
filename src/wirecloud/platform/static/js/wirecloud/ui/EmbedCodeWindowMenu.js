/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    const builder = new se.GUIBuilder();

    const build_embed_code = function build_embed_code() {
        let workspace_url = this.workspace.model.url + '?mode=embedded';
        const lang = this.lang.getValue();
        if (lang !== "") {
            workspace_url += '&lang=' + encodeURIComponent(lang);
        }
        workspace_url += '&theme=' + encodeURIComponent(this.theme.getValue());
        const code = '<iframe src="' + workspace_url + '" style="width: 100%; height: 450px; border: 0px none;" frameborder="0" allowfullscreen></iframe>';
        this.code.setValue(code);
        this.repaint();
    };

    ns.EmbedCodeWindowMenu = class EmbedCodeWindowMenu extends ns.WindowMenu {

        constructor(title, workspace) {
            super(title, 'wc-embed-code-modal');

            this.workspace = workspace;

            this.theme = new se.Select({initialEntries: Wirecloud.constants.AVAILABLE_THEMES});
            this.theme.setValue(Wirecloud.currentTheme.name);
            this.lang = new se.Select({initialEntries: [{value: "", label: utils.gettext("Auto")}].concat(Wirecloud.constants.AVAILABLE_LANGUAGES)});
            this.code = new se.TextArea();

            var contents = builder.parse(Wirecloud.currentTheme.templates['wirecloud/modals/embed_code'], {
                'themeselect': this.theme,
                'langselect': this.lang,
                'code': this.code
            });
            contents.appendTo(this.windowContent);

            this.theme.addEventListener('change', build_embed_code.bind(this));
            this.lang.addEventListener('change', build_embed_code.bind(this));
            build_embed_code.call(this);

            // Accept button
            this.button = new se.Button({
                text: utils.gettext('Accept'),
                class: 'btn-primary btn-accept btn-cancel'
            });
            this.button.insertInto(this.windowBottom);
            this.button.addEventListener("click", this._closeListener);
        }

        setFocus() {
            this.code.select();
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
