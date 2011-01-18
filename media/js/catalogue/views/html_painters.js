/* 
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */

var HTML_Painter = function () {
    this.dom_element = null;
}

HTML_Painter.prototype.set_dom_element = function (dom_element) {
    this.dom_element = dom_element;
}

HTML_Painter.prototype.set_dom_wrapper = function (dom_wrapper) {
    this.dom_wrapper = dom_wrapper;
}

HTML_Painter.prototype.paint = function (command, user_command_manager) { }

HTML_Painter.prototype.get_popularity_html = function (popularity) {
    var on_stars = Math.floor(popularity);
    var md_star = popularity - on_stars;
    var off_stars = 5 - popularity;

    var result_html = '';

    // "On" stars
    for (var i=0; i<on_stars; i++) {
        result_html += '<a class="on"></a>';
    }

    if (md_star) {
        result_html += '<a class="md"></a>';
    }

    // "Off" stars
    for (var i=0; i<Math.floor(off_stars); i++) {
        result_html += '<a class="off"></a>';
    }

    return result_html;
}
