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

    /**
     * Creates an Alternatives component. An Alternative container allows
     * contents to share the same placement, being only one of the configured
     * {@link StyledElements.Alternative} able to be displayed at one time.
     *
     * @constructor
     * @extends StyledElements.StyledElement
     * @name StyledElements.Alternatives
     * @since 0.5
     *
     * @param {Object.<String, *>} options
     *    Available options:
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
        this.wrapperElement.className = utils.prependWord(options.class, "se-alternatives");

        /* Process options */
        if (options.id) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        if (options.full) {
            this.wrapperElement.classList.add("full");
        }

        Object.defineProperties(this, {
            alternatives: {
                get: on_alternatives_get
            },
            alternativeList: {
                get: on_alternative_list_get
            },
            defaultEffect: {
                value: options.defaultEffect,
                writable: true
            }
        });

        /* Transitions code */
        var initFunc = function initFunc(context, command) {
            var inAlternative, outAlternative, p, priv = privates.get(context);

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
                if (priv.visibleAlt === outAlternative) {
                    if (priv.alternativeList.length > 0) {
                        inAlternative = priv.alternativeList[command.index];
                        if (!inAlternative) {
                            inAlternative = priv.alternativeList[command.index - 1];
                        }
                        p = build_transit_promise(command.effect, outAlternative, inAlternative, context);
                    } else {
                        priv.visibleAlt = null;
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
            visibleAlt: null,
            alternatives: {},
            alternativeList: []
        });
    };
    utils.inherit(Alternatives, StyledElements.StyledElement);

    Alternatives.HORIZONTAL_FLIP = "horizontalflip";
    Alternatives.HORIZONTAL_SLIDE = "horizontalslide";
    Alternatives.CROSS_DISSOLVE = "dissolve";
    Alternatives.NONE = "none";

    Alternatives.prototype.repaint = function repaint(temporal) {
        var priv = privates.get(this);

        // Resize content
        if (priv.visibleAlt != null) {
            priv.visibleAlt.repaint(!!temporal);  // Convert temporal to boolean
        }

        return this;
    };

    Alternatives.prototype.createAlternative = function createAlternative(options) {
        var priv = privates.get(this);

        var defaultOptions = {
            alternative_constructor: StyledElements.Alternative,
            containerOptions: {},
            initiallyVisible: false
        };
        options = utils.update(defaultOptions, options);
        options.containerOptions.parentElement = this;

        var altId = privates.get(this).nextAltId++;

        if ((options.alternative_constructor !== StyledElements.Alternative) && !(options.alternative_constructor.prototype instanceof StyledElements.Alternative)) {
            throw new TypeError();
        }
        // eslint-disable-next-line new-cap
        var alt = new options.alternative_constructor(altId, options.containerOptions);
        alt.parentElement = this;

        alt.insertInto(this.wrapperElement);

        priv.alternatives[altId] = alt;
        priv.alternativeList.push(alt);

        if (!priv.visibleAlt) {
            priv.visibleAlt = alt;
            alt.setVisible(true);
        } else if (options.initiallyVisible) {
            this.showAlternative(alt);
        }

        /* Return the alternative container */
        return alt;
    };

    /**
     * Removes an alternative from this Alternatives instance
     *
     * @param {Number|StyledElements.Alternative} Alternative to remove. Must
     * belong to this instance of Alternatives.
     *
     * @param {Object} [options]
     *
     * Optional object with extra options:
     * - `effect`: effect to use in case of requiring switching to another
     *   alternative
     * - `onComplete`: callback to call on completion (deprecated, use the
     *   returned promise)
     *
     * @returns {Promise}
     *     A promise tracking the progress of visually removing the alternative.
     *     The alternative itself is removed immediatelly from the list of
     *     available alternatives.
     */
    Alternatives.prototype.removeAlternative = function removeAlternative(alternative, options) {
        var index, id, priv;

        priv = privates.get(this);

        options = utils.update({
            effect: this.defaultEffect,
            onComplete: null
        }, options);

        if (alternative instanceof StyledElements.Alternative) {
            id = alternative.altId;
            if (priv.alternatives[id] !== alternative) {
                throw new TypeError('alternative is not owner by this alternatives element');
            }
        } else {
            id = alternative;
            alternative = priv.alternatives[alternative];
            if (!alternative) {
                // Do nothing
                utils.callCallback(options.onComplete);
                return Promise.resolve();
            }
        }

        delete priv.alternatives[id];
        index = priv.alternativeList.indexOf(alternative);
        priv.alternativeList.splice(index, 1);

        return priv.transitionsQueue.addCommand({
            effect: options.effect,
            index: index,
            type: "remove",
            onComplete: options.onComplete,
            outAlternative: alternative
        });
    };

    Alternatives.prototype.clear = function clear() {
        var priv = privates.get(this);
        priv.alternatives = {};
        priv.alternativeList = [];
        priv.nextAltId = 0;
        priv.visibleAlt = null;
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
     * @since 0.5
     * @name StyledElements.Alternative#showAlternative
     *
     * @param {Number|StyledElements.Alternative} Alternative to show. Must belong
     * to this instance of Alternatives.
     *
     * @param {Object} [options]
     *
     * Optional object with extra options:
     * - `effect`: effect to use in the transition
     * - `onComplete`: callback to call on completion (deprecated, use the
     *   returned promise)
     *
     * @returns {Promise}
     *     A promise tracking the progress of the alternative switch.
     */
    Alternatives.prototype.showAlternative = function showAlternative(alternative, options) {
        var priv, command = {};

        options = utils.update({
            effect: this.defaultEffect,
            onComplete: null
        }, options);

        priv = privates.get(this);

        if (alternative instanceof StyledElements.Alternative) {
            if (priv.alternatives[alternative.altId] !== alternative) {
                throw new TypeError('Invalid alternative');
            }
            command.inAlternative = alternative;
        } else {
            if (priv.alternatives[alternative] == null) {
                throw new TypeError('Invalid alternative');
            }
            command.inAlternative = priv.alternatives[alternative];
        }

        command.type = "transit";
        command.onComplete = options.onComplete;
        command.effect = options.effect;

        return priv.transitionsQueue.addCommand(command);
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var on_alternatives_get = function on_alternatives_get() {
        return utils.clone(privates.get(this).alternatives);
    };

    var on_alternative_list_get = function on_alternative_list_get() {
        return privates.get(this).alternativeList.slice(0);
    };

    var build_transit_promise = function build_transit_promise(effect, outAlternative, inAlternative, context) {
        var p = new Promise(function (fulfill) {
            // Throw an event notifying we are going to change the visible alternative
            context.dispatchEvent('preTransition', outAlternative, inAlternative);
            context.wrapperElement.classList.add('se-on-transition');
            fulfill();
        });

        switch (effect) {
        case StyledElements.Alternatives.HORIZONTAL_SLIDE:
            outAlternative.addClassName('slide');
            inAlternative.addClassName([
                'slide',
                inAlternative.altId < outAlternative.altId ? 'left' : 'right'
            ]).show();
            p = p.then(function () {
                return Promise.all([
                    utils.waitTransition(inAlternative.get()),
                    utils.waitTransition(outAlternative.get())
                ]);
            }).then(function () {
                inAlternative.removeClassName('slide');
                outAlternative.removeClassName('slide left right').hide();
            });
            // Trigger slide effects
            setTimeout(function () {
                outAlternative.addClassName(inAlternative.altId < outAlternative.altId ? 'right' : 'left');
                inAlternative.removeClassName('left right');
            }, 10);
            break;
        case StyledElements.Alternatives.CROSS_DISSOLVE:
            inAlternative.addClassName('fade').show();
            outAlternative.addClassName('fade in');
            p = p.then(function () {
                return Promise.all([
                    utils.waitTransition(inAlternative.get()),
                    utils.waitTransition(outAlternative.get())
                ]);
            }).then(function () {
                inAlternative.removeClassName('fade in');
                outAlternative.removeClassName('fade').hide();
            });
            // Trigger fade effects
            setTimeout(function () {
                inAlternative.addClassName('in');
                outAlternative.removeClassName('in');
            }, 10);
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
            context.wrapperElement.classList.remove('se-on-transition');
            // Throw an event notifying we have changed the visible alternative
            context.dispatchEvent('postTransition', outAlternative, inAlternative);
        });
    };

    StyledElements.Alternatives = Alternatives;

})(StyledElements.Utils);
