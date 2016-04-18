var getElementsByTagNameNS = getElementsByTagNameNS = function getElementsByTagNameNS(ns, tagName) {
    var result = this.ownerDocument.evaluate('s:' + tagName, this, function (namespace) { return namespace === 's' ? ns : null; }, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    var a = [];
    for (var i = 0; i < result.snapshotLength; i++) {
        a[i] = result.snapshotItem(i);
    }
    return a;
};

Document.prototype.getElementsByTagNameNS = getElementsByTagNameNS;
Element.prototype.getElementsByTagNameNS = getElementsByTagNameNS;
