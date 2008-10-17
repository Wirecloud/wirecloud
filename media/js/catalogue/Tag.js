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


function Tag(tagJSON_)
{
	var state = new StateTag(tagJSON_);
	
	this.getIdentifier = function() { return state.getIdentifier(); }
	this.getValue = function() { return state.getValue(); }
	this.getAdded_by = function() { return state.getAdded_by(); }
	this.getAppearances = function() { return state.getAppearances(); }
	
    this.tagToHTML = function(){
        var link = UIUtils.createHTMLElement("a", $H({
            title: gettext('Search by ') + state.getValue(),
            innerHTML: state.getValue()
        }));
        link.observe("click", function(event){
            UIUtils.searchByTag(URIs.GET_RESOURCES_SIMPLE_SEARCH, state.getValue());
        });
        return link;
    }
	
	this.tagToTypedHTML = function() {
		var option = arguments[0] || {tags:'undefined'};
		
		var className_;
		if (state.getAppearances()<5) className_ = 'tag_type_1';
		else if (state.getAppearances()<15) className_ = 'tag_type_2';
		else if (state.getAppearances()<25) className_ = 'tag_type_3';
		else className_ = 'tag_type_4';
		
		var title_ = gettext('Search by ') + state.getValue();
		var value_ =  state.getValue() + ((option.tags == 'undefined')?" (" + state.getAppearances() + ")":"");
		
		var link = UIUtils.createHTMLElement("a", $H({ class_name: className_, title: title_, innerHTML: value_ }));
		link.observe("click", function(event) {
			UIUtils.searchByTag(URIs.GET_RESOURCES_SIMPLE_SEARCH, state.getValue());
		});
		return link;
	}
	
	this.equals = function(tag_) {
		return ((tag_.getValue() == state.getValue()) && (tag_.getAppearances() == state.getAppearances()));
	}
	
	this.compareTo = function(tag_) {
		if (state.getAppearances() < (tag_.getAppearances())) return -1;
		else if	(state.getAppearances() > (tag_.getAppearances())) return 1;
		else return 0;
	}
}

function StateTag(tagJSON_) 
{
	var identifier = tagJSON_.id;
    var value = tagJSON_.value;
	var appearances = tagJSON_.appearances;
	var added_by = tagJSON_.added_by;
	
	this.getIdentifier = function() {return identifier;}
	this.getValue = function() { return value; }
	this.getAppearances = function() { return appearances; } 
	this.getAdded_by = function() { return added_by; }
}
