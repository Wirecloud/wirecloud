/*
 *  This file is part of Wirecloud.
 *  Copyright (C) 2015  CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *  Wirecloud is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  License, or (at your option) any later version.
 *
 *  Wirecloud is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.
 */

/*global StyledElements*/


StyledElements.OffCanvasLayout = (function () {

    "use strict";

    // ==================================================================================
    // CLASS CONSTRUCTOR
    // ==================================================================================

    /**
     * Create a new instance of class OffCanvasLayout.
     * @class
     *
     * @param {Object.<String, *>} [options]
     */
    var OffCanvasLayout = function OffCanvasLayout(options) {
        var defaults = {
            'direction': "to-left",
            'iconLClassName': "icon-caret-left",
            'iconRClassName': "icon-caret-right"
        };

        options = StyledElements.Utils.merge(defaults, options);
        StyledElements.StyledElement.call(this, ['slidedown', 'slideup']);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "se-offcanvas";

        switch (options.direction) {
            case 'to-left':
                this.wrapperElement.classList.add("se-offcanvas-to-left");
                this.toLeft = true;
                break;
            case 'to-right':
                this.wrapperElement.classList.add("se-offcanvas-to-right");
                this.toLeft = false;
                break;
            default:
                break;
        }

        Object.defineProperties(this, {
            'sidebar': {
                'value': new StyledElements.Container({
                    'class': 'se-offcanvas-sidebar'
                })
            },
            'content': {
                'value': new StyledElements.Container({
                    'class': 'se-offcanvas-content'
                })
            },
            'footer': {
                'value': new StyledElements.Container({
                    'class': 'se-offcanvas-footer'
                })
            }
        });

        this.iconLClassName = options.iconLClassName;
        this.iconRClassName = options.iconRClassName;
        this.slipped = false;
        this.panelList = [];
        this.lastestOpened = -1;

        this.directionalIcon = document.createElement('span');

        if (this.toLeft) {
            this.directionalIcon.className = this.iconRClassName;
        } else {
            this.directionalIcon.className = this.iconLClassName;
        }

        this.btnSlideToggle = document.createElement('div');
        this.btnSlideToggle.className = 'se-offcanvas-btn-close';
        this.btnSlideToggle.appendChild(this.directionalIcon);
        this.btnSlideToggle.addEventListener('click', function (event) {
            this.slideToggle();
        }.bind(this));

        this.sidebar.appendChild(this.btnSlideToggle);

        this.sidebar.insertInto(this.wrapperElement);
        this.content.insertInto(this.wrapperElement);
        this.footer.insertInto(this.wrapperElement);
    };

    OffCanvasLayout.prototype = new StyledElements.StyledElement();

    // ==================================================================================
    // PUBLIC METHODS
    // ==================================================================================

    OffCanvasLayout.prototype.appendPanel = function appendPanel(panelElement) {
        this.sidebar.appendChild(panelElement.wrapperElement);
        this.panelList.push(panelElement);

        return this;
    };

    /**
     * @override
     *
     * @returns {OffCanvasLayout} The instance on which this function was called.
     */
    OffCanvasLayout.prototype.repaint = function repaint(temporal) {
        this.sidebar.repaint(temporal);
        this.content.repaint(temporal);
        this.footer.repaint(temporal);

        return this;
    };

    /**
     * Display the default sidebar with a sliding motion.
     * @function
     * @public
     *
     * @returns {OffCanvasLayout} The instance on which this function was called.
     */
    OffCanvasLayout.prototype.slideDown = function slideDown(panelIndex) {
        var i, panelOpened;

        if (this.panelList.length) {
            for (i = 0; i < this.panelList.length; i++) {
                if (typeof panelIndex !== 'undefined' && i === panelIndex) {
                    this.lastestOpened = i;
                    continue;
                }

                this.panelList[i].hide();
            }

            if (this.lastestOpened < 0) {
                this.lastestOpened = 0;
            }

            panelOpened = this.panelList[this.lastestOpened].show();
        }

        this.wrapperElement.classList.add('slipped');
        this.slipped = true;

        if (this.toLeft) {
            this.directionalIcon.className = this.iconLClassName;
        } else {
            this.directionalIcon.className = this.iconRClassName;
        }

        return this;
    };

    /**
     * Display or hide the default sidebar with a sliding motion.
     * @function
     * @public
     *
     * @returns {OffCanvasLayout} The instance on which this function was called.
     */
    OffCanvasLayout.prototype.slideToggle = function slideToggle() {
        return (this.slipped) ? this.slideUp() : this.slideDown();
    };

    /**
     * Hide the default sidebar with a sliding motion.
     * @function
     * @public
     *
     * @returns {OffCanvasLayout} The instance on which this function was called.
     */
    OffCanvasLayout.prototype.slideUp = function slideUp() {
        this.events.slideup.dispatch();

        this.wrapperElement.classList.remove('slipped');
        this.slipped = false;

        if (this.toLeft) {
            this.directionalIcon.className = this.iconRClassName;
        } else {
            this.directionalIcon.className = this.iconLClassName;
        }

        return this;
    };

    return OffCanvasLayout;

})();
