document.getElementsByClassName = function(className, parentElement) {
 if (Prototype.BrowserFeatures.XPath) {
   var q = ".//*[contains(concat(' ', @class, ' '), ' " + className + " ')]";
   return document._getElementsByXPath(q, parentElement);
 } else {
   var children = ($(parentElement) || document.body).getElementsByTagName('*');
   var elements = [], child;
   for (var i = 0, length = children.length; i < length; i++) {
     child = children[i];
     if (Element.hasClassName(child, className))
       elements.push(Element.extend(child));
   }
   return elements;
 }
};