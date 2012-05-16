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

/*jslint white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global alert, Constants, Element, document, gettext, interpolate, LayoutManagerFactory, Template */
"use strict";

var PartsPainter = function(catalogue, part_structure_element, dom_element){
	this.catalogue=catalogue;
	this.part_template_element = part_structure_element;
    this.part_template = new Template(this.part_template_element);
    this.dom_element = dom_element;

	this.paint = function(resource){
		var resource_html,parts,i,parts_element,resource_element;
		
		this.dom_element.innerHTML = '';
		parts=resource.getParts();
		
		for(i = 0 ; i<parts.length ; i += 1 ){
			parts_element=parts[i];

			resource_html = {
            	"name":parts_element.name,
				"uri":parts_element.uri
        	};
			resource_element = document.createElement('div');
			Element.extend(resource_element);
			resource_element.className="part_resource";
			resource_element.update(this.part_template.evaluate(resource_html));
			this.dom_element.appendChild(resource_element)
		}
	};
};

var LegalPainter = function(catalogue, legal_structure_element, dom_element){
	this.catalogue=catalogue;
	this.legal_template_element = legal_structure_element;
    this.legal_template = new Template(this.legal_template_element);
    this.dom_element = dom_element;

	this.paint = function(resource){
		var resource_html,legal,i,legal_element,resource_element, clause_painter;
		
		this.dom_element.innerHTML = '';
		legal=resource.getLegal();
		
		for(i = 0 ; i<legal.length ; i += 1 ){
			legal_element=legal[i];

			resource_html = {
            	"type":legal_element.type,
				"title":legal_element.label,
				"description":legal_element.description
        	};
			resource_element = document.createElement('div');
			Element.extend(resource_element);
			resource_element.className="legal_resource";
			resource_element.update(this.legal_template.evaluate(resource_html));
			clause_painter = new ClausePainter(this.catalogue,$("legal_clause_template").getTextContent(),resource_element.getElementsByClassName('clause_list')[0]);
			clause_painter.paint(legal_element.clauses);

			this.dom_element.appendChild(resource_element)
			
		}

	}
};

var ClausePainter = function(catalogue,clause_structure_element, dom_element){
	this.catalogue = catalogue;
	this.clause_template_element = clause_structure_element;
	this.clause_template = new Template(this.clause_template_element);
	this.dom_element = dom_element;

	this.paint = function(resource){
		var resource_html,clauses,i,clause_element,resource_element;

		this.dom_element.innerHTML = '';
		
		for(i=0; i<resource.length; i += 1){
			clause_element = resource[i];

			resource_html={
				"name":clause_element.name,
				"text":clause_element.text
			}
			resource_element = document.createElement('div');
			Element.extend(resource_element);
			resource_element.className="clause_resource";
			resource_element.update(this.clause_template.evaluate(resource_html));

			this.dom_element.appendChild(resource_element)
		}
	}
};

var SlaPainter = function(catalogue, sla_structure_element, dom_element){
	this.catalogue=catalogue;
	this.sla_template_element = sla_structure_element;
    this.sla_template = new Template(this.sla_template_element);
    this.dom_element = dom_element;

	this.paint = function(resource){
		var resource_html,sla,i,sla_element,resource_element, expresion_painter;
		
		this.dom_element.innerHTML = '';
		sla=resource.getSla();
		
		for(i = 0 ; i<sla.length ; i += 1 ){
			sla_element=sla[i];

			resource_html = {
            	"type":sla_element.type,
				"title":sla_element.name,
				"description":sla_element.description,
				"obligated":sla_element.obligatedParty
        	};
			resource_element = document.createElement('div');
			Element.extend(resource_element);
			resource_element.className="sla_resource";
			resource_element.update(this.sla_template.evaluate(resource_html));
			expresion_painter = new ExpresionPainter(this.catalogue,$("sla_expresion_template").getTextContent(),resource_element.getElementsByClassName('expresions_list')[0]);
			expresion_painter.paint(sla_element.slaExpresions);

			this.dom_element.appendChild(resource_element)
			
		}

	}
};

