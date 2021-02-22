/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

/* globals Wirecloud */


(function (ns, utils) {

    "use strict";

    const load = function load() {
        if (this.status === "unloaded") {
            this.status = "loading";
            Wirecloud.loadWorkspace({owner: this.desc.user, name: this.desc.name}).then((workspace) => {
                this.loadWorkspace(workspace);
                this.loaded = "loaded";
            }).catch(() => {
                this.status = "unloaded";
            });
        }
    };

    ns.BusinessAPIEcosystemView = class BusinessAPIEcosystemView extends Wirecloud.ui.WorkspaceView {

        constructor(id, options) {
            options.class = 'catalogue fiware';
            super(id, options);

            Object.defineProperty(this, 'desc', {value: options.marketplace_desc});
            Object.defineProperty(this, 'market_id', {value: this.desc.user + '/' + this.desc.name});
            Object.defineProperty(this, 'workspaceview', {value: this.desc.user + '/' + this.desc.name});
            this.addEventListener('show', load.bind(this));

            this.status = "unloaded";
        }

        getLabel() {
            return this.desc.title || this.desc.name;
        }

        isAllow(action) {
            return (action in this.desc.permissions) ? this.desc.permissions[action] : false;
        }

        goUp() {
            return false;
        }

        wait_ready(listener) {
            listener();
        }

        getPublishEndpoints() {
            return null;
        }

        destroy() {
            if (this.status === "loaded") {
                this.model.unload();
                this.status = "unloaded";
            }
        }

    }

    Wirecloud.MarketManager.addMarketType('fiware-bae', 'FIWARE Business API Ecosystem', ns.BusinessAPIEcosystemView);

})(Wirecloud.FiWare, Wirecloud.Utils);
