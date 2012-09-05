/*
 *     (C) Copyright 2011-2012 Universidad Politécnica de Madrid
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

var MobileDragboard = function () {
    this.layout = new StyledElements.BorderLayout({'class': 'dragboard'});
    this.toolbar = new StyledElements.NavigationHeader();
    this.alternatives = new StyledElements.StyledAlternatives();

    this.layout.getNorthContainer().appendChild(this.toolbar);
    this.layout.getCenterContainer().appendChild(this.alternatives);

    this.toolbar.addEventListener('back', function () {
        OpManagerFactory.getInstance().showWidgetsMenu();
    });

    this.clear();

    this.wrapperElement = this.layout.wrapperElement;
};
MobileDragboard.prototype = new StyledElements.StyledElement();

MobileDragboard.prototype.clear = function () {
    this.alternatives.clear();
    this.emptyAlternative = this.alternatives.createAlternative();
};

MobileDragboard.prototype.repaint = function (temporal) {
    this.layout.repaint(temporal);
};

MobileDragboard.prototype.newIWidgetContainer = function () {
    return this.alternatives.createAlternative();
};

MobileDragboard.prototype.show = function (iwidget_alternative) {
    this.alternatives.showAlternative(iwidget_alternative);
};

MobileDragboard.prototype._updateIWidgetInfo = function (iwidget) {
    this.toolbar.setTitle(iwidget.name);
};
