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
     * BasicRecommendations Class
     */
    var BasicRecommendations = function BasicRecommendations() {
        this.sourceAnchorsByFriendCode = {};
        this.targetAnchorsByFriendCode = {};
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /**
     * Highlight anchor.
     */
    var highlightAnchorLabel = function highlightAnchorLabel(anchor) {
        anchor.wrapperElement.parentNode.classList.add('highlight');
    };

    /**
     * Unhighlight anchor.
     */
    var unhighlightAnchorLabel = function unhighlightAnchorLabel(anchor) {
        anchor.wrapperElement.parentNode.classList.remove('highlight');
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * Add anchor in AnchorsByFriendCode.
     */
    BasicRecommendations.prototype.add_anchor_to_recommendations = function(anchor) {
        var friendCode;

        friendCode = anchor.context.data.friendcode;
        if (anchor instanceof Wirecloud.ui.WiringEditor.SourceAnchor) {
            if (this.sourceAnchorsByFriendCode[friendCode] == null) {
                this.sourceAnchorsByFriendCode[friendCode] = [];
            }
            this.sourceAnchorsByFriendCode[friendCode].push(anchor);
        } else {
            if (this.targetAnchorsByFriendCode[friendCode] == null) {
                this.targetAnchorsByFriendCode[friendCode] = [];
            }
            this.targetAnchorsByFriendCode[friendCode].push(anchor);
        }
    };

    /**
     * Remove anchor in AnchorsByFriendCode.
     */
    BasicRecommendations.prototype.remove_anchor_to_recommendations = function(anchor) {
        var anchorList;

        if (anchor instanceof Wirecloud.ui.WiringEditor.SourceAnchor) {
            anchorList = this.sourceAnchorsByFriendCode[anchor.context.data.friendcode];
            anchorList.splice(anchorList.indexOf(anchor), 1);
        } else {
            anchorList = this.targetAnchorsByFriendCode[anchor.context.data.friendcode];
            anchorList.splice(anchorList.indexOf(anchor), 1);
        }
    };

    /**
     * Emphasize anchors.
     */
    BasicRecommendations.prototype.emphasize = function emphasize(anchor) {
        var friendCode, anchors, i;

        anchor.wrapperElement.parentNode.classList.add('highlight_main');
        friendCode = anchor.context.data.friendcode;
        if (anchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            anchors = this.sourceAnchorsByFriendCode[friendCode];
        } else {
            anchors = this.targetAnchorsByFriendCode[friendCode];
        }
        if (anchors != null) {
            for (i = 0; i < anchors.length; i += 1) {
                if (anchor.context.iObject.getId() != anchors[i].context.iObject.getId()) {
                    highlightAnchorLabel(anchors[i]);
                }
            }
        }
    };

    /**
     * Deemphasize anchors.
     */
    BasicRecommendations.prototype.deemphasize = function deemphasize(anchor) {
        var friendCode, anchors, i;

        anchor.wrapperElement.parentNode.classList.remove('highlight_main');
        friendCode = anchor.context.data.friendcode;
        if (anchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            anchors = this.sourceAnchorsByFriendCode[friendCode];
        } else {
            anchors = this.targetAnchorsByFriendCode[friendCode];
        }
        if (anchors != null) {
            for (i = 0; i < anchors.length; i += 1) {
                if (anchor.context.iObject.getId() != anchors[i].context.iObject.getId()) {
                    unhighlightAnchorLabel(anchors[i]);
                }
            }
        }
    };

    /**
     * Destroy
     */
    BasicRecommendations.prototype.destroy = function destroy() {
        this.sourceAnchorsByFriendCode = {};
        this.targetAnchorsByFriendCode = {};
    };

    /*************************************************************************
     * Make BasicRecommendations public
     *************************************************************************/
    Wirecloud.ui.BasicRecommendations = BasicRecommendations;
})();
