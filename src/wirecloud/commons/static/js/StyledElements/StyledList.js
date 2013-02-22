/**
 * A list
 */
StyledElements.StyledList = function(options) {
    options = EzWebExt.merge({
        'class':            '',
        'multivalued':      false,
        'initialEntries':   [],
        'initialSelection': []
    }, options);

    StyledElements.StyledElement.call(this, ['change']);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.prependWord(options['class'], "styled_list");

    this.content = document.createElement("div");
    this.wrapperElement.appendChild(this.content);

    this.entries = [];
    this.entriesByValue = {};
    this.currentSelection = [];

    this.addEntries(options.initialEntries);
    this.select(options.initialSelection);

    /* Process options */
    if (options.full)
        EzWebExt.appendClassName(this.wrapperElement, "full");

    this.multivalued = options.multivalued;

    if (options.allowEmpty === undefined)
        this.allowEmpty = this.multivalued;
    else
        this.allowEmpty = options.allowEmpty;
}
StyledElements.StyledList.prototype = new StyledElements.StyledElement();

/**
 * Añade las entradas indicadas en la lista.
 */
StyledElements.StyledList.prototype.addEntries = function(entries) {
    var entryValue, entryText;

    if (entries == null || entries.length == 0)
        return;

    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry instanceof Array) {
            entryValue = entry[0];
            entryText = entry[1];
        } else {
            entryValue = entries[i].value;
            entryText = entries[i].label;
        }
        entryText = entryText ? entryText : entryValue;

        var row = document.createElement("div");
        row.className = "row";

        var context = {listComponent: this, value: entryValue};
        EzWebExt.addEventListener(row, "click",
                             EzWebExt.bind(function() {
                                 if (this.listComponent.enabled)
                                    this.listComponent.toggleElementSelection(this.value);
                             }, context),
                             true);
        entry.element = row;

        row.appendChild(document.createTextNode(entryText));
        this.content.appendChild(row);

        this.entriesByValue[entryValue] = entry;
    }
    this.entries = this.entries.concat(entries);
}

StyledElements.StyledList.prototype.removeEntryByValue = function(value) {
    var i, entry, index;

    entry = this.entriesByValue[value];
    delete this.entriesByValue[value];
    this.entries.slice(this.entries.indexOf(entry), 1);
    EzWebExt.removeFromParent(entry.element);

    if (index !== -1) {
        this.currentSelection.splice(index, 1);
        this.events['change'].dispatch(this, this.currentSelection, [], [value]);
    }
}

/**
 * Removes all entries of this StyledList
 */
StyledElements.StyledList.prototype.clear = function () {
    this.cleanSelection();

    this.content.innerHTML = '';
    this.entries = [];
    this.entriesByValue = {};
};

/**
 * Devuelve una copia de la selección actual.
 */
StyledElements.StyledList.prototype.getSelection = function() {
    return EzWebExt.clone(this.currentSelection);
}

/**
 * @private
 */
StyledElements.StyledList.prototype._cleanSelection = function() {
    for (var i = 0; i < this.currentSelection.length; i++) {
        var value = this.currentSelection[i];
        EzWebExt.removeClassName(this.entriesByValue[value].element, "selected");
    }
    this.currentSelection = [];
}

/**
 * Borra la seleccion actual.
 */
StyledElements.StyledList.prototype.cleanSelection = function() {
    if (this.currentSelection.length === 0)
        return;  // Nothing to do

    var oldSelection = this.currentSelection;

    this._cleanSelection();

    this.events['change'].dispatch(this, [], [], oldSelection);
}

/**
 * Cambia la selección actual a la indicada.
 *
 * @param {Array} selection lista de valores a seleccionar.
 */
StyledElements.StyledList.prototype.select = function(selection) {
    this._cleanSelection();

    this.addSelection(selection);
}

/**
 * Añade un conjunto de valores a la selección actual.
 */
StyledElements.StyledList.prototype.addSelection = function(selection) {
    var i, entry, addedValues = [], removedValues = [];

    if (selection.length === 0)
        return;  // Nothing to do

    if (!this.multivalued) {
        if (selection[0] === this.currentSelection[0])
            return; // Nothing to do

        removedValues = this.currentSelection;

        this._cleanSelection();

        if (selection.length > 1)
            selection = selection.splice(0, 1);
    }

    for (i = 0; i < selection.length; i++) {
        entry = selection[i];
        if (this.currentSelection.indexOf(entry) === -1) {
            EzWebExt.appendClassName(this.entriesByValue[entry].element, "selected");
            this.currentSelection.push(entry);
            addedValues.push(entry);
        }
    }

    this.events['change'].dispatch(this, this.currentSelection, addedValues, removedValues);
}

/**
 * Elimina un conjunto de valores de la selección actual.
 */
StyledElements.StyledList.prototype.removeSelection = function(selection) {
    var i, entry, index, removedValues = [];

    if (selection.length === 0)
        return;  // Nothing to do

    for (i = 0; i < selection.length; i++) {
        entry = selection[i];
        EzWebExt.removeClassName(this.entriesByValue[entry].element, "selected");
        index = this.currentSelection.indexOf(entry);
        if (index !== -1) {
            this.currentSelection.splice(index, 1);
            EzWebExt.removeClassName(this.entriesByValue[entry].element, "selected");
            removedValues.push(entry);
        }
    }

    if (removedValues.length > 0) {
        this.events['change'].dispatch(this, this.currentSelection, [], removedValues);
    }
}

/**
 * Añade o borra una entrada de la selección dependiendo de si el elemento está
 * ya selecionado o no. En caso de que la entrada estuviese selecionado, el
 * elemento se eliminiaria de la selección y viceversa.
 */
StyledElements.StyledList.prototype.toggleElementSelection = function(element) {
    if (!EzWebExt.hasClassName(this.entriesByValue[element].element, "selected")) {
        this.addSelection([element]);
    } else if (this.allowEmpty) {
        this.removeSelection([element]);
    }
}

