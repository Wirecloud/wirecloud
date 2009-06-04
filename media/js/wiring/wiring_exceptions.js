function DontPropagateException(msg) {
    var err = new Error(msg);
    
    // take care of IE5/5.5
    if (!err.message) {
        err.message = msg;
    }
    
    err.name = "DONT_PROPAGATE";
    
    return err;
}