var ExpresionPainter = function(catalogue, expresion_structure_element, dom_element){
	this.catalogue=catalogue;
	this.expresion_template_element = expresion_structure_element;
    this.expresion_template = new Template(this.expresion_template_element);
    this.dom_element = dom_element;

	this.paint = function(resource){
		var resource_html,slaExpresion,i,slaExpresion_element,resource_element, variable_painter;
		
		this.dom_element.innerHTML = '';
		slaExpresion=resource;
		
		for(i = 0 ; i<slaExpresion.length ; i += 1 ){
			slaExpresion_element=slaExpresion[i];

			resource_html = {
				"title":slaExpresion_element.name,
				"description":slaExpresion_element.description
        	};
			resource_element = document.createElement('div');
			Element.extend(resource_element);
			resource_element.className="slaExpresion_resource";
			resource_element.update(this.expresion_template.evaluate(resource_html));
			variable_painter = new VariablePainter(this.catalogue,$("sla_variable_template").getTextContent(),resource_element.getElementsByClassName('variable_list')[0]);
			variable_painter.paint(slaExpresion_element.variables);

			this.dom_element.appendChild(resource_element)
			
		}

	}
};

var VariablePainter = function(catalogue,variable_structure_element, dom_element){
	this.catalogue = catalogue;
	this.variable_template_element = variable_structure_element;
	this.variable_template = new Template(this.variable_template_element);
	this.dom_element = dom_element;

	this.paint = function(resource){
		var resource_html,i,variable_element,resource_element;

		this.dom_element.innerHTML = '';
		
		for(i=0; i<resource.length; i += 1){
			variable_element = resource[i];

			resource_html={
				"title":variable_element.label,
				"type":variable_element.type,
				"value":variable_element.value,
				"unit":variable_element.unit,
			}
			resource_element = document.createElement('div');
			Element.extend(resource_element);
			resource_element.className="slaVariable_resource";
			resource_element.update(this.variable_template.evaluate(resource_html));

			this.dom_element.appendChild(resource_element)
		}
	}
};

var PricingPainter = function(catalogue,pricing_structure_element, dom_element){
	this.catalogue = catalogue;
	this.pricing_template_element = pricing_structure_element;
	this.pricing_template = new Template(this.pricing_template_element);
	this.dom_element = dom_element;

	this.paint = function(resource){
		var resource_html,i,pricing,pricing_element,resource_element,
		pricing_component_painter,tax_painter;

		this.dom_element.innerHTML = '';
		pricing=resource.getPricing();

		for(i=0; i<pricing.length; i += 1){
			pricing_element = pricing[i];

			resource_html={
				"title":pricing_element.label,
				"description": pricing_element.description
			}
			resource_element = document.createElement('div');
			Element.extend(resource_element);
			resource_element.className="pricing_resource";
			resource_element.update(this.pricing_template.evaluate(resource_html));

			pricing_component_painter = new PriceElementPainter(this.catalogue,$("price_component_template").getTextContent(),resource_element.getElementsByClassName('price_components_list')[0]);
			pricing_component_painter.paint(pricing_element.priceComponents);
			tax_painter = new PriceElementPainter(this.catalogue,$("price_component_template").getTextContent(),resource_element.getElementsByClassName('taxes_list')[0]);
			tax_painter.paint(pricing_element.taxes);

			this.dom_element.appendChild(resource_element)
		}
	}
};

var PriceElementPainter = function(catalogue,price_structure_element, dom_element){
	this.catalogue = catalogue;
	this.price_template_element = price_structure_element;
	this.price_template = new Template(this.price_template_element);
	this.dom_element = dom_element;

	this.paint = function(resource){
		var resource_html,i,price_element,resource_element;

		this.dom_element.innerHTML = '';
		
		for(i=0; i<resource.length; i += 1){
			price_element = resource[i];

			resource_html={
				"title":price_element.title,
				"description":price_element.description,
				"currency":price_element.currency,
				"value":price_element.value,
				"unit":price_element.unit,
			}
			resource_element = document.createElement('div');
			Element.extend(resource_element);
			resource_element.className="price_element_resource";
			resource_element.update(this.price_template.evaluate(resource_html));

			this.dom_element.appendChild(resource_element)
		}
	}
};
