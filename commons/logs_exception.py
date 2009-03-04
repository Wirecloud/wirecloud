import StringIO
import os
import sys
import codecs
import traceback

from datetime import datetime

class TracedServerError(Exception):
    exception = None
    arguments = None
    url = None
    
    inner_exception_description = None
    info = None
    
    def __init__(self, exception, arguments, request, msg):
        self.msg = msg
        self.exception = exception
        self.arguments = arguments
        self.request = request
        
        exc_type, exc_value, exc_tb = sys.exc_info()
        info_array = traceback.format_exception(exc_type, exc_value, exc_tb)
        
        info = ""
        for line in info_array:
            info += line
    
        exc_name = unicode(exc_type.__name__)
        exc_desc = str(exc_value).decode("utf-8")
    
        self.inner_exception_description = "[%(exc_name)s] %(exc_desc)s" % {"exc_name": exc_name, "exc_desc": exc_desc}
        self.info = info
    
    def get_inner_exception_description(self):
        return self.inner_exception_description
    
    def get_inner_exception_info(self):
        return self.info
    
    def get_inner_exception_message(self):
    	if hasattr(self.exception, 'msg'):
    	    return self.exception.msg
        else:
            return self.inner_exception_description
        
    def print_trace(self):
        buffer = StringIO.StringIO()
        
        buffer.write("\n################# ARGS #######################\n")
        
        #MESSAGE
        buffer.write("MESSAGE: ")
        buffer.write(self.msg)
        buffer.write("\n")
        
        #ARGUMENTS
        buffer.write("ARGUMENTS: ")
        buffer.write(self.arguments)
        buffer.write("\n")
        
        #ERROR
        buffer.write("ERROR: ")
        buffer.write(self.exception)
        buffer.write("\n")
        
        buffer.write("################### END #####################\n")
        
        return buffer.getvalue()
    
    def print_full_trace(self):
        buffer = StringIO.StringIO()
        
        buffer.write(self.print_trace())
        buffer.write(self.get_inner_exception_info())
        
        return buffer.getvalue()