/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements*/

(function () {

    "use strict";

    /**
     * El componente Styled Alternatives permite guardar una colección de
     * contenedores, de los cuales sólo uno estará visible en el area asociada al
     * componente Alternatives.
     */
    var StyledAlternatives = function StyledAlternatives(options) {
        var defaultOptions = {
            'class': '',
            'full': true,
            'defaultEffect': 'None'
        };

        options = StyledElements.Utils.merge(defaultOptions, options);
        StyledElements.StyledElement.call(this, ['preTransition', 'postTransition']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = StyledElements.Utils.prependWord(options['class'], "alternatives");

        this.contentArea = document.createElement("div");
        this.contentArea.className = "wrapper";
        this.wrapperElement.appendChild(this.contentArea);

        this.visibleAlt = null;
        this.alternatives = {};
        this.alternativeList = [];
        this.nextAltId = 0;

        /* Process options */
        if (options.id) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        if (options.full) {
            this.wrapperElement.classList.add("full");
        }

        this.defaultEffect = options.defaultEffect;

        /* Transitions code */
        var context = {
            alternativesObject: this,
            inAlternative: null,
            outAlternative: null,
            width: null,
            steps: null,
            step: null,
            inc: null
        };

        var stepFunc = function stepFunc(step, context) {
            var newLeftPosOut, newLeftPosIn, offset = Math.floor(step * context.inc);

            if (context.inc < 0) {
                newLeftPosOut = offset;
                newLeftPosIn = context.width + offset;
            } else {
                newLeftPosOut = offset;
                newLeftPosIn = -context.width + offset;
            }

            if ((context.inc < 0) && (newLeftPosIn > 0) ||
                (context.inc > 0) && (newLeftPosOut < context.width)) {
                context.outAlternative.wrapperElement.style.left = newLeftPosOut + "px";
                context.inAlternative.wrapperElement.style.left = newLeftPosIn + "px";
                return true;  // we need to do more iterations
            } else {
                // Finish current transition
                context.outAlternative.setVisible(false);
                context.outAlternative.wrapperElement.style.left = '';
                context.outAlternative.wrapperElement.style.width = '';
                context.inAlternative.wrapperElement.style.left = '';
                context.inAlternative.wrapperElement.style.width = '';

                context.alternativesObject.visibleAlt = context.inAlternative;
                StyledElements.Utils.callCallback(context.onComplete, context.alternativesObject, context.outAlternative, context.inAlternative);
                context.alternativesObject.events.postTransition.dispatch(context.alternativesObject, context.outAlternative, context.inAlternative);
                return false; // we have finished here
            }
        };

        var initFunc = function initFunc(context, command) {
            context.outAlternative = context.alternativesObject.visibleAlt;
            context.inAlternative = command.id;
            context.onComplete = command.onComplete;
            if (context.inAlternative != null) {
                context.inAlternative = context.alternativesObject.alternatives[context.inAlternative];
            }

            if (context.inAlternative == null || context.inAlternative == context.outAlternative) {
                StyledElements.Utils.callCallback(context.onComplete, context.alternativesObject, context.outAlternative, context.inAlternative);
                return false; // we are not going to process this command
            }

            context.alternativesObject.events.preTransition.dispatch(context.alternativesObject, context.outAlternative, context.inAlternative);
            var baseTime = (new Date()).getTime() + 150;

            context.width = context.alternativesObject.wrapperElement.offsetWidth;
            context.inAlternative.wrapperElement.style.width = context.width + "px";
            context.outAlternative.wrapperElement.style.width = context.width + "px";
            context.inAlternative.setVisible(true);

            var stepTimes = [];
            // TODO
            switch (context.alternativesObject.defaultEffect) {
            case StyledAlternatives.HORIZONTAL_SLICE:
                context.steps = 6;
                for (var i = 0; i <= context.steps; i++) {
                    stepTimes[i] = baseTime + (i * 150);
                }

                context.inc = Math.floor(context.width / context.steps);
                if (context.inAlternative.getId() > context.outAlternative.getId()) {
                    context.inAlternative.wrapperElement.style.left = context.width + "px";
                    context.inc = -context.inc;
                } else {
                    context.inAlternative.wrapperElement.style.left = -context.width + "px";
                }
            // TODO
                break;
            //case StyledAlternatives.NONE:
            default:
                context.steps = 1;
                stepTimes[0] = baseTime;

                context.inc = Math.floor(context.width / context.steps);
                if (context.inAlternative.getId() > context.outAlternative.getId()) {
                    context.inAlternative.wrapperElement.style.left = context.width + "px";
                    context.inc = -context.inc;
                } else {
                    context.inAlternative.wrapperElement.style.left = -context.width + "px";
                }
            }

            return stepTimes; // we have things to do
        };

        this.transitionsQueue = new StyledElements.CommandQueue(context, initFunc, stepFunc);
    };
    StyledAlternatives.prototype = new StyledElements.StyledElement();
    StyledAlternatives.HORIZONTAL_SLICE = "HorizontalSlice";
    StyledAlternatives.NONE = "HorizontalSlice";

    StyledAlternatives.prototype.repaint = function repaint(temporal) {
        temporal = temporal !== undefined ? temporal: false;

        var height = this._getUsableHeight();
        if (height == null) {
            return; // nothing to do
        }

        this.wrapperElement.style.height = (height + "px");

        // Resize content
        if (this.visibleAlt != null) {
            this.visibleAlt.repaint();
        }
    };

    StyledAlternatives.prototype.createAlternative = function createAlternative(options) {
        var defaultOptions = {
            'containerOptions': {},
            'alternative_constructor': StyledElements.Alternative
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        var altId = this.nextAltId++;

        if ((options.alternative_constructor !== StyledElements.Alternative) && !(options.alternative_constructor.prototype instanceof StyledElements.Alternative)) {
            throw new TypeError();
        }
        var alt = new options.alternative_constructor(altId, options.containerOptions);

        alt.insertInto(this.contentArea);

        this.alternatives[altId] = alt;
        this.alternativeList.push(alt);

        if (!this.visibleAlt) {
            this.visibleAlt = alt;
            alt.setVisible(true);
        }

        /* Return the alternative container */
        return alt;
    };

    StyledAlternatives.prototype.removeAlternative = function removeAlternative(alternative) {
        var index, id, nextAlternative = null;

        if (alternative instanceof StyledElements.Alternative) {
            id = alternative.getId();
            if (this.alternatives[id] !== alternative) {
                throw new TypeError('Invalid alternative');
            }
        } else {
            id = alternative;
            if (this.alternatives[id] == null) {
                throw new TypeError('Invalid alternative');
            }
            alternative = this.alternatives[id];
        }

        delete this.alternatives[id];
        index = this.alternativeList.indexOf(alternative);
        this.alternativeList.splice(index, 1);

        alternative.setVisible(false);
        this.contentArea.removeChild(alternative.wrapperElement);

        if (this.visibleAlt === alternative) {
            if (this.alternativeList.length > 0) {
                nextAlternative = this.alternativeList[index];
                if (!nextAlternative) {
                    nextAlternative = this.alternativeList[index - 1];
                }
                nextAlternative.setVisible(true);
                this.visibleAlt = nextAlternative;
            } else {
                this.visibleAlt = null;
            }

            this.events.postTransition.dispatch(this, alternative, nextAlternative);
        }
    };

    StyledAlternatives.prototype.clear = function clear() {
        this.alternatives = {};
        this.alternativeList = [];
        this.nextAltId = 0;
        this.visibleAlt = null;
        this.contentArea.innerHTML = '';
    };

    StyledAlternatives.prototype.getCurrentAlternative = function getCurrentAlternative() {
        return this.visibleAlt;
    };

    /**
     * Changes current visible alternative.
     *
     * @param {Number|StyledElements.Alternative} Alternative to show. Must belong
     * to this instance of StyledAlternatives.
     */
    StyledAlternatives.prototype.showAlternative = function showAlternative(alternative, options) {
        var command = {};

        if (options == null) {
            options = {};
        }

        if (alternative instanceof StyledElements.Alternative) {
            command.id = alternative.getId();
            if (this.alternatives[command.id] !== alternative) {
                throw new Error('Invalid alternative');
            }
        } else {
            command.id = alternative;
            if (this.alternatives[command.id] == null) {
                throw new Error('Invalid alternative');
            }
        }

        command.onComplete = options.onComplete;

        this.transitionsQueue.addCommand(command);
    };

    StyledElements.StyledAlternatives = StyledAlternatives;
})();
