from django.db import models
from django.db.models import get_model

from workspace.packageLinker import PackageLinker


#########################################
# Auxiliar functions
#########################################


def get_fk_tuple(obj, fk_field):
    return getattr(obj, fk_field)


def get_tuple(app_label, module_name, tuple_id):
    model = get_model(app_label, module_name)
    return model.objects.get(id=tuple_id)


def get_related_tuples(app_label, module_name, field_name, tuple_id):
    model = get_model(app_label, module_name)
    kwargs = {}
    kwargs[field_name] = tuple_id
    return model.objects.filter(**kwargs)

#################################################
## Logic classes
#################################################


class FKCollection:

    def __init__(self):
        self.table_tuple = {}

    def get_fks(self, table_name, old_id):
        if (table_name, old_id) in self.table_tuple:
            return self.table_tuple[(table_name, old_id)]

        return []

    def update_fks(self, cloned_tuple, old_pk):
        table_name = cloned_tuple._meta.object_name
        pending_fks = self.get_fks(table_name, old_pk)

        for (linker_app, linker_table, linker_field, linker_tuple_id) in pending_fks:
            model = get_model(linker_app, linker_table)

            linker_tuple = model.objects.get(id=linker_tuple_id)

            setattr(linker_tuple, linker_field, cloned_tuple)

            linker_tuple.save()

    def add_fk(self, linker_app, linker_table, linker_field, linker_tuple_id, referenced_table, referenced_tuple):
        if not (referenced_table, referenced_tuple) in self.table_tuple:
            self.table_tuple[(referenced_table, referenced_tuple)] = []

        fks = self.table_tuple[(referenced_table, referenced_tuple)]

        if not (linker_table, linker_field, linker_tuple_id) in fks:
            fks.append((linker_app, linker_table, linker_field, linker_tuple_id))


class Many2ManyCollection:

    def __init__(self):
        self.many2many_list = []

    def get_m2m_info(self, old_from_id, from_table, from_field, old_to_id, to_table):
        for m2m_info in self.many2many_list:
            if (m2m_info['old_to_id'] == old_to_id and m2m_info['to_table'] == to_table and \
                m2m_info['from_table'] == from_table and m2m_info['old_from_id'] == old_from_id and \
                m2m_info['from_field'] == from_field):
                return m2m_info

        return None

    def add_m2m_info(self, old_from_id, new_from_id, from_table, from_field, old_to_id, new_to_id, to_table):
        m2m_info = self.get_m2m_info(old_from_id, from_table, from_field, old_to_id, to_table)

        if (not m2m_info):
            #Time to create the m2m_info object

            m2m_info = dict()

            m2m_info['old_from_id'] = old_from_id
            m2m_info['new_from_id'] = new_from_id
            m2m_info['from_table'] = from_table
            m2m_info['from_field'] = from_field
            m2m_info['old_to_id'] = old_to_id
            m2m_info['new_to_id'] = new_to_id
            m2m_info['to_table'] = to_table
            m2m_info['completed'] = False

            self.many2many_list.append(m2m_info)

            return

        if not m2m_info['new_from_id'] and new_from_id:
            #Missing info about new from id
            #Updating only new data

            m2m_info['new_from_id'] = new_from_id
            m2m_info['completed'] = True

            self.update_m2m(m2m_info)

            return

        if not m2m_info['new_to_id'] and new_to_id:
            #Missing info about new to id
            #Updating only new data

            m2m_info['new_to_id'] = new_to_id
            m2m_info['completed'] = True

            self.update_m2m(m2m_info)

            return

        pass

    def update_m2m(self, m2m_info):
        if m2m_info['completed']:
            from_model = eval(m2m_info['from_table'])
            from_tuple = from_model.objects.get(id=m2m_info['new_from_id'])

            to_model = eval(m2m_info['to_table'])
            to_tuple = to_model.objects.get(id=m2m_info['new_to_id'])

            getattr(from_tuple, m2m_info['from_field']).add(to_tuple)

            from_tuple.save()

            #Erasing m2m_info after linking
            self.many2many_list.remove(m2m_info)
            del m2m_info


class MappingCollection:

    def __init__(self):
        self.tables = {}

    def get_mapping(self, table_name, old_id):
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

    def add_mapping(self, table_name, old_id, new_id):
        if not table_name in self.tables:
            self.tables[table_name] = {}

        mapping = self.tables[table_name]

        mapping[old_id] = new_id


