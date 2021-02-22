/*
 *     Copyright (c) 2018-2021 Future Internet Consulting and Development Solutions S.L.
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

    const privates = new WeakMap();

    const OPPOSITE = {
        "right": "left",
        "left": "right"
    };

    const on_active_get = function on_active_get() {
        return privates.get(this).active;
    };

    const on_active_set = function on_active_set(newstatus) {
        // Sanitize newstatus value
        newstatus = !!newstatus;

        if (newstatus === privates.get(this).active) {
            // Do nothing
            return;
        }

        privates.get(this).active = newstatus;

        let position = this.active ? this.position : OPPOSITE[this.position];
        this.handleicon.className = "fas fa-caret-" + position;

        this._notifyWindowResizeEvent(true, true);
    };

    ns.SidebarLayout = class SidebarLayout extends ns.SmartColumnLayout {

        constructor(dragboard, options) {
            options = utils.merge({
                position: "left"
            }, options);

            super(
                dragboard,
                1,
                12,
                4,
                3,
                12
            );

            privates.set(this, {
                active: false
            });

            Object.defineProperties(this, {
                position: {
                    value: options.position
                },
                active: {
                    get: on_active_get,
                    set: on_active_set
                }
            });

            this.handle = document.createElement("div");
            this.handleicon = document.createElement("i");
            this.handleicon.className = "fas fa-caret-" + OPPOSITE[this.position];
            this.handle.appendChild(this.handleicon);
            this.handle.addEventListener("click", () => {
                this.active = !this.active;
            });
            this.handle.className = "wc-sidebar-" + this.position + "-handle hidden";
        }

        addWidget(widget, affectsDragboard) {
            const result = Wirecloud.ui.SmartColumnLayout.prototype.addWidget.call(this, widget, affectsDragboard);

            if (this.handle.classList.contains("hidden")) {
                this.handle.classList.remove("hidden");
            }
            if (this.initialized) {
                this.matrix[0][0].wrapperElement.appendChild(this.handle);
            }

            return result;
        }

        removeWidget(widget, affectsDragboard) {
            const result = Wirecloud.ui.SmartColumnLayout.prototype.removeWidget.call(this, widget, affectsDragboard);

            if (Object.keys(this.widgets).length === 0) {
                this.handle.classList.add("hidden");
                this.handle.remove();
            } else {
                this.matrix[0][0].wrapperElement.appendChild(this.handle);
            }
            return result;
        }

        adaptColumnOffset(value) {
            return new Wirecloud.ui.MultiValuedSize(0, 0);
        }

        adaptWidth(size) {
            return new Wirecloud.ui.MultiValuedSize(this.getWidth(), 1);
        }

        getWidth() {
            return 497;
        }

        initialize() {
            let modified = Wirecloud.ui.SmartColumnLayout.prototype.initialize.call(this);
            if (this.matrix[0][0] != null) {
                this.matrix[0][0].wrapperElement.appendChild(this.handle);
            }
            return modified;
        }

        updatePosition(widget, element) {
            var offset;
            if (!this.active) {
                offset = -this.getWidth() - this.leftMargin + this.dragboard.leftMargin;
            } else {
                offset = 0;
            }

            element.style.top = this.getRowOffset(widget.position) + "px";
            element.style.bottom = "";
            if (this.position === "left") {
                element.style.left = offset + "px";
                element.style.right = "";
            } else {
                element.style.right = offset + "px";
                element.style.left = "";
            }
        }

    }

})(Wirecloud.ui, Wirecloud.Utils);
