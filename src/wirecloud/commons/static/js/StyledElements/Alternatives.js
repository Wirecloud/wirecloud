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

/* globals StyledElements */


(function (utils) {

    "use strict";

    var privates = new WeakMap();

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

        this.alternatives = {};
        this.alternativeList = [];

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
            var inAlternative, outAlternative, p, _privates = privates.get(context);

            p = Promise.resolve();

            switch (command.type) {
            case "transit":
                inAlternative = command.inAlternative;
                outAlternative = context.visibleAlt;

                if (inAlternative === outAlternative) {
                    utils.callCallback(command.onComplete, context, outAlternative, inAlternative);
                    return false; // we are not going to process this command
                }

                p = build_transit_promise(command.effect, outAlternative, inAlternative, context);
                break;
            case "remove":
                outAlternative = command.outAlternative;
                if (_privates.visibleAlt === outAlternative) {
                    if (context.alternativeList.length > 0) {
                        inAlternative = context.alternativeList[command.index];
                        if (!inAlternative) {
                            inAlternative = context.alternativeList[command.index - 1];
                        }
                        p = build_transit_promise(command.effect, outAlternative, inAlternative, context);
                    } else {
                        _privates.visibleAlt = null;
                    }
                }
                p = p.then(function () {
                    context.wrapperElement.removeChild(outAlternative.wrapperElement);
                }.bind(this));
            }

            return p.then(function () {
                // Call the onComplete callback
                utils.callCallback(command.onComplete, context, outAlternative, inAlternative);
            });
        };

        privates.set(this, {
            nextAltId: 0,
            transitionsQueue: new StyledElements.CommandQueue(this, initFunc),
            visibleAlt: null
        });
    };
    Alternatives.prototype = new StyledElements.StyledElement();
    Alternatives.HORIZONTAL_FLIP = "horizontalflip";
    Alternatives.HORIZONTAL_SLIDE = "horizontalslide";
    Alternatives.CROSS_DISSOLVE = "dissolve";
    Alternatives.NONE = "none";

    Alternatives.prototype.repaint = function repaint(temporal) {
        var _privates = privates.get(this);

        // Resize content
        if (_privates.visibleAlt != null) {
            _privates.visibleAlt.repaint(!!temporal);  // Convert temporal to boolean
        }

        return this;
    };

    Alternatives.prototype.createAlternative = function createAlternative(options) {
        var _privates = privates.get(this);
        var defaultOptions = {
            alternative_constructor: StyledElements.Alternative,
            containerOptions: {},
            initiallyVisible: false
        };
        options = utils.update(defaultOptions, options);

        var altId = privates.get(this).nextAltId++;

        if ((options.alternative_constructor !== StyledElements.Alternative) && !(options.alternative_constructor.prototype instanceof StyledElements.Alternative)) {
            throw new TypeError();
        }
        var alt = new options.alternative_constructor(altId, options.containerOptions);

        alt.insertInto(this.wrapperElement);

        this.alternatives[altId] = alt;
        this.alternativeList.push(alt);

        if (!_privates.visibleAlt) {
            _privates.visibleAlt = alt;
            alt.setVisible(true);
        } else if (options.initiallyVisible) {
            this.showAlternative(alt);
        }

        /* Return the alternative container */
        return alt;
    };

    Alternatives.prototype.removeAlternative = function removeAlternative(alternative, options) {
        var index, id;

        options = utils.update({
            effect: this.defaultEffect,
            onComplete: null
        }, options);

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
                utils.callCallback(options.onComplete);
                return this;
            }
        }

        delete this.alternatives[id];
        index = this.alternativeList.indexOf(alternative);
        this.alternativeList.splice(index, 1);

        privates.get(this).transitionsQueue.addCommand({
            effect: options.effect,
            index: index,
            type: "remove",
            onComplete: options.onComplete,
            outAlternative: alternative
        });

        return this;
    };

    Alternatives.prototype.clear = function clear() {
        var _privates = privates.get(this);
        this.alternatives = {};
        this.alternativeList = [];
        _privates.nextAltId = 0;
        _privates.visibleAlt = null;
        this.wrapperElement.innerHTML = '';

        return this;
    };

    Alternatives.prototype.getCurrentAlternative = function getCurrentAlternative() {
        return privates.get(this).visibleAlt;
    };

    Object.defineProperties(Alternatives.prototype, {
        visibleAlt: {
            get: Alternatives.prototype.getCurrentAlternative
        }
    });


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

        command.type = "transit";
        command.onComplete = options.onComplete;
        command.effect = options.effect;

        privates.get(this).transitionsQueue.addCommand(command);

        return this;
    };

    var build_transit_promise = function build_transit_promise(effect, outAlternative, inAlternative, context) {
        var p = new Promise(function (fulfill) {
            // Throw an event notifying we are going to change the visible alternative
            context.events.preTransition.dispatch(context, outAlternative, inAlternative);
            fulfill();
        });

        switch (effect) {
        case StyledElements.Alternatives.HORIZONTAL_SLIDE:
            outAlternative.addClassName('slide');
            inAlternative.addClassName([
                'slide',
                inAlternative.getId() < outAlternative.getId() ? 'left' : 'right'
            ]).show();
            p = p.then(Promise.all([
                utils.waitTransition(inAlternative.get()),
                utils.waitTransition(outAlternative.get())
            ])).then(function () {
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
            p = p.then(Promise.all([
                utils.waitTransition(inAlternative.get()),
                utils.waitTransition(outAlternative.get())
            ])).then(function () {
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
            p = p.then(function () {
                inAlternative.show();
                outAlternative.hide();
            });
        }

        return p.then(function () {
            privates.get(context).visibleAlt = inAlternative;
            // Throw an event notifying we have changed the visible alternative
            context.events.postTransition.dispatch(context, outAlternative, inAlternative);
        });
    };

    StyledElements.Alternatives = Alternatives;

})(StyledElements.Utils);
