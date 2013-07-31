/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2013 Center for Open Middleware
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

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /**
     * SemanticRecommendations Class
     */
    var SemanticRecommendations = function SemanticRecommendations(semanticStatus, iwidgets, availableOperators) {
        var entitiesIds, iwidget;

        this.recommendations = {};
        this.anchorsInvolved = {};
        this.semanticStatus = semanticStatus;

        // Get all entities ID
        entitiesIds = [];
        for (var i = 0; i < iwidgets.length; i++) {
            iwidget = iwidgets[i];
            // Dont repeat any iwidget.
            if (entitiesIds.indexOf(iwidget.widget.id) == -1) {
                entitiesIds.push(iwidget.widget.id);
            }
        }
        for (var key in availableOperators) {
            entitiesIds.push(availableOperators[key].uri);
        }
        refactorSemanticInfo.call(this, entitiesIds);
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /**
     * Refactor semantic information.
     */
    var refactorSemanticInfo = function refactorSemanticInfo(entitiesIds) {
        var matchings, i, origin, destination, matchCode, originEndpoint, destinationEndpoint, match;

        matchings = this.semanticStatus.matchings;

        for (i = 0; i < matchings.length; i += 1) {
            match = matchings[i].origin.split('/');
            origin = match.slice(0,3).join('/');
            originEndpoint = match.slice(3, match.length).join('/');
            match = matchings[i].destination.split('/');
            destination = match.slice(0,3).join('/');
            destinationEndpoint = match.slice(3, match.length).join('/');
            matchCode = matchings[i].matchCode;
            if ((entitiesIds.indexOf(origin) == -1) || (entitiesIds.indexOf(destination) == -1)) {
                continue;
            }
            if (!this.recommendations.hasOwnProperty(origin)) {
                this.recommendations[origin] = {};
            }
            if (this.recommendations[origin][originEndpoint] == null) {
                this.recommendations[origin][originEndpoint] = [];
            }
            this.recommendations[origin][originEndpoint].push({'destination': destination,
                                                            'destinationEndpoint': destinationEndpoint,
                                                            'matchCode': matchCode});

            // Bidirectional relationships
            if (!this.recommendations.hasOwnProperty(destination)) {
                this.recommendations[destination] = {};
            }
            if (this.recommendations[destination][destinationEndpoint] == null) {
                this.recommendations[destination][destinationEndpoint] = [];
            }
            this.recommendations[destination][destinationEndpoint].push({'destination': origin,
                                                                      'destinationEndpoint': originEndpoint,
                                                                      'matchCode': matchCode});
        }
    };

    /**
     * is empty object?
     */
    var isEmpty = function isEmpty(obj) {
        for(var key in obj) {
            return false;
        }
        return true;
    };

    /**
     * Get Recommendations
     */
    var getRecommendations = function getRecommendations(anchor, widgetId, anchorId, isEmphasized) {
        var mainAnchorClass, mainAnchorRef, recommendations, recTag, keyValues, anchorList, anchorListFiltered, i;

        keyValues = {'NONE': 0, 'OVERLAP': 1, 'SUBSUMES': 2, 'SUBSUMED': 3, 'HASPART': 4, 'DISJOINT': 5, 'EQUIVALENT': 6};
        recommendations = {};
        mainAnchorRef = 0;
        mainAnchorClass = 'NONE';
        for (recTag in this.anchorsInvolved) {
            if (this.anchorsInvolved[recTag][widgetId] != null &&
                    this.anchorsInvolved[recTag][widgetId][anchorId] != null) {
                anchorList = this.anchorsInvolved[recTag][widgetId][anchorId];
                anchorListFiltered = [];
                for (i = 0; i< anchorList.length; i += 1) {
                    if (anchorList[i].context.iObject != anchor.context.iObject){
                        // Only if the anchor and anchorList[i] are not part of the same widget
                        anchorListFiltered[i] = anchorList[i];
                    }
                }
                if (!isEmpty(anchorListFiltered) && (mainAnchorRef < keyValues[recTag])) {
                    mainAnchorRef = keyValues[recTag];
                    mainAnchorClass = recTag;
                }
                recommendations[recTag] = anchorListFiltered;
            }
        }
        if (isEmphasized) {
            unhighlightAnchorLabel(anchor, mainAnchorClass);
        } else {
            highlightAnchorLabel(anchor, mainAnchorClass);
        }
        return recommendations;
    };

    /**
     * Highlight Recommendations
     */
    var highlightRecommendations = function highlightRecommendations(recHash) {
        var i, key;

        for (key in recHash){
            for (i = 0; i < recHash[key].length; i += 1) {
                highlightAnchorLabel(recHash[key][i], key);
            }
        }
    };

    /**
     * Unhighlight Recommendations
     */
    var unhighlightRecommendations = function unhighlightRecommendations(recHash) {
        var i, key;

        for (key in recHash){
            for (i = 0; i < recHash[key].length; i += 1) {
                unhighlightAnchorLabel(recHash[key][i], key);
            }
        }
    };

    /**
     * Highlight anchor.
     */
    var highlightAnchorLabel = function highlightAnchorLabel(anchor, matchCode) {
        var code;

        code = matchCode.toLowerCase();
        anchor.wrapperElement.parentNode.classList.add('highlight');
        anchor.wrapperElement.parentNode.classList.add(code);
    };

    /**
     * Unhighlight anchor.
     */
    var unhighlightAnchorLabel = function unhighlightAnchorLabel(anchor, matchCode) {
        var code;

        code = matchCode.toLowerCase();
        anchor.wrapperElement.parentNode.classList.remove('highlight');
        anchor.wrapperElement.parentNode.classList.remove(code);
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * Add anchor in recomendations.
     */
    SemanticRecommendations.prototype.add_anchor_to_recommendations = function add_anchor_to_recommendations(anchor) {
        var rec, anchors, i, entityId, anchorId;

        // Semantic recomendations avaible
        if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            entityId = anchor.context.iObject.iwidget.widget.id;
            anchorId = anchor.context.data.name;
        } else {
            entityId = anchor.context.iObject.ioperator.meta.uri;
            anchorId = anchor.context.data.name;
        }
        for (rec in this.recommendations) {
            for (anchors in this.recommendations[rec]) {
                for (i = 0; i < this.recommendations[rec][anchors].length; i += 1) {
                    if ((this.recommendations[rec][anchors][i].destination == entityId) &&
                        (this.recommendations[rec][anchors][i].destinationEndpoint == anchorId)) {
                        if (this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode] == null) {
                            this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode] = {};
                        }
                        if (this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec] == null) {
                            this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec] = {};
                        }
                        if (this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors] == null) {
                            this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors] = [];
                        }
                        this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors].push(anchor);
                    }
                }
            }
        }
    };

    /**
     * Remove anchor in recomendations.
     */
    SemanticRecommendations.prototype.remove_anchor_to_recommendations = function remove_anchor_to_recommendations(anchor) {
        var rec, anchors, i, entityId, anchorId, mc, entity, endpoint, index;

        // Semantic recomendations avaible
        if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            entityId = anchor.context.iObject.iwidget.widget.id;
            if (anchor.context.data.vardef) {
                anchorId = anchor.context.data.vardef.name;
            } else {
                anchorId = anchor.context.data.name;
            }
        } else {
            entityId = anchor.context.iObject.ioperator.meta.uri;
            if (anchor.context.data.vardef) {
                anchorId = anchor.context.data.vardef.name;
            } else {
                anchorId = anchor.context.data.name;
            }
        }
        // Semantic recommendations
        for (rec in this.recommendations) {
            for (anchors in this.recommendations[rec]) {
                for (i = 0; i < this.recommendations[rec][anchors].length; i += 1) {
                    if ((this.recommendations[rec][anchors][i].destination == entityId) &&
                        (this.recommendations[rec][anchors][i].destinationEndpoint == anchorId)) {
                        index = this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors].indexOf(anchor);
                        this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors].splice(index, 1);
                        }
                }
            }
        }
        // Cleaning
        for (mc in this.anchorsInvolved) {
            for (entity in this.anchorsInvolved[mc]) {
                for (endpoint in this.anchorsInvolved[mc][entity]) {
                    if (this.anchorsInvolved[mc][entity][endpoint].length === 0) {
                        delete this.anchorsInvolved[mc][entity][endpoint];
                    }
                }
                if (isEmpty(this.anchorsInvolved[mc][entity])) {
                    delete this.anchorsInvolved[mc][entity];
                }
            }
        }
    };

    /**
     * Emphasize anchors.
     */
    SemanticRecommendations.prototype.emphasize = function emphasize(anchor) {
        var rec, widgetId, anchorId;

        // Semantic Recommendations Mode
        if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.OperatorInterface) {
            widgetId = anchor.context.iObject.ioperator.meta.uri;
        } else if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            widgetId = anchor.context.iObject.iwidget.widget.id;
        }
        anchorId = anchor.context.data.name;
        rec = getRecommendations.call(this, anchor, widgetId, anchorId, false);
        highlightRecommendations(rec);
    };

    /**
     * Deemphasize anchors.
     */
    SemanticRecommendations.prototype.deemphasize = function deemphasize(anchor) {
        var rec, widgetId, anchorId;

        // Semantic Recommendations Mode
        if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.OperatorInterface) {
            widgetId = anchor.context.iObject.ioperator.meta.uri;
        } else if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            widgetId = anchor.context.iObject.iwidget.widget.id;
        }
        anchorId = anchor.context.data.name;
        rec = getRecommendations.call(this, anchor, widgetId, anchorId, true);
        unhighlightRecommendations(rec);
    };

    /**
     * Destroy
     */
    SemanticRecommendations.prototype.destroy = function destroy() {
        this.recommendations = null;
        this.anchorsInvolved = null;
    };

    /*************************************************************************
     * Make SemanticRecommendations public
     *************************************************************************/
    Wirecloud.ui.SemanticRecommendations = SemanticRecommendations;
})();