class PackageCloner:

    def __init__(self):
        self.mapping = MappingCollection()
        self.fks = FKCollection()
        self.m2ms = Many2ManyCollection()
        self.final_tables = ['User', 'VariableDef', 'Gadget', 'PublishedWorkSpace', 'Filter', 'UserWorkSpace', 'RemoteChannel', 'SharedVariableDef', 'SharedVariableValue', 'Branding']

    def is_final_table(self, table_name):
        return (table_name in self.final_tables)

    def clone_tuple(self, tuple):
        meta = tuple._meta
        table_name = meta.object_name

        #Controlling when a final table is reached!
        if (self.is_final_table(table_name)):
            return tuple

        #Controlling when a tuple has been previously cloned!
        new_id = self.mapping.get_mapping(table_name, tuple.id)

        if (new_id):
            return get_tuple(meta.app_label, meta.module_name, new_id)
        else:

            model = get_model(meta.app_label, table_name)

            cloned_tuple = model()

            fields = meta.fields

            #Cloning all object data!
            for field in fields:
                if (field != meta.auto_field):
                    setattr(cloned_tuple, field.name, getattr(tuple, field.name))

            #Getting an id!
            cloned_tuple.save()

            #Registering mapping between tuple and cloning tuple!
            self.mapping.add_mapping(table_name, tuple.id, cloned_tuple.id)

            #Marking all cloned object fks to be updated when the referenced tuple is cloned!
            for field in fields:
                if (isinstance(field, models.ForeignKey)):
                    referenced_table = field.rel.to._meta.object_name

                    #get the id of the foreignKey. It may be optional (Null)
                    fkValue = getattr(tuple, field.name)
                    if fkValue:
                        referenced_tuple = fkValue.id

                        linker_app = meta.app_label
                        linker_table = table_name
                        linker_field = field.name
                        linker_tuple_id = cloned_tuple.id

                        self.fks.add_fk(linker_app, linker_table, linker_field, linker_tuple_id, referenced_table, referenced_tuple)

            ##########################################################################################################
            #Marking many_to_many relationships to be updated when involved tuples are both cloned!
            # Many to many relationships can be iterated over in two different ways:

            #1. cloned FROM-SIDE table first
            m2m_fields = meta.many_to_many

            for m2m_field in m2m_fields:
                field_name = m2m_field.attname
                m2m_objects = getattr(tuple, field_name).all()
                for m2m_object in m2m_objects:
                    referenced_model = m2m_object._meta.object_name
                    referenced_tuple_id = m2m_object.id

                    self.m2ms.add_m2m_info(old_from_id=tuple.id, new_from_id=cloned_tuple.id, from_table=table_name, from_field=field_name,
                                           old_to_id=referenced_tuple_id, new_to_id=None, to_table=referenced_model)

            #2. cloned TO-SIDE table first
            m2m_related_fields = meta._related_many_to_many_cache

            for m2m_field in m2m_related_fields:
                reverse_rel_name = '%s_set' % m2m_field.var_name

                from_field = m2m_field.field.name
                from_table_name = m2m_field.model._meta.object_name

                m2m_objects = getattr(tuple, reverse_rel_name).all()

                for m2m_object in m2m_objects:
                    old_from_id = m2m_object.id

                    self.m2ms.add_m2m_info(old_from_id=old_from_id, new_from_id=None, from_table=from_table_name, from_field=from_field,
                                           old_to_id=tuple.id, new_to_id=cloned_tuple.id, to_table=table_name)
            ###########################################################################################################

            #When a cloned tuple is saved, it's necessary to update pending foreign keys!
            self.fks.update_fks(cloned_tuple, tuple.id)

            #Foreign keys fields must be cloned!
            for field in fields:
                if (isinstance(field, models.ForeignKey)):
                    related_tuple = get_fk_tuple(tuple, field.name)

                    #check if the foreign key is empty
                    if related_tuple:
                        cloned_related_tuple = self.clone_tuple(related_tuple)
                        setattr(cloned_tuple, field.name, cloned_related_tuple)

                    continue

            #Saving already cloned fks!
            cloned_tuple.save()

            #Continue iterating over data-model structure
            related_objects = meta._related_objects_cache.keys()

            for related_table in related_objects:
                related_model = related_table.model

                related_meta = related_model._meta

                related_tuples = get_related_tuples(related_meta.app_label,
                                                    related_meta.module_name,
                                                    related_table.field.name,
                                                    tuple.id)
                for related_tuple in related_tuples:
                    self.clone_tuple(related_tuple)

            return cloned_tuple

    def merge_workspaces(self, from_ws, to_ws, user):
        meta = from_ws._meta
        table_name = meta.object_name

        #Registering mapping between tuple and cloning tuple!
        self.mapping.add_mapping(table_name, from_ws.id, to_ws.id)

        #Continue iterating over data-model structure
        related_objects = meta._related_objects_cache.keys()

        for related_table in related_objects:
            related_model = related_table.model

            related_meta = related_model._meta
            related_table_name = related_meta.object_name

            related_tuples = get_related_tuples(related_table_name, related_table.field.name, from_ws.id)
            for related_tuple in related_tuples:
                self.clone_tuple(related_tuple)

        # Linking merged workspace
        packageLinker = PackageLinker()

        packageLinker.link_workspace(to_ws, user, from_ws.creator)

        return to_ws
