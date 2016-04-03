/*
 *     Copyright 2012-2016 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals gettext, LayoutManagerFactory, StyledElements, Wirecloud */

(function () {

    "use strict";

    var UploadWindowMenu, upload_wgt_files, acceptListener, updateEmptyStatus, onUploadSuccess;

    /*************************************************************************
     *                            Private methods                            *
     *************************************************************************/

    onUploadSuccess = function onUploadSuccess() {
        this.mainview.viewsByName.search.mark_outdated();
    };

    upload_wgt_files = function upload_wgt_files() {
        var monitor, entries, count, failures, onComplete, onUploadFailure;

        monitor = LayoutManagerFactory.getInstance()._startComplexTask(gettext("Uploading packaged components"), 1);
        entries = this.fileTable.source.elements;
        count = entries.length;
        failures = [];

        onComplete = function () {
            if (--count === 0) {
                var layoutManager = LayoutManagerFactory.getInstance();
                layoutManager._notifyPlatformReady();
                if (failures.length > 0) {
                    var msg = document.createElement('p');
                    msg.textContent = gettext('Error uploading the following components:');
                    var details = document.createElement('ul');
                    for (var i = 0; i < failures.length; i++) {
                        var item = document.createElement('li');
                        var file_name = document.createElement('b');
                        file_name.textContent = failures[i].file;
                        item.appendChild(file_name);

                        var error_description = document.createTextNode(": " + failures[i].msg);
                        item.appendChild(error_description);

                        details.appendChild(item);
                    }
                    msg = new StyledElements.Fragment([msg, details]);
                    (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                }
                this.mainview.viewsByName.search.refresh_if_needed();
            }
        };

        onUploadFailure = function onUploadFailure(file_entry, msg) {
            failures.push({'file': file_entry.name, 'msg': msg});
        };

        for (var i = 0; i < entries.length; i++) {
            this.catalogue.addPackagedResource(entries[i].file, {
                force_create: true,
                monitor: monitor,
                onSuccess: onUploadSuccess.bind(this),
                onFailure: onUploadFailure.bind(this, entries[i]),
                onComplete: onComplete.bind(this)
            });
        }
        this.fileTable.source.changeElements([]);
        updateEmptyStatus.call(this);
    };

    acceptListener = function acceptListener() {
        upload_wgt_files.call(this);
        this.hide();
    };

    updateEmptyStatus = function updateEmptyStatus() {
        var empty = this.fileTable.source.elements.length === 0;
        this.acceptButton.setDisabled(empty);
        if (empty) {
            this.htmlElement.classList.add('wc-upload-mac-dialog-empty');
            this.fileButton.focus();
        } else {
            this.htmlElement.classList.remove('wc-upload-mac-dialog-empty');
            this.acceptButton.focus();
        }
    };

    /*************************************************************************
     *                           UploadWindowMenu                            *
     *************************************************************************/

    UploadWindowMenu = function UploadWindowMenu(options) {
        this.catalogue = options.catalogue;
        this.mainview = options.mainview;
        Wirecloud.ui.WindowMenu.call(this, gettext("Upload mashable application components"), 'wc-upload-mac-dialog');

        var builder = new StyledElements.GUIBuilder();
        var contents = builder.parse(Wirecloud.currentTheme.templates.wirecloud_catalogue_upload_dialog, {
            'upload_wgt_button': function () {
                var button = new StyledElements.FileButton({text: gettext('Select files from your computer')});
                button.addEventListener('fileselect', function (button, files) {
                    for (var i = 0; i < files.length; i++) {
                        this.addFile(files[i]);
                    }
                }.bind(this));
                this.fileButton = button;
                return button;
            }.bind(this)
        });
        contents.insertInto(this.windowContent);

        this.fileTable = new StyledElements.ModelTable([
            {
                "field": "name",
                "label": Wirecloud.Utils.gettext("Name")
            },
            {
                "field": "size",
                "type": "number",
                "label": Wirecloud.Utils.gettext("Size"),
                "width": "css",
                "class": "wc-upload-mac-size-column",
                "contentBuilder": function (file) {return Wirecloud.Utils.formatSize(file.size);}
            },
            {
                "label": "",
                "width": "css",
                "class": "wc-upload-mac-button-column",
                "sortable": false,
                "contentBuilder": function (entry) {
                    var button = new StyledElements.Button({iconClass: "icon-remove", plain: true, title: gettext("Remove this file")});
                    button.addEventListener("click", this.removeFile.bind(this, entry.file));
                    return button;
                }.bind(this)
            }
        ], {
            pageSize: 0
        });
        var addMoreButton = new StyledElements.FileButton({text: gettext('Add more files')});
        addMoreButton.addEventListener('fileselect', function (button, files) {
            for (var i = 0; i < files.length; i++) {
                this.addFile(files[i]);
            }
        }.bind(this));
        this.fileTable.statusBar.appendChild(addMoreButton);
        this.fileTable.insertInto(this.windowContent);

        this.acceptButton = new StyledElements.Button({
            text: gettext("Upload"),
            'class': 'btn-primary btn-accept'
        });
        this.acceptButton.addEventListener("click", acceptListener.bind(this));
        this.acceptButton.insertInto(this.windowBottom);
        this.acceptButton.disable();

        // File Drag & drop borders
        var border = document.createElement("div");
        border.className = "wc-upload-mac-border";
        this.windowContent.appendChild(border);

        // Cancel button
        this.cancelButton = new StyledElements.Button({
            text: gettext("Cancel"),
            'class': 'btn-default btn-cancel'
        });
        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);

        // Drag & drop support
        var drop_listener = function drop_listener(e) {
            e.preventDefault();
            deactivate();
        };
        var dragleave_listener = function dragleave_listener(e) {
            e.stopPropagation();
            deactivate();
        };
        var deactivate = function deactivate(e) {
            this.htmlElement.classList.remove('drag-hover');
            document.removeEventListener('drop', drop_listener, true);
            document.removeEventListener('dragleave', dragleave_listener, false);
            document.removeEventListener('dragover', Wirecloud.Utils.preventDefaultListener, true);
            this.htmlElement.addEventListener('dragover', activate_listener, true);
        }.bind(this);

        var activate_listener = function activate_listener(e) {
            var has_files;

            e.preventDefault();

            if (e.dataTransfer.types.contains) {
                has_files = e.dataTransfer.types.contains('Files');
            } else {
                has_files = e.dataTransfer.types.indexOf('Files') != -1;
            }
            if (has_files) {

                // Support drag and drop from the Chrome's downloads bar
                var effectAllowed = e.dataTransfer.effectAllowed;
                e.dataTransfer.dropEffect = ('move' === effectAllowed || 'linkMove' === effectAllowed) ? 'move' : 'copy';

                // Allow drop
                this.htmlElement.classList.add('drag-hover');
                this.htmlElement.removeEventListener('dragover', activate_listener, true);
                document.addEventListener('dragover', Wirecloud.Utils.preventDefaultListener, true);
                document.addEventListener('dragleave', dragleave_listener, false);
                document.addEventListener('drop', drop_listener, true);
            }
        }.bind(this);
        this.htmlElement.addEventListener('dragover', activate_listener, true);

        this.windowContent.addEventListener('drop', function (e) {
            var i;

            e.stopPropagation();
            e.preventDefault();
            this.windowContent.classList.remove('on');

            for (i = 0; i < e.dataTransfer.files.length; i++) {
                this.addFile(e.dataTransfer.files[i]);
            }
        }.bind(this), true);
    };
    UploadWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    UploadWindowMenu.prototype.addFile = function addFile(file) {
        var entry = {
            name: file.name,
            size: file.size,
            file: file
        };
        this.fileTable.source.addElement(entry);
        this.htmlElement.classList.remove('wc-upload-mac-dialog-empty');
        this.acceptButton.enable().focus();
    };

    UploadWindowMenu.prototype.removeFile = function removeFile(file) {
        for (var i = 0; i < this.fileTable.source.elements.length; i++) {
            var entry = this.fileTable.source.elements[i];
            if (entry.file === file) {
                this.fileTable.source.elements.splice(i, 1);
                updateEmptyStatus.call(this);
                this.fileTable.source.refresh();
                break;
            }
        }
    };

    UploadWindowMenu.prototype.setFocus = function setFocus() {
        this.fileButton.focus();
    };

    UploadWindowMenu.prototype.show = function show() {
        Wirecloud.ui.WindowMenu.prototype.show.apply(this, arguments);
        this.fileTable.repaint();
        updateEmptyStatus.call(this);
    };

    UploadWindowMenu.prototype._closeListener = function _closeListener() {
        this.fileTable.source.changeElements([]);
        updateEmptyStatus.call(this);

        Wirecloud.ui.WindowMenu.prototype._closeListener.call(this);
    };

    Wirecloud.ui.WirecloudCatalogue = {};
    Wirecloud.ui.WirecloudCatalogue.UploadWindowMenu = UploadWindowMenu;
})();
