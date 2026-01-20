/*
 *     Copyright (c) 2024 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */

(function (ns, se, utils) {

    'use strict';

    ns.ScreenSizesInputInterface = class ScreenSizesInputInterface extends se.InputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);

            this.value = options.defaultValue || [];
            this.enabledStatus = true;

            this.wrapperElement = new StyledElements.Container({class: 'se-screen-size-field'});
            this.addButton = new StyledElements.Button({
                iconClass: 'fas fa-plus'
            });

            this.addButton.addEventListener('click', this.on_addScreenSize.bind(this));

            this.screenSizesInputs = {};

            this.wrapperElement.appendChild(this.addButton);

            this._update(this.value);
            this.addButton.setDisabled(!this.enabledStatus);

            this.highestIdUsed = 0;
        }

        on_addScreenSize() {
            const screenSizes = utils.clone(this.value, true);

            // Get max id
            let maxId = 0;
            screenSizes.forEach((screenSize) => {
                if (screenSize.id > maxId) {
                    maxId = screenSize.id;
                }
            });

            maxId = Math.max(maxId, this.highestIdUsed);

            const newScreenSize = {
                id: maxId + 1,
                name: "Default-" + (maxId + 1),
                moreOrEqual: (screenSizes.length > 0) ? screenSizes[screenSizes.length - 1].lessOrEqual + 1 : 0,
                lessOrEqual: -1
            };

            this.highestIdUsed = newScreenSize.id;

            screenSizes.push(newScreenSize);

            this._update(screenSizes, false);
        }

        on_deleteScreenSize(screenSizeId) {
            const screenSizes = utils.clone(this.value, true);

            const index = screenSizes.findIndex((screenSize) => screenSize.id === screenSizeId);
            screenSizes.splice(index, 1);

            this._update(screenSizes, false);
        }

        on_valueChange(screenSizeId, from, value) {
            const screenSizes = utils.clone(this.value, true);

            const screenSizeIdx = screenSizes.findIndex((screenSize) => screenSize.id === screenSizeId);
            screenSizes[screenSizeIdx][from] = value;

            if (from === 'moreOrEqual' && screenSizeIdx > 0) {
                screenSizes[screenSizeIdx - 1].lessOrEqual = value - 1;
                this.screenSizesInputs[screenSizes[screenSizeIdx - 1].id].children[2].children[1].inputElement.value = value - 1;
            } else if (from === 'lessOrEqual' && screenSizeIdx < screenSizes.length - 1) {
                screenSizes[screenSizeIdx + 1].moreOrEqual = value + 1;
                this.screenSizesInputs[screenSizes[screenSizeIdx + 1].id].children[1].children[1].inputElement.value = value + 1;
            }

            this.value = screenSizes;
        }

        static parse(value) {
            return JSON.parse(value);
        }

        static stringify(value) {
            return JSON.stringify(value);
        }

        _normalize(value) {
            return value;
        }

        _checkValue(newValue) {
            // Check that the newValue covers all integers from [0, +inf) without gaps or overlaps
            const screenSizes = utils.clone(newValue, true);

            if (!Array.isArray(screenSizes) || screenSizes.length === 0) {
                return se.InputValidationError.SCREEN_SIZES_ERROR;
            }

            screenSizes.sort((a, b) => a.moreOrEqual - b.moreOrEqual);

            let lastLessOrEqual = -1;
            for (let i = 0; i < screenSizes.length; i++) {
                if (screenSizes[i].moreOrEqual !== lastLessOrEqual + 1 || (i !== screenSizes.length - 1 && screenSizes[i].lessOrEqual <= screenSizes[i].moreOrEqual)) {
                    return se.InputValidationError.SCREEN_SIZES_ERROR;
                }

                lastLessOrEqual = screenSizes[i].lessOrEqual;
            }

            if (lastLessOrEqual !== -1) {
                return se.InputValidationError.SCREEN_SIZES_ERROR;
            }

            return se.InputValidationError.NO_ERROR;
        }

        getValue() {
            return this.value;
        }

        setDisabled(disabled) {
            this.enabledStatus = !disabled;

            this.addButton.setDisabled(!this.enabledStatus);
            this._update();
        }

        repaint() {
            this.wrapperElement.repaint();
        }

        _setValue(newValue) {
            this._update(newValue);
            newValue.forEach((screenSize) => {
                if (screenSize.id > this.highestIdUsed) {
                    this.highestIdUsed = screenSize.id;
                }
            });
        }

        _update(newValue, sort = true) {
            if (newValue) {
                this.value = newValue;
            } else {
                newValue = this.value;
            }

            Object.entries(this.screenSizesInputs).forEach((screenSizeContainer) => {
                this.wrapperElement.removeChild(screenSizeContainer[1]);
            });

            if (sort) {
                // Sort by moreOrEqual
                newValue.sort((a, b) => a.moreOrEqual - b.moreOrEqual);
            }

            const newContainers = [];

            this.screenSizesInputs = {};
            newValue.forEach((screenSize, i) => {
                const screenSizeContainer = new StyledElements.Container();

                const nameAddon = new se.Addon({
                    text: utils.gettext('Name:'),
                    title: utils.gettext('Name of the screen size range.')
                });
                nameAddon.setDisabled(!this.enabledStatus);

                const nameInput = new se.TextField({
                    name: 'name',
                    initialValue: ('name' in screenSize) ? screenSize.name : 'Default-' + screenSize.id
                });
                nameInput.setDisabled(!this.enabledStatus);

                nameInput.addEventListener('change', () => {
                    this.on_valueChange(screenSize.id, 'name', nameInput.getValue());
                });

                const nameContainer = new se.Container({class: 'se-input-group se-screen-size-name'});
                nameContainer.appendChild(nameAddon);
                nameContainer.appendChild(nameInput);

                const fromAddon = new se.Addon({
                    text: utils.gettext('From (px):'),
                    title: utils.gettext('The left limit of the screen size range (in pixels).')
                });
                fromAddon.setDisabled(i === 0 || !this.enabledStatus);

                const moreOrEqualVal = (i === 0) ? 0 : screenSize.moreOrEqual;
                const moreOrEqualInput = new se.NumericField({
                    name: 'moreOrEqual',
                    initialValue: moreOrEqualVal,
                    min: 0,
                    inc: 10
                });

                if (moreOrEqualVal !== screenSize.moreOrEqual) {
                    this.on_valueChange(screenSize.id, 'moreOrEqual', moreOrEqualVal);
                    screenSize.moreOrEqual = moreOrEqualVal;
                }

                moreOrEqualInput.setDisabled(i === 0 || !this.enabledStatus);
                moreOrEqualInput.addEventListener('change', () => {
                    this.on_valueChange(screenSize.id, 'moreOrEqual', moreOrEqualInput.getValue());
                });

                const fromContainer = new se.Container({class: 'se-input-group se-screen-size-from'});
                fromContainer.appendChild(fromAddon);
                fromContainer.appendChild(moreOrEqualInput);

                const toAddon = new se.Addon({
                    text: utils.gettext('To (px):'),
                    title: utils.gettext('The right limit of the screen size range (in pixels). Use -1 for no limit.')
                });
                toAddon.setDisabled(i === newValue.length - 1 || !this.enabledStatus);

                const lessOrEqualVal = (i === newValue.length - 1) ? -1 : screenSize.lessOrEqual;
                const lessOrEqualInput = new se.NumericField({
                    name: 'lessOrEqual',
                    initialValue: lessOrEqualVal,
                    min: -1,
                    inc: 10
                });

                if (lessOrEqualVal !== screenSize.lessOrEqual) {
                    this.on_valueChange(screenSize.id, 'lessOrEqual', lessOrEqualVal);
                    screenSize.lessOrEqual = lessOrEqualVal;
                }

                lessOrEqualInput.setDisabled(i === newValue.length - 1 || !this.enabledStatus);
                lessOrEqualInput.addEventListener('change', () => {
                    this.on_valueChange(screenSize.id, 'lessOrEqual', lessOrEqualInput.getValue());
                });

                const toContainer = new se.Container({class: 'se-input-group se-screen-size-to'});
                toContainer.appendChild(toAddon);
                toContainer.appendChild(lessOrEqualInput);

                const deleteButton = new se.Button({
                    class: 'btn-danger',
                    iconClass: 'fas fa-trash'
                });
                const editScreenSizeButton = new se.Button({
                    iconClass: 'fas fa-edit'
                });

                editScreenSizeButton.addEventListener('click', () => {
                    const err = !(this._checkValue(this.value) === se.InputValidationError.NO_ERROR);
                    this._callEvent('requestSave', () => {
                        if (!err) {
                            Wirecloud.activeWorkspace.view.activeTab.quitEditingInterval();
                            Wirecloud.activeWorkspace.view.activeTab.setEditingInterval(screenSize.moreOrEqual, screenSize.lessOrEqual, screenSize.name);
                        }
                    });
                });

                deleteButton.setDisabled(newValue.length === 1 || !this.enabledStatus);
                deleteButton.addEventListener('click', this.on_deleteScreenSize.bind(this, screenSize.id));

                const buttonContainer = new se.Container({class: 'se-input-group se-screen-size-buttons'});
                buttonContainer.appendChild(editScreenSizeButton);
                buttonContainer.appendChild(deleteButton);

                screenSizeContainer.appendChild(nameContainer);
                screenSizeContainer.appendChild(fromContainer);
                screenSizeContainer.appendChild(toContainer);
                screenSizeContainer.appendChild(buttonContainer);

                this.screenSizesInputs[screenSize.id] = screenSizeContainer;
                newContainers.push(screenSizeContainer);
            });

            for (let i = newContainers.length - 1; i >= 0; i--) {
                this.wrapperElement.prependChild(newContainers[i]);
            }
        }

        _setError(error) {

        }

        insertInto(element) {
            this.wrapperElement.insertInto(element);
        }

    };

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);