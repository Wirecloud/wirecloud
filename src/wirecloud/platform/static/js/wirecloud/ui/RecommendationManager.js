/*
 *     Copyright 2013-2014 (c) CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright 2013-2014 (c) Center for Open Middleware
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

/*global Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /**
     * RecommendationManager Class
     */
    var RecommendationManager = function RecommendationManager() {

        // Basic Recommendation like the old Friendcode. Always Available.
        this.basic = new Wirecloud.ui.BasicRecommendations();

        // List with all wiringEditor anchors
        this.fullAnchorList = [];

        // While semantic is loading or unavailable, basic recommendations  is active
        this.recommendations = this.basic;

        // While semantic is loading or unavailable, semantic is Unavailable
        this.semanticAvailable = false;

        // Activated when an arrow is being created
        this.recommendationsActivated = false;
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * Init
     */
    RecommendationManager.prototype.init = function init(iwidgets, availableOperators) {
        var i, url, entitiesIds, iwidget, onSuccess, onFailure;

        // Semantic Status
        this.semanticStatus = {};
        this.initIwidgets = iwidgets;
        this.initAvailableOperators = availableOperators;
        this.semanticAvailable = false;

        if (Wirecloud.URLs.SEMANTIC_MATCHING_SERVICE) {
            url = Wirecloud.URLs.SEMANTIC_MATCHING_SERVICE + Wirecloud.contextManager.get('username');

            onSuccess = function (res) {
                // Semantic Recommendations available
                this.semanticStatus = JSON.parse(res.responseText);

                // Semantic Recommendation
                this.semantic = new Wirecloud.ui.SemanticRecommendations(this.semanticStatus, this.initIwidgets, this.initAvailableOperators);

                // Add all anchors to Semantic Recommendations
                for (i = 0; i < this.fullAnchorList.length; i += 1) {
                    this.semantic.add_anchor_to_recommendations(this.fullAnchorList[i]);
                }

                // Semantic is Available
                this.semanticAvailable = true;
                this.recommendations = this.semantic;
            };

            onFailure = function onFailure() {
                // Semantic is Unavailable
            };

            Wirecloud.io.makeRequest(url, {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'},
                contentType: 'application/json',
                onSuccess: onSuccess.bind(this),
                onFailure: onFailure.bind(this)
            });
        }

    };

    /**
     * Add anchor in AnchorsByFriendCode.
     */
    RecommendationManager.prototype.add_anchor_to_recommendations = function add_anchor_to_recommendations(anchor) {
        // Add anchor to the fullAnchorList
        this.fullAnchorList.push(anchor);

        // Basic recommendations will be always available
        this.basic.add_anchor_to_recommendations(anchor);

        // Only if the semantic recommendations are fully loaded.
        if (this.semanticAvailable) {
            this.semantic.add_anchor_to_recommendations(anchor);
        }
    };

    /**
     * Remove anchor in AnchorsByFriendCode.
     */
    RecommendationManager.prototype.remove_anchor_to_recommendations = function remove_anchor_to_recommendations(anchor) {
        // Remove anchor to the fullAnchorList
        this.fullAnchorList.splice(this.fullAnchorList.indexOf(anchor), 1);

        // Basic recommendations will be always available
        this.basic.remove_anchor_to_recommendations(anchor);

        // Only if the semantic recommendations are fully loaded.
        if (this.semanticAvailable) {
            this.semantic.remove_anchor_to_recommendations(anchor);
        }
    };

    /**
     * Emphasize anchors.
     */
    RecommendationManager.prototype.emphasize = function emphasize(anchor, isCreatingArrow) {
        if (!this.recommendationsActivated) {
            // Activate recommendations for the anchor
            this.recommendations.emphasize(anchor);
            if (isCreatingArrow) {
                this.recommendationsActivated = true;
            }
        }
    };

    /**
     * Deemphasize anchors.
     */
    RecommendationManager.prototype.deemphasize = function deemphasize(anchor, createArrowEnded) {
        if (createArrowEnded) {
            this.recommendationsActivated = false;
        }
        if (!this.recommendationsActivated) {
            // Deactivate recommendations for the anchor
            this.recommendations.deemphasize(anchor);

        }
    };

    /**
     * Activate Basic Recommendations
     */
    RecommendationManager.prototype.changeToBasicRecommendations = function changeToBasicRecommendations() {
        this.recommendations = this.basic;
    };

    /**
     * Activate Semantic Recommendations if is posible
     */
    RecommendationManager.prototype.changeToSemanticRecommendations = function changeToSemanticRecommendations() {
        if (this.semanticAvailable) {
            this.recommendations = this.semantic;
        }
    };

    /**
     * Destroy
     */
    RecommendationManager.prototype.destroy = function destroy() {
        this.fullAnchorList = [];
        this.recommendations = null;
        this.basic.destroy();
        if (this.semanticAvailable) {
            this.semantic.destroy();
        }

    };

    /*************************************************************************
     * Make BasicRecommendations public
     *************************************************************************/
    Wirecloud.ui.RecommendationManager = RecommendationManager;

})();
