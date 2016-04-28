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

/* global StyledElements */


(function (se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    var clickCallback = function clickCallback(e) {
        if (this.inputElement != null && e.target === this.inputElement) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        if (this.enabled) {
            if (this.inputElement != null) {
                this.inputElement.click();
            }
            this.events.click.trigger(this);
        }
    };

    var dblclickCallback = function dblclickCallback(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.enabled) {
            this.events.dblclick.dispatch(this);
        }
    };

    var element_onkeydown = function element_onkeydown(event) {
        if (this.enabled) {
            this._onkeydown(event, utils.normalizeKey(event));
        }
    };

    var onmouseenter = function onmouseenter() {
        this.events.mouseenter.dispatch(this);
    };

    var onmouseleave = function onmouseleave() {
        this.events.mouseleave.dispatch(this);
    };

    var onfocus = function onfocus() {
        this.events.focus.dispatch(this);
    };

    var onblur = function onblur() {
        this.events.blur.dispatch(this);
    };

    var update_tabindex = function update_tabindex() {
        if (this.enabled) {
            this.wrapperElement.setAttribute('tabindex', this.tabindex);
        } else {
            this.wrapperElement.setAttribute('tabindex', -1);
        }
    };

    /**
     *
     * Eventos que soporta este componente:
     *      - click: evento lanzado cuando se pulsa el botón.
     */
    var Button = function Button(options) {
        options = utils.merge(utils.clone(defaults), options);

        // Support hirerarchy
        if (options.extending) {
            return;
        }

        this.superClass(events);

        if (options.usedInForm) {
            this.wrapperElement = document.createElement("button");
            this.wrapperElement.setAttribute('type', 'button');
        } else {
            this.wrapperElement = document.createElement("div");
        }

        this.wrapperElement.className = "se-btn";

        this.addClassName(options['class']);
        this.addClassName(options.extraClass);

        if (options.id.trim() !== "") {
            this.wrapperElement.setAttribute('id', options.id);
        }

        if (options.plain) {
            this.addClassName("plain");
        }

        if (options.icon != null) {
            this.icon = document.createElement("img");
            this.icon.className = "icon";
            this.icon.style.width = options.iconWidth + 'px';
            this.icon.style.height = options.iconHeight + 'px';
            this.icon.src = options.icon;
            this.wrapperElement.appendChild(this.icon);
        }

        if (options.iconClass != null && options.iconClass.trim() !== "") {
            this.icon = document.createElement('i');
            this.icon.classList.add('se-icon');
            this.wrapperElement.appendChild(this.icon);

            this.addIconClassName(options.iconClass);
        }

        if (options.text) {
            this.setLabel(options.text);
        }

        if (options.iconClass && options.stackedIconClass) {
            this.stackedIcon = document.createElement('span');
            this.stackedIcon.className = [options.stackedIconClass, 'se-stacked-icon', options.stackedIconPlacement].join(' ');
            this.icon.appendChild(this.stackedIcon);
        }

        if (options.title) {
            this.setTitle(options.title);
        }

        /* Properties */
        var tabindex, state, depth;
        Object.defineProperties(this, {

            /**
             * Get or set the z-depth effect value.
             *
             * @memberof StyledElements.Button#
             * @since 0.7.0
             *
             * @type {?Number}
             */
            depth: {
                get: function get() {
                    return depth;
                },
                set: function set(newDepth) {
                    depth = prop_depth_set.call(this, depth, newDepth);
                }
            },

            /**
             * Get or set the contextual state class.
             *
             * @memberof StyledElements.Button#
             * @since 0.7.0
             *
             * @type {?String}
             */
            state: {
                get: function get() {
                    return prop_state_get.call(this, state);
                },
                set: function set(newState) {
                    state = prop_state_set.call(this, state, newState);
                }
            },

            tabindex: {
                get: function get() {
                    return tabindex;
                },
                set: function set(new_tabindex) {
                    tabindex = new_tabindex;
                    update_tabindex.call(this);
                }
            },

            visible: {
                get: function get() {
                    return !this.hasClassName('invisible');
                },
                set: function set(value) {
                    this.toggleClassName('invisible', !value)
                        ._onvisible(value);
                }
            }

        });

        /* Initial status */
        this.state = options.state;
        this.depth = options.depth;
        this.tabindex = options.tabindex;

        /* Event handlers */
        var prototype = Object.getPrototypeOf(this);
        if (typeof prototype._clickCallback === 'function') {
            this._clickCallback = prototype._clickCallback.bind(this);
        } else {
            this._clickCallback = clickCallback.bind(this);
        }
        this._onkeydown_bound = element_onkeydown.bind(this);

        this.wrapperElement.addEventListener('touchstart', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.addEventListener('click', this._clickCallback, false);
        this.wrapperElement.addEventListener('dblclick', dblclickCallback.bind(this), true);
        this.wrapperElement.addEventListener('keydown', this._onkeydown_bound, false);
        this.wrapperElement.addEventListener('focus', onfocus.bind(this), true);
        this.wrapperElement.addEventListener('blur', onblur.bind(this), true);
        this.wrapperElement.addEventListener('mouseenter', onmouseenter.bind(this), false);
        this.wrapperElement.addEventListener('mouseleave', onmouseleave.bind(this), false);
    };
    StyledElements.Utils.inherit(Button, StyledElements.StyledElement);

    Button.prototype.Tooltip = StyledElements.Tooltip;

    Button.prototype._onenabled = function _onenabled(enabled) {
        update_tabindex.call(this);

        if (!enabled) {
            this.blur();
        }

        return this;
    };

    Button.prototype._onkeydown = function _onkeydown(event, key) {
        switch (key) {
        case ' ':
        case 'Enter':
            this._clickCallback(event);
            break;
        default:
            // Quit when this doesn't handle the key event.
            break;
        }
    };

    /**
     * @since 0.6.0
     * @abstract
     */
    Button.prototype._onvisible = function _onvisible(visible) {
        // This member can be implemented by subclass.
    };

    Button.prototype.focus = function focus() {
        this.wrapperElement.focus();
    };

    Button.prototype.blur = function blur() {
        this.wrapperElement.blur();
    };

    /**
     * [setLabel description]
     * @since 0.6.0
     *
     * @param {String} [textContent]
     *      [description]
     * @returns {Button}
     *      The instance on which the member is called.
     */
    Button.prototype.setLabel = function setLabel(textContent) {
        return textContent ? addLabel.call(this, textContent) : removeLabel.call(this);
    };

    Button.prototype.clearClassName = function clearClassName() {
        this.wrapperElement.className = 'se-btn';

        return this;
    };

    Button.prototype.addIconClassName = function addIconClassName(classList) {
        if (!Array.isArray(classList)) {
            classList = classList == null ? "" : classList.toString().trim();
            if (classList === "") {
                return this;
            }
            classList = classList.split(/\s+/);
        }

        classList.forEach(function (classname) {
            this.icon.classList.add(classname);
        }, this);

        return this;
    };

    Button.prototype.removeIconClassName = function removeIconClassName(classname) {
        this.icon.classList.remove(classname);

        return this;
    };

    Button.prototype.replaceIconClass = function replaceIconClass(className, newClassName) {
        this.icon.classList.remove(className);
        this.icon.classList.add(newClassName);

        return this;
    };

    Button.prototype.setTitle = function setTitle(title) {
        if (title == null || title === '') {
            if (this.tooltip != null) {
                this.tooltip.destroy();
                this.tooltip = null;
            }
        } else {
            if (this.tooltip == null) {
                this.tooltip = new this.Tooltip({content: title, placement: ['bottom', 'top', 'right', 'left']});
                this.tooltip.bind(this);
            }
            this.tooltip.options.content = title;
        }

        return this;
    };

    Button.prototype.click = function click() {
        if (this.enabled) {
            this.events.click.dispatch(this);
        }
    };

    Button.prototype.destroy = function destroy() {

        this.wrapperElement.removeEventListener('touchstart', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.removeEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.removeEventListener('click', this._clickCallback, true);
        this.wrapperElement.removeEventListener('keydown', this._onkeydown_bound, false);

        delete this._clickCallback;
        delete this._onkeydown_bound;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    /**
     * Set a badge on the button to highlight new or unread items.
     * @since 0.7.0
     *
     * @param {String|Number} content The badge's textContent.
     * @param {String} [state] The badge's contextual state class.
     * @param {Boolean} [isAlert] Set the button more eye-catching.
     *
     * @returns {StyledElements.Button} The instance on which this method is called.
     */
    Button.prototype.setBadge = function setBadge(content, state, isAlert) {
        return content ? insertBadge.call(this, content, state, !!isAlert) : removeBadge.call(this);
    };

    StyledElements.Button = Button;

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        id: "",
        'class': "",
        extraClass: "",
        iconClass: "",
        stackedIconClass: "",
        state: '',
        plain: false,
        usedInForm: false,
        text: "",
        depth: null,
        'title': '',
        'iconHeight': 24,
        'iconWidth': 24,
        'icon': null,
        'stackedIconPlacement': 'bottom-right',
        'tabindex': 0
    };

    var events = ['blur', 'click', 'dblclick', 'focus', 'mouseenter', 'mouseleave'];

    var prop_state_get = function prop_state_get(state) {
        return state;
    };

    var prop_state_set = function prop_state_set(state, newState) {
        var states = ['default', 'primary', 'success', 'info', 'warning', 'danger'];

        if (states.indexOf(newState) !== -1) {
            if (newState !== state) {
                if (state) {
                    this.removeClassName('btn-' + state);
                }
                state = newState;
                this.addClassName('btn-' + state);
            }
        } else {
            if (state) {
                this.removeClassName('btn-' + state);
            }
            state = "";
        }

        return state;
    };

    var prop_depth_set = function prop_depth_set(depth, newDepth) {

        if (typeof newDepth === 'number' && newDepth >= 0 && newDepth <= 5) {
            if (newDepth !== depth) {
                if (depth >= 0) {
                    this.removeClassName('z-depth-' + depth);
                }
                depth = newDepth;
                this.addClassName('z-depth-' + depth);
            }
        } else {
            if (depth != null) {
                this.removeClassName('z-depth-' + depth);
            }
            depth = null;
        }

        return depth;
    };

    var removeLabel = function removeLabel() {

        if (this.label != null) {
            this.remove(this.label);
            delete this.label;
        }

        return this;
    };

    var addLabel = function addLabel(textContent) {

        if (this.label == null) {
            this.label = document.createElement('span');
            this.wrapperElement.appendChild(this.label);
        }

        this.label.textContent = textContent;

        return this;
    };

    var insertBadge = function insertBadge(content, state, isAlert) {
        var states = ['inverse', 'primary', 'success', 'info', 'warning', 'danger'];

        if (this.badgeElement == null) {
            this.badgeElement = document.createElement('span');
            this.badgeElement.className = "badge";
            if (states.indexOf(state) !== -1) {
                this.badgeElement.classList.add("badge-" + state);
            }
            this.badgeElement.classList.add("z-depth-" + (this.depth + 1));
            this.wrapperElement.insertBefore(this.badgeElement, this.wrapperElement.firstChild);
        }

        this.toggleClassName('has-alert', isAlert);
        this.badgeElement.textContent = content;

        return this;
    };

    var removeBadge = function removeBadge() {

        if (this.badgeElement != null) {
            this.wrapperElement.removeChild(this.badgeElement);
            delete this.badgeElement;
        }

        this.removeClassName('has-alert');

        return this;
    };

})(StyledElements, StyledElements.Utils);
