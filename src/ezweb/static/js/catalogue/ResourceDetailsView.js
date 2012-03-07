var ResourceDetailsView = function(id, options) {
    options['class'] = 'resource_details';
    this.catalogue = options.catalogue;
    StyledElements.Alternative.call(this, id, options);

    this.resource_details_painter = new ResourceDetailsPainter(this.catalogue, $('catalogue_resource_details_template').getTextContent(), this.wrapperElement);
}
ResourceDetailsView.prototype = new StyledElements.Alternative();

ResourceDetailsView.prototype.paint = function(resource) {
    this.resource_details_painter.paint(resource);
};
