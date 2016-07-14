/*
 *     Copyright (c) 2012-2014 Universidad Politécnica de Madrid
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

"use strict";

var LegalPainter = function(legal_structure_element, dom_element){
    this.legal_template_element = legal_structure_element;
    this.legal_template = new Wirecloud.Utils.Template(this.legal_template_element);
    this.dom_element = dom_element;

    this.paint = function paint(resource) {
        var resource_html,legal,i,legal_element,resource_element, clause_painter;
		
        this.dom_element.innerHTML = '';
        legal=resource.getLegal();

        if (legal.length > 0) {
            for(i = 0 ; i<legal.length ; i += 1 ){
                legal_element=legal[i];

                resource_html = {
                    "title":legal_element.label,
                    "description":legal_element.description
                };
                resource_element = document.createElement('div');
                resource_element.className="legal_resource";
                resource_element.innerHTML = this.legal_template.evaluate(resource_html);
                clause_painter = new ClausePainter(Wirecloud.currentTheme.templates['wirecloud/fiware/marketplace/legal/legal_clause_template'], resource_element.getElementsByClassName('clause_list')[0]);
                clause_painter.paint(legal_element.clauses);

                this.dom_element.appendChild(resource_element);
           }
        } else {
            resource_element = document.createElement('div'); 
            resource_element.className="legal_resource";
            resource_element.innerHTML ='<div><h3>Legal Conditions</h3><div class="tab_info">No legal conditions has been defined</div></div>';
            this.dom_element.appendChild(resource_element);
        }              

    };
};

var ClausePainter = function ClausePainter(clause_structure_element, dom_element) {
    this.clause_template_element = clause_structure_element;
    this.clause_template = new Wirecloud.Utils.Template(this.clause_template_element);
    this.dom_element = dom_element;

    this.paint = function paint(resource) {
        var resource_html, i, clause_element, resource_element;

        this.dom_element.innerHTML = '';
		
        for (i = 0; i < resource.length; i += 1){
            clause_element = resource[i];

            resource_html = {
                "name": clause_element.name,
                "text": clause_element.text
            };
            resource_element = document.createElement('div');
            resource_element.className="clause_resource";
            resource_element.innerHTML = this.clause_template.evaluate(resource_html);

            this.dom_element.appendChild(resource_element);
        }
    };
};

var SlaPainter = function(sla_structure_element, dom_element){
    this.sla_template_element = sla_structure_element;
    this.sla_template = new Wirecloud.Utils.Template(this.sla_template_element);
    this.dom_element = dom_element;

    this.paint = function paint(resource) {
        var resource_html,sla,i,sla_element,resource_element, expresion_painter;
		
        this.dom_element.innerHTML = '';
        sla = resource.sla;

        if (sla.length > 0) {
            for(i = 0 ; i<sla.length ; i += 1 ){
                sla_element=sla[i];
                
                resource_html = {
                    "type":sla_element.type,
                    "title":sla_element.name,
                    "description":sla_element.description,
                    "obligated":sla_element.obligatedParty
                };
                resource_element = document.createElement('div');
                resource_element.className="sla_resource";
                resource_element.innerHTML = this.sla_template.evaluate(resource_html);
                expresion_painter = new ExpresionPainter(Wirecloud.currentTheme.templates['wirecloud/fiware/marketplace/sla/sla_expresion_template'], resource_element.getElementsByClassName('expresions_list')[0]);
                expresion_painter.paint(sla_element.slaExpresions);

                this.dom_element.appendChild(resource_element);
            }
        } else {
            resource_element = document.createElement('div'); 
            resource_element.className="sla_resource";
            resource_element.innerHTML ='<div><h3>Service level agreement</h3><div class="tab_info">No service level agreement has been defined</div></div>';
            this.dom_element.appendChild(resource_element);
        }  

    };
};

var ExpresionPainter = function(expresion_structure_element, dom_element){
    this.expresion_template_element = expresion_structure_element;
    this.expresion_template = new Wirecloud.Utils.Template(this.expresion_template_element);
    this.dom_element = dom_element;

    this.paint = function paint(resource) {
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
            resource_element.className="slaExpresion_resource";
            resource_element.innerHTML = this.expresion_template.evaluate(resource_html);
            variable_painter = new VariablePainter(Wirecloud.currentTheme.templates['wirecloud/fiware/marketplace/sla/sla_variable_template'], resource_element.getElementsByClassName('variable_list')[0]);

            if ('location' in slaExpresion_element) {
                slaExpresion_element.variables.push({
                    'label': 'Centre',
                    'value': 'UTM X:' + slaExpresion_element.location.coordinates.lat + ', UTM Y:' + slaExpresion_element.location.coordinates.long,
                    'type': '',
                    'unit': ''
                });
            }
            variable_painter.paint(slaExpresion_element.variables);

            this.dom_element.appendChild(resource_element);
	
        }   

    };
};

var VariablePainter = function(variable_structure_element, dom_element){
    this.variable_template_element = variable_structure_element;
    this.variable_template = new Wirecloud.Utils.Template(this.variable_template_element);
    this.dom_element = dom_element;

    this.paint = function paint(resource) {
        var resource_html,i,variable_element,resource_element;

        this.dom_element.innerHTML = '';

        for(i=0; i<resource.length; i += 1){
            variable_element = resource[i];

            resource_html = {
                "title": variable_element.label,
                "type": variable_element.type,
                "value": variable_element.value,
                "unit": variable_element.unit,
            };
            resource_element = document.createElement('div');
            resource_element.className="slaVariable_resource";
            resource_element.innerHTML = this.variable_template.evaluate(resource_html);

            this.dom_element.appendChild(resource_element);
        }
    };
};

var PricingPainter = function(pricing_structure_element, dom_element){
    this.pricing_template_element = pricing_structure_element;
    this.pricing_template = new Wirecloud.Utils.Template(this.pricing_template_element);
    this.dom_element = dom_element;

    this.paint = function paint(resource) {
        var resource_html,i,pricing,pricing_element,resource_element,
        pricing_component_painter,tax_painter;

        this.dom_element.innerHTML = '';
        pricing = resource.pricing;
        
        if(pricing.length > 0) {
            for(i=0; i<pricing.length; i += 1){
                pricing_element = pricing[i];

            resource_html = {
                "title": pricing_element.label,
                "description": pricing_element.description
	        };
            resource_element = document.createElement('div');
            resource_element.className="pricing_resource";
            resource_element.innerHTML = this.pricing_template.evaluate(resource_html);

            if ('priceComponents' in pricing_element && pricing_element.priceComponents.length > 0 && pricing_element.priceComponents[0].title !== '') {
                pricing_component_painter = new PriceElementPainter(Wirecloud.currentTheme.templates['wirecloud/fiware/marketplace/pricing/price_component_template'], resource_element.getElementsByClassName('price_components_list')[0]);
                pricing_component_painter.paint(pricing_element.priceComponents);
            }

            if ('taxes' in pricing_element && pricing_element.taxes.length > 0 && pricing_element.taxes[0].title !== '') {
                tax_painter = new PriceElementPainter(Wirecloud.currentTheme.templates['wirecloud/fiware/marketplace/pricing/price_component_template'], resource_element.getElementsByClassName('taxes_list')[0]);
                tax_painter.paint(pricing_element.taxes);
            }

            this.dom_element.appendChild(resource_element);
	    }
        }else{
            resource_element = document.createElement('div'); 
            resource_element.className="pricing_resource";
            resource_element.innerHTML ='<div><h3>Price plan</h3><div class="tab_info">No price plan has been defined, the widget is for free</div></div>';
            this.dom_element.appendChild(resource_element);
        }
    };
};

var PriceElementPainter = function(price_structure_element, dom_element){
    this.price_template_element = price_structure_element;
    this.price_template = new Wirecloud.Utils.Template(this.price_template_element);
    this.dom_element = dom_element;

    this.paint = function paint(resource) {
        var resource_html,i,price_element,resource_element;

        this.dom_element.innerHTML = '';

        for(i=0; i<resource.length; i += 1){
            price_element = resource[i];

            resource_html = {
                "title": price_element.title,
                "description": price_element.description,
                "currency": price_element.currency,
                "value": price_element.value,
                "unit": price_element.unit,
            };
            resource_element = document.createElement('div');
            resource_element.className="price_element_resource";
            resource_element.innerHTML = this.price_template.evaluate(resource_html);

            this.dom_element.appendChild(resource_element);
        }
    };
};
