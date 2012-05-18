/*
 * * clase Operador que define la estructura y funcionalidad para un tipo de operador (por ejemplo: búsqueda)
 * * ¿clase base para las instancias de los operadores?
 * * instancia de ejemplo del operador búsqueda (de principio no hace falta acceder a ningún servicio, pero tiene que comportarse de forma asíncrona)
 * * código de ejemplo para usar el operador (simular el código de un gadget para usar los operadores configurados [el gadget no dice directamente que operador quiere usar, si acaso dice que tipo y el usuario es el que los búsca y asocia]).
*
 *
 * El operador de búsqueda debe permitir obtener elementos de forma paginada (dividiendo la búsqueda en bloques con un número máximo de resultados).
 */

/**
*
*class OperatorParam
*
**/
function OperatorParam (name, label, desc, type, index, required, defaultValue){
    this.name = name;
    this.label = label;
    this.desc = desc;
    this.type = type;
    this.index = index;
    this.required = !!required;
    this.defaultValue = defaultValue;
    //multievaluado !! bool
}

OperatorParam.prototype.getName = function() {
    return this.name;
}

OperatorParam.prototype.getDescription = function getDescription() {
    return this.desc;
}

OperatorParam.prototype.getType = function() {
    return this.type;
}

OperatorParam.prototype.getLabel = function() {
    return this.label;
}

OperatorParam.prototype.getIndex = function() {
    return this.index;
}

OperatorParam.prototype.getRequired = function() {
    return this.required;
}

OperatorParam.prototype.getDefaultValue = function() {
    return this.defaultValue;
}


