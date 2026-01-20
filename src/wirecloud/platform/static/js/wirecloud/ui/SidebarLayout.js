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

    const ICON = Object.freeze({
        "right": "right",
        "left": "left",
        "top": "up",
        "bottom": "down"
    });
    const OPPOSITE = Object.freeze({
        "right": "left",
        "left": "right",
        "bottom": "up",
        "top": "down"
    });
    const POSITIONS = Object.freeze(["top", "right", "bottom", "left"]);

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

        const icon = this.active ? ICON[this.position] : OPPOSITE[this.position];
        this.handleicon.className = "fas fa-caret-" + icon;

        this._notifyWindowResizeEvent(true, true);
    };

    const getFirstWidget = function getFirstWidget(matrix) {
        const rows = Math.max(...matrix.map((column) => column.length));
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < matrix.length; x++) {
                if (matrix[x][y] != null) {
                    return matrix[x][y];
                }
            }
        }
        return null;
    };

    ns.SidebarLayout = class SidebarLayout extends ns.SmartColumnLayout {

        constructor(dragboard, options) {
            options = utils.merge({
                position: "left",
                active: false
            }, options);

            if (POSITIONS.indexOf(options.position) === -1) {
                throw new TypeError("Invalid position option: " + options.position);
            }
            const vertical = options.position === "right" || options.position === "left";

            super(
                dragboard,
                vertical ? 1 : 10,
                vertical ? 12 : 497,
                4,
                3,
                12
            );

            privates.set(this, {
                active: options.active
            });

            Object.defineProperties(this, {
                vertical: {
                    value: vertical
                },
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
            this.handleicon.className = "fas fa-caret-" + (this.active ? ICON[this.position] : OPPOSITE[this.position]);
            this.handle.appendChild(this.handleicon);
            this.handle.addEventListener("click", () => {
                this.active = !this.active;
            });
            this.handle.className = "wc-sidebar-" + this.position + "-handle hidden";
        }

        addWidget(widget, affectsDragboard) {
            const result = super.addWidget(widget, affectsDragboard);

            if (this.handle.classList.contains("hidden")) {
                this.handle.classList.remove("hidden");
            }
            if (this.initialized) {
                getFirstWidget(this.matrix).wrapperElement.appendChild(this.handle);
            }

            return result;
        }

        removeHandle() {
            this.handle.remove();
        }

        removeWidget(widget, affectsDragboard) {
            const result = super.removeWidget(widget, affectsDragboard);

            if (Object.keys(this.widgets).length === 0) {
                this.handle.classList.add("hidden");
                this.handle.remove();
            } else {
                getFirstWidget(this.matrix).wrapperElement.appendChild(this.handle);
            }
            return result;
        }

        adaptColumnOffset(size, width) {
            if (this.vertical) {
                return new Wirecloud.ui.MultiValuedSize(0, 0);
            } else {
                return super.adaptColumnOffset(size, width);
            }
        }

        adaptRowOffset(size) {
            if (this.vertical) {
                return super.adaptRowOffset(size);
            } else {
                return new Wirecloud.ui.MultiValuedSize(0, 0);
            }
        }

        adaptHeight(size) {
            if (this.vertical) {
                return super.adaptHeight(size);
            } else {
                return new Wirecloud.ui.MultiValuedSize(this.getHeight(), 1);
            }
        }

        adaptWidth(size, width) {
            if (this.vertical) {
                return new Wirecloud.ui.MultiValuedSize(width || this.getWidth(), 1);
            } else {
                return super.adaptWidth(size, width);
            }
        }

        getHeight() {
            return !this.vertical ? 497 : super.getHeight();
        }

        getWidth() {
            return this.vertical ? 497 : super.getWidth();
        }

        initialize() {
            const  modified = super.initialize();
            const firstWidget = getFirstWidget(this.matrix);
            if (firstWidget != null) {
                firstWidget.wrapperElement.appendChild(this.handle);
            }
            return modified;
        }

        updatePosition(widget, element) {
            if (!this.vertical) {
                let offset;
                if (!this.active) {
                    offset = -this.getHeight() - 1;
                } else {
                    offset = 0;
                }
                element.style.left = this.getColumnOffset(widget.position, null, true);
                element.style.right = "";
                if (this.position === "top") {
                    element.style.top = offset + "px";
                    element.style.bottom = "";
                } else {
                    element.style.bottom = offset + "px";
                    element.style.top = "";
                }
            } else /* if (this.vertical) */ {
                let offset;
                if (!this.active) {
                    offset = -this.getWidth() - this.leftMargin + this.dragboard.leftMargin;
                } else {
                    offset = 0;
                }
                element.style.top = this.getRowOffset(widget.position, true);
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

        getHeightInPixels(cells) {
            if (this.vertical) {
                return super.getHeightInPixels(cells);
            } else {
                return this.getHeight();
            }
        }

        isActive() {
            return this.active;
        }

    }

})(Wirecloud.ui, Wirecloud.Utils);
