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

/*global Wirecloud*/

StyledElements.NavigationHeader = function (options) {

    var defaultOptions = {
        'backButton': 'Back',
        'class': '',
        'title': '',
        'extraButton': null
    };
    options = Wirecloud.Utils.merge(defaultOptions, options);

    StyledElements.StyledElement.call(this, ['back']);

    this.wrapperElement = document.createElement('div');
    this.wrapperElement.className = Wirecloud.Utils.appendWord(options['class'], "toolbar");

    this.backButton = document.createElement('div');
    this.backButton.setAttribute('class', 'back_button');
    this.backButton.addEventListener('click', function () {
        this.events['back'].dispatch();
    }.bind(this));
    buttonSpan = document.createElement('span');
    buttonSpan.className = 'menu_text';
    buttonSpan.textContent = options.backButton;
    this.backButton.appendChild(buttonSpan);
    this.wrapperElement.appendChild(this.backButton);

    this.titleElement = document.createElement('h1');
    this.titleElement.textContent = options.title;
    this.wrapperElement.appendChild(this.titleElement);

    if (options.extraButton) {
        this.wrapperElement.appendChild(options.extraButton);
    }
}
StyledElements.NavigationHeader.prototype = new StyledElements.StyledElement();

StyledElements.NavigationHeader.prototype.setTitle = function (title) {
    this.titleElement.textContent = title;
};
