/**
 *
 */
var InterfaceFactory = function InterfaceFactory() {
    var mapping = {
        'boolean': BooleanInputInterface,
        'text': TextInputInterface,
        'password': PasswordInputInterface,
        'hidden': HiddenInputInterface,
        'list': ListInputInterface,
        'integer': IntegerInputInterface,
        'longtext': LongTextInputInterface,
        'url': URLInputInterface,
        'email': EMailInputInterface,
        'select': SelectInputInterface,
        'buttons': ButtonGroupInputInterface,
        'file': FileInputInterface,
        'fieldset': FieldSetInterface,
        'multivalued': MultivaluedInputInterface
    };

    this.createInterface = function createInterface(fieldId, fieldDesc) {
        var Class_ = mapping[fieldDesc.type];
        if (Class_ == null) {
            throw new Error(fieldDesc.type);
        }
        return new Class_(fieldId, fieldDesc);
    };

    this.addFieldType = function addFieldType(type, class_) {
        if (!class_ instanceof InputInterface) {
            throw new TypeError();
        }
        if (mapping[type] !== undefined) {
            throw new Error();
        }

        mapping[type] = class_;
    };
};

InterfaceFactory = new InterfaceFactory();
