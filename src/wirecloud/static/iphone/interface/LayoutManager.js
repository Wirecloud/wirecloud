/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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


var LayoutManagerFactory = function () {

    var instance = null;

    function LayoutManager () {
    }

    /*
     * Handler for changes in the hash to navigate to other areas
     */
    LayoutManager.prototype.onHashChange = function(state) {
        var ws_id, tab_id, tab, nextWorkspace, opManager, dragboard;

        opManager = OpManagerFactory.getInstance();

        ws_id = parseInt(state.workspace, 10);
        if (ws_id !== opManager.activeWorkspace.getId()) {
            nextWorkspace = opManager.workspaceInstances.get(ws_id);
            opManager.changeActiveWorkspace(nextWorkspace, state.tab);
            return;
        }

        if (state.view !== this.currentViewType) {
            switch (state.view) {
            case "dragboard":
                dragboard = null;
                tab_id = parseInt(state.tab, 10);
                if (state.tab !== opManager.activeWorkspace.visibleTab.getId()) {
                    tab = opManager.activeWorkspace.getTab(state.tab);
                    if (typeof tab !== "undefined") {
                        dragboard = tab.getDragboard();
                    }
                }
                if (dragboard === null) {
                    dragboard = opManager.activeWorkspace.getActiveDragboard();
                }
                this.showDragboard(dragboard);
                break;
            default:
            }
        }
    };


    // *********************************
    // SINGLETON GET INSTANCE
    // *********************************
    return new function() {
        this.getInstance = function() {
            if (instance == null) {
                instance = new LayoutManager();
            }
            return instance;
        }
    }
}();
