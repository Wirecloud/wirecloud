/*global EzWebExt, StyledElements */


(function () {

    "use strict";

    /**
     * Permite distribuir contenidos según un border layout.
     */
    var HorizontalLayout = function HorizontalLayout(options) {
        StyledElements.StyledElement.call(this, []);

        this.options = EzWebExt.merge({
            'class': '',
            'autoHeight': true
        }, options);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = EzWebExt.appendWord(this.options['class'], "horizontal_layout");

        this.west = new StyledElements.Container({'class': 'west_container'});
        this.center = new StyledElements.Container({'class': 'center_container'});
        this.east = new StyledElements.Container({'class': 'east_container'});

        this.west.insertInto(this.wrapperElement);
        this.center.insertInto(this.wrapperElement);
        this.east.insertInto(this.wrapperElement);
    };
    HorizontalLayout.prototype = new StyledElements.StyledElement();

    HorizontalLayout.prototype.insertInto = function insertInto(element, refElement) {
        StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);
        this.repaint();
    };

    HorizontalLayout.prototype.repaint = function repaint(temporal) {
        var usableWidth = this.wrapperElement.offsetWidth;

        var v1 = this.west.wrapperElement.offsetWidth;
        var v2 = usableWidth - this.east.wrapperElement.offsetWidth;
        var centerWidth = v2 - v1;
        if (centerWidth < 0) {
            centerWidth = 0;
        }

        var height = Math.max(
            this.west.wrapperElement.offsetHeight,
            this.center.wrapperElement.offsetHeight,
            this.east.wrapperElement.offsetHeight
        );

        this.center.wrapperElement.style.width = centerWidth + 'px';
        this.center.wrapperElement.style.left = v1 + 'px';
        this.east.wrapperElement.style.left = v2 + 'px';
        if (this.options.autoHeight) {
            this.wrapperElement.style.height = height + 'px';
        }

        this.west.repaint(temporal);
        this.center.repaint(temporal);
        this.east.repaint(temporal);
    };

    HorizontalLayout.prototype.getWestContainer = function getWestContainer() {
        return this.west;
    };

    HorizontalLayout.prototype.getCenterContainer = function getCenterContainer() {
        return this.center;
    };

    HorizontalLayout.prototype.getEastContainer = function getEastContainer() {
        return this.east;
    };

    StyledElements.HorizontalLayout = HorizontalLayout;
})();
