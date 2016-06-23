/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Promise, StyledElements*/

(function (utils) {

    "use strict";

    /**
     * El componente Styled Alternatives permite guardar una colección de
     * contenedores, de los cuales sólo uno estará visible en el area asociada al
     * componente Alternatives.
     */
    var Alternatives = function Alternatives(options) {
        var defaultOptions = {
            'class': '',
            'full': true,
            'defaultEffect': StyledElements.Alternatives.NONE
        };

        options = utils.merge(defaultOptions, options);
        StyledElements.StyledElement.call(this, ['preTransition', 'postTransition']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = utils.prependWord(options['class'], "se-alternatives");

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
        var initFunc = function initFunc(context, command) {
            var inAlternative, outAlternative, p;

            inAlternative = command.inAlternative;
            outAlternative = command.outAlternative;
            context.onComplete = command.onComplete;

            if (inAlternative === outAlternative) {
                utils.callCallback(context.onComplete, context, outAlternative, inAlternative);
                return false; // we are not going to process this command
            }

            // Throw an event notifying we are going to change the visible alternative
            context.events.preTransition.dispatch(context, outAlternative, inAlternative);

            switch (command.effect) {
            case StyledElements.Alternatives.HORIZONTAL_SLIDE:
                outAlternative.addClassName('slide');
                inAlternative.addClassName([
                    'slide',
                    inAlternative.getId() < outAlternative.getId() ? 'left' : 'right'
                ]).show();
                p = Promise.all([
                    utils.waitTransition(inAlternative.get()),
                    utils.waitTransition(outAlternative.get())
                ]).then(function () {
                    inAlternative.removeClassName('slide');
                    outAlternative.removeClassName('slide left right').hide();
                });
                // Trigger slide effects
                setTimeout(function () {
                    outAlternative.addClassName(inAlternative.getId() < outAlternative.getId() ? 'right' : 'left');
                    inAlternative.removeClassName('left right');
                }, 10);
                break;
            case StyledElements.Alternatives.CROSS_DISSOLVE:
                inAlternative.addClassName('fade').show();
                outAlternative.addClassName('fade in');
                p = Promise.all([
                    utils.waitTransition(inAlternative.get()),
                    utils.waitTransition(outAlternative.get())
                ]).then(function () {
                    inAlternative.removeClassName('fade in');
                    outAlternative.removeClassName('fade').hide();
                });
                // Trigger fade effects
                setTimeout(function () {
                    inAlternative.addClassName('in');
                    outAlternative.removeClassName('in');
                }, 0);
                break;
            default:
            case StyledElements.Alternatives.NONE:
                inAlternative.show();
                outAlternative.hide();
                p = new Promise(function (fullfile) {fullfile();});
            }

            return p.then(function () {
                // Throw an event notifying we are going to change the visible alternative
                context.events.postTransition.dispatch(context, outAlternative, inAlternative);
                // Call the onComplete callback
                utils.callCallback(context.onComplete, context, outAlternative, inAlternative);
            });
        };

        this.transitionsQueue = new StyledElements.CommandQueue(this, initFunc);
    };
    Alternatives.prototype = new StyledElements.StyledElement();
    Alternatives.HORIZONTAL_FLIP = "horizontalflip";
    Alternatives.HORIZONTAL_SLIDE = "horizontalslide";
    Alternatives.CROSS_DISSOLVE = "dissolve";
    Alternatives.NONE = "none";

    Alternatives.prototype.repaint = function repaint(temporal) {
        // Resize content
        if (this.visibleAlt != null) {
            this.visibleAlt.repaint(!!temporal);  // Convert temporal to boolean
        }

        return this;
    };

    Alternatives.prototype.createAlternative = function createAlternative(options) {
        var defaultOptions = {
            alternative_constructor: StyledElements.Alternative,
            containerOptions: {},
            initiallyVisible: false
        };
        options = utils.update(defaultOptions, options);

        var altId = this.nextAltId++;

        if ((options.alternative_constructor !== StyledElements.Alternative) && !(options.alternative_constructor.prototype instanceof StyledElements.Alternative)) {
            throw new TypeError();
        }
        var alt = new options.alternative_constructor(altId, options.containerOptions);

        alt.insertInto(this.wrapperElement);

        this.alternatives[altId] = alt;
        this.alternativeList.push(alt);

        if (!this.visibleAlt) {
            this.visibleAlt = alt;
            alt.setVisible(true);
        } else if (options.initiallyVisible) {
            this.showAlternative(alt);
        }

        /* Return the alternative container */
        return alt;
    };

    Alternatives.prototype.removeAlternative = function removeAlternative(alternative) {
        var index, id, nextAlternative = null;

        if (alternative instanceof StyledElements.Alternative) {
            id = alternative.getId();
            if (this.alternatives[id] !== alternative) {
                throw new TypeError('alternative is not owner by this alternatives element');
            }
        } else {
            id = alternative;
            alternative = this.alternatives[alternative];
            if (!alternative) {
                // Do nothing
                return this;
            }
        }

        delete this.alternatives[id];
        index = this.alternativeList.indexOf(alternative);
        this.alternativeList.splice(index, 1);

        alternative.setVisible(false);
        this.wrapperElement.removeChild(alternative.wrapperElement);

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

        return this;
    };

    Alternatives.prototype.clear = function clear() {
        this.alternatives = {};
        this.alternativeList = [];
        this.nextAltId = 0;
        this.visibleAlt = null;
        this.wrapperElement.innerHTML = '';

        return this;
    };

    Alternatives.prototype.getCurrentAlternative = function getCurrentAlternative() {
        return this.visibleAlt;
    };

    /**
     * Changes current visible alternative.
     *
     * @param {Number|StyledElements.Alternative} Alternative to show. Must belong
     * to this instance of Alternatives.
     */
    Alternatives.prototype.showAlternative = function showAlternative(alternative, options) {
        var command = {};

        options = utils.update({
            effect: this.defaultEffect,
            onComplete: null
        }, options);

        if (alternative instanceof StyledElements.Alternative) {
            if (this.alternatives[alternative.getId()] !== alternative) {
                throw new TypeError('Invalid alternative');
            }
            command.inAlternative = alternative;
        } else {
            if (this.alternatives[alternative] == null) {
                throw new TypeError('Invalid alternative');
            }
            command.inAlternative = this.alternatives[alternative];
        }

        command.outAlternative = this.visibleAlt;
        command.onComplete = options.onComplete;
        command.effect = options.effect;

        this.transitionsQueue.addCommand(command);
        this.visibleAlt = command.inAlternative;

        return this;
    };

    StyledElements.Alternatives = Alternatives;

})(StyledElements.Utils);
