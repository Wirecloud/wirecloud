from workspace.models import *
from igadget.models import *
from connectable.models import *
from gadget.models import VariableDef, Gadget

from django.db import models

class PendingFkCollection():
    def __init__(self):
        self.table_tuple = {}
    
    def get_pending_fks(self, table_name, old_id):
        if (table_name, old_id) in self.table_tuple:
            return self.table_tuple[(table_name, old_id)]

        return []

    def addPending(self, linker_table, linker_field, linker_tuple_id, referenced_table, referenced_tuple):
        if not (referenced_table, referenced_tuple) in self.table_tuple:
            self.table_tuple[(referenced_table, referenced_tuple)] = []
        
        pendings = self.table_tuple[(referenced_table, referenced_tuple)]
        
        if not (linker_table, linker_field, linker_tuple_id) in pendings:
            pendings.append((linker_table, linker_field, linker_tuple_id))
    
    def delPendient(self, linker_table, linker_field, linker_tuple_id, referenced_table, referenced_tuple):
        if not (referenced_table, referenced_tuple) in self.table_tuple:
            self.table_tuple[(referenced_table, referenced_tuple)] = []

        pendings = self.table_tuple[(referenced_table, referenced_tuple)]

        if (linker_table, linker_field, linker_tuple_id) in pendings:
            pendings.remove((linker_table, linker_field, linker_tuple_id))
    
class IdsMapping():
    def __init__(self):
        self.tables = {}
    
    def getMapping(self, table_name, old_id):
        if not table_name in self.tables:
            return None
        
        mapping = self.tables[table_name]
        
        if not mapping:
            return None
        
        if not old_id in mapping:
            return None
        
        new_id = mapping[old_id]
        
        if not new_id:
            return None
        
        return new_id
    
    def addMapping(self, table_name, old_id, new_id):
        if not table_name in self.tables:
            self.tables[table_name] = {}
        
        mapping = self.tables[table_name]
        
        mapping[old_id] = new_id

class PackageCloner():
    def __init__(self):
        self.mapping = IdsMapping()
        self.pendingFks = PendingFkCollection()
        self.final_tables = ['User', 'VariableValue', 'VariableDef', 'Gadget']
    
    def getMapping(self, table_name, old_id):
        return self.mapping.getMapping(table_name, old_id)
    
    def addMapping(self, table_name, old_id, new_id):
        return self.mapping.addMapping(table_name, old_id, new_id)
    
    def get_fk_tuple (self, tuple, fk_field):
        stm = "fk_id = tuple.%s" % fk_field 
        
        exec(stm)
        
        return fk_id
    
    def get_tuple(self, table_name, tuple_id):
        model = eval(table_name)
    
        tuple = model.objects.get(id=tuple_id)
        
        return tuple
    
    def get_related_tuples(self, table_name, field_name, tuple_id):
        model = eval(table_name)
        
        stm = "tuple_list = model.objects.filter(%s=tuple_id)" % (field_name) 
        
        exec(stm)
        
        return tuple_list

    def get_related_tuple(self, table_name, field_name, tuple_id):
        model = eval(table_name)
        
        stm = "tuple = model.objects.get(%s=tuple_id)" % (field_name) 
        
        exec (stm)
        
        return tuple
    
    def is_final_table(self, table_name):
        return (table_name in self.final_tables)
    
    def update_foreign_keys(self, cloned_tuple, old_pk):
        table_name = cloned_tuple._meta.object_name
        pending_fks = self.pendingFks.get_pending_fks(table_name, old_pk)
        
        for pending_fk in pending_fks:    
            linker_table = pending_fk[0]
            linker_field = pending_fk[1]
            linker_tuple_id = pending_fk[2]

            model = eval(linker_table)
        
            linker_tuple = model.objects.get(id=linker_tuple_id)
        
            stm = "linker_tuple.%s=cloned_tuple" % (linker_field)

            exec(stm)
            
            linker_tuple.save()
            
            self.delete_pending_fk (table_name, old_pk) 
    
    def mark_pending_fk(self, linker_table, linker_field, linker_tuple_id, referenced_table, referenced_tuple):
        self.pendingFks.addPending(linker_table, linker_field, linker_tuple_id, referenced_table, referenced_tuple)

    def delete_pending_fk(self, table_name, fk_id):
        pass
    
    def linkTuple(self, tuple, user):
        pass
    
    def cloneTuple(self, tuple):
        meta = tuple._meta
        table_name = meta.object_name
        
        #Controlling when a final table is reached!
        if (self.is_final_table(table_name)):
            return tuple
        
        #Controlling when a tuple has been previously cloned!
        new_id = self.getMapping(table_name, tuple.id)
        
        if (new_id):
            return self.get_tuple(table_name, new_id)
        else: 
            
            model = eval(table_name)
        
            cloned_tuple = model()
             
            fields = meta.fields
            
            #Cloning all object data!
            for field in fields:  
                if (field != meta.auto_field):   
                    stm = "%s.%s = %s.%s" % ('cloned_tuple', field.name, 'tuple', field.name)              
                     
                    exec(stm)
                                 
            #Getting an id!
            cloned_tuple.save()
            
            #Registering mapping between tuple and cloning tuple!
            self.addMapping(table_name, tuple.id, cloned_tuple.id)

            #Marking all cloned object fks to be updated when the referenced tuple is cloned!
            for field in fields:
                if (isinstance(field, models.ForeignKey)): 
                    referenced_table = field.rel.to._meta.object_name

                    stm = "referenced_tuple = %s.%s.id" % ('tuple', field.name)   
                    
                    exec(stm)
                    
                    linker_table = table_name
                    linker_field = field.name
                    linker_tuple_id = cloned_tuple.id
                    
                    self.mark_pending_fk(linker_table, linker_field, linker_tuple_id, referenced_table, referenced_tuple)
            
            #When a cloned tuple is saved, it's necessary to update pending foreign keys!
            self.update_foreign_keys(cloned_tuple, tuple.id)
            
            #Foreign keys fields must be cloned!
            for field in fields: 
                if (isinstance(field, models.ForeignKey)):                     
                    related_tuple = self.get_fk_tuple(tuple, field.name)
                    
                    cloned_related_tuple = self.cloneTuple(related_tuple)
                    
                    stm = "%s.%s = cloned_related_tuple" % ('cloned_tuple', field.name)                 
                     
                    exec(stm)
                    continue
            
            #Saving already cloned fks!
            cloned_tuple.save()
            
            #Continue iterating over data-model structure
            related_objects = meta._all_related_objects
            
            for related_table in related_objects:
                related_model = related_table.model
                
                related_meta = related_model._meta
                related_table_name = related_meta.object_name
                
                related_tuples = self.get_related_tuples(related_table_name, related_table.field.name, tuple.id)
                for related_tuple in related_tuples:
                    self.cloneTuple(related_tuple)
            
            return cloned_tuple