OperatorParam.prototype.validate = function(value) {
    var current_pattern, current_modifiers, interger_value, jpath_exp, msg;
    if(!value){
        if(this.getRequired()){
            throw Error (gettext("A value for '%(opParamName)s' is required"),{opParamName: this.name},true);
        }
    }
    // Checks the type of parameter
    switch (this.getType()){
    case 'N': // Param is Number
        interger_value = Number(value);
        if (isNaN(interger_value)){
            var msg = interpolate(gettext("Error loading parameter '%(opParamName)s'. It must be a number"), {opParamName: this.name}, true);
            throw Error (gettext(msg));
        }
        break;
    case 'regexp': // Param is RegExp
        if ((value.indexOf('/') == 0) && (value.lastIndexOf('/') > 0)){
            current_pattern = value.substring(1, value.lastIndexOf('/'));
            current_modifiers = value.substring(value.lastIndexOf('/') + 1, value.length);
            //This new RegExp launch exceptions if the ER have any problem.
            new RegExp(current_pattern, current_modifiers);
        }else {
            new RegExp (value);
        }
        break;
    //CArlos: Esto está copiado literal de param.validate, revisar el parse y el replace
    case 'jpath': // Param is a JPATH expresion (for JSON)
        jpath_exp = this.parse(value);
        break;
    default: // Otherwise is String
        value.replace(/"/g,"'");
        break;
    }
};

/**
*
*class OperatorMeta
*
**/
function OperatorMeta (name, desc, inputs, outputs, code){
    //new operator name
    this.name = name;
    this.desc = desc;
    //inputs
    this.inputs = []
    if (inputs != null && inputs != '') {
        var i, inp;
        this.inputs.length = inputs.length;
        for (i = 0; i < inputs.length; i++) {
            inp = inputs[i];
            this.addInput(inp);
        }
    }
    //outputs
    this._outputs
     = []
    if (outputs != null && outputs != '') {
        var i, outp;
        this._outputs.length = outputs.length;
        for (i = 0; i < outputs.length; i++) {
            outp = outputs[i];
            this.addOutput(outp);
        }
    }
    // Sets the operator code
    try{
        //this._code = code
        eval ('this._code = ' + code);
        if ((typeof this._code) != 'function'){
            this._code = null;
        }
    }catch(e){
        this._code = null;
        var msg = interpolate(gettext("Error loading code of the operator '%(operatorName)s'."), {operatorName: this.name}, true);
        LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
    }
}
OperatorMeta.prototype.getName = function getName(inputObj) {
    return this.name;
}
OperatorMeta.prototype.getDescription = function getDescription(inputObj) {
    return this.desc;
}
OperatorMeta.prototype.setInput = function(inputObj) {
    this.inputs[inputObj.getIndex()] = inputObj;
}
OperatorMeta.prototype.setOutput = function(outputObj) {
    this._outputs[outputObj.getIndex()] = outputObj;
}
OperatorMeta.prototype.getInputs = function getInputs() {
    return this.inputs;
}
OperatorMeta.prototype.getOutputs = function getOutputs() {
    return this._outputs;
}
OperatorMeta.prototype.addInput = function(input) {
    if (this.inputs[input.index] == null ){
        inputObject = new OperatorParam(input.name, input.label, input.desc, input.type, input.index, input.required, input.defaultValue);
        this.setInput(inputObject);
    }
    else{
        var msg = interpolate(gettext("the input param with index '%(ind)s' is already in use."), {ind:input.index}, true);
        LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
        return;
    }
}
OperatorMeta.prototype.addOutput = function(output) {
    if (this._outputs[output.index] == null) {
        outputObject = new OperatorParam(output.name, output.label, output.desc, output.type, output.index, output.required, output.defaultValue);
        this.setOutput(outputObject);
    } else {
        var msg = interpolate(gettext("the input param with index '%(ind)s' is already in use."), {ind:output.index}, true);
        LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
        return;
    }
}

OperatorMeta.prototype.instanciate = function(id) {
    return new Operator(this, id);
};

/**
* 
* process method for OperatorMeta
* 
**/
OperatorMeta.prototype.process = function(inputValues_, callback) {
    var i, result;
    try{
        //valide Inputs
        for (i=0; i < this.inputs.length; ++i){
            this.inputs[i].validate(inputValues_[i]);
        }
    }
    catch (e){
        //Operation Param error
        LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
        //???
        return;        
    }
    try{
        //callback
        result = this._code (inputValues_);
        callback(result);
    }
    catch (err){
        var msg = interpolate(gettext("'%(opName)s', error in callback"), {opName: this.name}, true);
        LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
    }
}







/**  /////////////////////////////////////////otras cosas////////////////////////////////// **/

/**
*
*class SearchOperatorMeta
*
**/
function SearchOperatorMeta () {
    this.name = 'search';

    this.inputs = {
        keyword: {type: 'string', required: true, help_text: 'search keyword'},
        nitems: {type: 'integer', required: false, defaultValue: 0},
        offset: {type: 'integer', required: false, defaultValue: 0, help_text: 'a initial position in the search result'}
    }
    this.outputs = {
        result: {},
    }
};

/**
*
*class SimpleSearchOperator
*
**/
function SimpleSearchOperator () {
    this.type = 'search';

    this.overrides = {
        nitems: {max: 100}
    };

    this._datos = ['pizza carbonara', 'pizza romana', 'pizza pollo', 'pizza barbacoa', 'pizza gato', 'pizza piña', 'cocacola', 'sopa de verduras', 'sopa de marisco', 'sopa de caracol'];
    //SearchOperatorMeta.call(this, keyword, nitems, offset, resultList, totalResult);
};

//SimpleSearchOperator.prototype = new SearchOperatorMeta();

SimpleSearchOperator.prototype.process = function (inputs, callback) {
    var i, n, resul;
    var key, nitems, offset;
    resul = [];
    n = 0;
    ////ej: inputs = {keyword: 'pizza', nitems: 10, offset: 0}/////
    key =  inputs.keyword;
    nitems = inputs.nitems;
    offset = inputs.offset;
    ///////
    for (i = offset; i < this.datos.length; i += 1) {
        if (this.datos[i].include(key)) {
            n += 1;
            resul.push(this.datos[i]);
            if (n == nitems) {
                break;
            }
        }
    }
    callback(resul);
}


/**
*
*class GoogleSearchOperator
*
**/
function GoogleSearchOperator () {
    this.predir = "http://www.google.com/search?hl=es&q=";
    //SearchOperatorMeta.call(this, keyword, nitems, offset, resultList, totalResult);
};

//GoogleSearchOperator.prototype = new SearchOperatorMeta();

GoogleSearchOperator.prototype.process = function (inputs, callback) {
    var searchdir, params;

    params = {
        q: inputs.keyword,
        num: inputs.nitems,
        start: inputs.offset,
        key: 'AIzaSyBTcQFh04aBAxXw9THgzEW_iYOQMwImF3Y'
    };

    new Ajax.Request("https://www.googleapis.com/customsearch/v1", {
        method: 'GET',
        parameters: params,
        onError: function(XMLHttpRequest, textStatus, errorThrown) {
            alert(textStatus+" - "+errorThrown);
        },
        onSuccess: function(transport) {
            var data = JSON.parse(transport.responseText);
//          datos
            callback(data);
        }
	});
}



/*****************************************/
/**?¿**/
function TruncateListOperator () {

};

TruncateListOperator.prototype.process = function(inputs, callback) {
    var lista;
    lista = inputs.list;
    trunk = inputs.trunk;
    lista.length = trunk;
    callback (lista);
}
/*********************************************************************************/

var test_callback = function (results) {
    alert (results);
};


//var OperatorManager = function() {
//};

//OperatorManager.registry('search', GoogleSearchOperator);
//OperatorManager.registry('search', SimpleSearchOperator);


/*como seria una llamada un operador(alvaro):
var operador = __(por definir)__ -->this.giveMyOperator('search');
operador.process({keyword: 'pizza', nitems: 10, callback: searchFinished}) 

así lo llamaba yo:

op = new SimpleSearchOperator
op.process({keyword: 'pizza', nitems: 4, offset: 0},function(n) {alert(n)})
*/


/*

Casos de uso:

    1. Crear un gadget de búsquedas genérico.

       El gadget define en el template que necesita un operador de búsqueda para hacer las búsquedas (el gadget no contiene el código para buscar). La lección de operador la realiza el usuario.


    2. Crear un gadget que maneje datos de forma genérica (hasta un punto en concreto) y necesite un operador que haga cosas avanzadas o proporcione más valor a estos datos. Ejemplo, un gadget que busque y muestre una lista con los resultados, pero que realmente no sepa interpretar estos datos más allá de mostrar el titulo, descripción y un icono. En este caso el operador hay que buscarlo indicando el tipo de los datos sin intervención del usuario.
       Esto también nos lleva a plantearnos:
            * ¿el operador tiene que crear un gadget para visualizar los datos?
            * ¿el operador lo puede proporcionar un gadget y por lo tanto es él el que muestra los datos? ¿En caso de que haya más de un gadget con este operador?
            * ¿el operador genera la vista y se la devuelve al gadget? ¿El operador puede crear una pestaña en el gadget que lo ejecuta?, Pegas:
                + Ahora mismo las variables de eventos son estáticas (tienen que venir definidas en el template), por lo que si algunos de los datos nuevos son interesantes para propagar por el wiring habría que permitir eventos dinámicos. Esto también implica que aparecerían eventos en el wiring que habría que cablear (ahora mismo no se cablean solas).
*/

var Operator = function(operator_meta, id) {
    var i, inputs, outputs;

    this.meta = operator_meta;
    this.id = id;

    inputs = this.meta.getInputs();
    this.inputs = [];
    for (i = 0; i < inputs.length; i += 1) {
        this.inputs.push(new OperatorEndpoint(this, inputs[i]));
    }

    outputs = this.meta.getOutputs();
    this.outputs = [];
    for (i = 0; i < outputs.length; i += 1) {
        this.outputs.push(new OperatorEndpoint(this, outputs[i]));
    }
};

Operator.prototype.getId = function getId() {
    return this.id;
};

Operator.prototype.getName = function getName() {
    return this.meta.getName();
};

Operator.prototype.getInputs = function getInputs() {
    return this.inputs;
};

Operator.prototype.getOutputs = function getOutputs() {
    return this.outputs;
};



var OperatorEndpoint = function OperatorEndpoint(operator, meta) {
    Object.defineProperty(this, 'meta', {value: meta});
    Object.defineProperty(this, 'operator', {value: operator});
};

OperatorEndpoint.prototype.serialize = function serialize() {
    return {
        'type': 'ioperator',
        'ioperator': this.operator.getId(),
        'endpoint': this.meta.getName()
    };
};
