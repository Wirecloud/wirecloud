from django.db import models
from django.db.models import get_model

from wirecloud.commons.utils.db import save_alternative

#########################################
# Auxiliar functions
#########################################


def get_tuple(app_label, module_name, tuple_id):
    model = get_model(app_label, module_name)
    return model.objects.get(id=tuple_id)


def get_related_tuples(app_label, module_name, field_name, tuple_id, lookup={}):
    model = get_model(app_label, module_name)
    lookup[field_name] = tuple_id
    return model.objects.filter(**lookup)

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

        for linker_app, linker_table, linker_field, linker_tuple_id in pending_fks:
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

    def get_m2m_info(self, old_from_id, from_meta, from_field, old_to_id, to_meta):
        for m2m_info in self.many2many_list:
            if (m2m_info['old_to_id'] == old_to_id and m2m_info['to_meta'] == to_meta and \
                m2m_info['from_meta'] == from_meta and m2m_info['old_from_id'] == old_from_id and \
                m2m_info['from_field'] == from_field):
                return m2m_info

        return None

    def add_m2m_info(self, old_from_id, new_from_id, from_meta, from_field, old_to_id, new_to_id, to_meta):
        m2m_info = self.get_m2m_info(old_from_id, from_meta, from_field, old_to_id, to_meta)

        if not m2m_info:
            #Time to create the m2m_info object

            m2m_info = {
                'old_from_id': old_from_id,
                'new_from_id': new_from_id,
                'from_meta': from_meta,
                'from_field': from_field,
                'old_to_id': old_to_id,
                'new_to_id': new_to_id,
                'to_meta': to_meta,
                'completed': False,
            }

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
            from_meta = m2m_info['from_meta']
            from_tuple = get_tuple(from_meta.app_label, from_meta.module_name, m2m_info['new_from_id'])
            to_meta = m2m_info['to_meta']
            to_tuple = get_tuple(to_meta.app_label, to_meta.module_name, m2m_info['new_to_id'])

            getattr(from_tuple, m2m_info['from_field']).add(to_tuple)

            from_tuple.save()

            # Erasing m2m_info after linking
            self.many2many_list.remove(m2m_info)


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

    extra_models = {
        'Workspace': (
            ('platform', 'tab', 'workspace'),
            ('platform', 'workspacepreference', 'workspace'),
        ),
        'Tab': (
            ('platform', 'iwidget', 'tab'),
            ('platform', 'tabpreference', 'tab'),
        ),
        'IWidget': (
            ('platform', 'variable', 'iwidget'),
        )
    }

    unique_variant = {
        'Workspace': 'name',
        'Tab': 'name',
    }

    fields_to_overwrite = {
    }

    def __init__(self):
        self.mapping = MappingCollection()
        self.fks = FKCollection()
        self.m2ms = Many2ManyCollection()
        self.final_tables = ('User', 'VariableDef', 'Widget', 'PublishedWorkspace', 'UserWorkspace')

    def is_final_table(self, table_name):
        return table_name in self.final_tables

    def clone_tuple(self, tuple):
        meta = tuple._meta
        table_name = meta.object_name

        # Controlling when a final table is reached!
        if self.is_final_table(table_name):
            return tuple

        # Controlling when a tuple has been previously cloned!
        new_id = self.mapping.get_mapping(table_name, tuple.id)

        if new_id:

            return get_tuple(meta.app_label, meta.module_name, new_id)

        else:

            model = get_model(meta.app_label, table_name)

            cloned_tuple = model()

            fields = meta.fields
            fields_to_overwrite = self.fields_to_overwrite.get(table_name, {})

            # Cloning all object data!
            for field in fields:
                if isinstance(field, models.ForeignKey):
                    # get the id of the foreignKey. It may be optional (None)
                    fkValue = getattr(tuple, field.name)
                    if fkValue:
                        fkValue = self.clone_tuple(fkValue)

                    setattr(cloned_tuple, field.name, fkValue)

                elif field != meta.auto_field:

                    if field.name in fields_to_overwrite:
                        value = fields_to_overwrite[field.name]
                    else:
                        value = getattr(tuple, field.name)

                    setattr(cloned_tuple, field.name, value)

            # Getting an id!
            variant_field = self.unique_variant.get(table_name, None)
            if variant_field is None:
                cloned_tuple.save()
            else:
                save_alternative(model, variant_field, cloned_tuple)

            self.mapping.add_mapping(table_name, tuple.id, cloned_tuple.id)

            ##########################################################################################################
            #Marking many_to_many relationships to be updated when involved tuples are both cloned!
            # Many to many relationships can be iterated over in two different ways:

            #1. cloned FROM-SIDE table first
            m2m_fields = meta.many_to_many

            for m2m_field in m2m_fields:
                field_name = m2m_field.attname
                m2m_objects = getattr(tuple, field_name).all()
                for m2m_object in m2m_objects:
                    referenced_meta = m2m_object._meta
                    referenced_tuple_id = m2m_object.id

                    self.m2ms.add_m2m_info(old_from_id=tuple.id,
                        new_from_id=cloned_tuple.id,
                        from_meta=meta,
                        from_field=field_name,
                        old_to_id=referenced_tuple_id,
                        new_to_id=None,
                        to_meta=referenced_meta)

            #2. cloned TO-SIDE table first
            m2m_related_fields = meta._related_many_to_many_cache

            for m2m_field in m2m_related_fields:
                reverse_rel_name = '%s_set' % m2m_field.var_name

                from_field = m2m_field.field.name

                m2m_objects = getattr(tuple, reverse_rel_name).all()

                for m2m_object in m2m_objects:
                    referenced_meta = m2m_object._meta
                    old_from_id = m2m_object.id

                    self.m2ms.add_m2m_info(old_from_id=old_from_id,
                        new_from_id=None,
                        from_meta=referenced_meta,
                        from_field=from_field,
                        old_to_id=tuple.id,
                        new_to_id=cloned_tuple.id,
                        to_meta=meta)

            ###########################################################################################################

            # Continue iterating over data-model structure
            extra_models = self.extra_models.get(table_name, [])
            for model in extra_models:
                lookup = {}
                if len(model) > 3:
                    lookup = model[3]

                related_tuples = get_related_tuples(model[0],  # app_label
                                                    model[1],  # module_name
                                                    model[2],  # field.name
                                                    tuple.id,
                                                    lookup)
                for related_tuple in related_tuples:
                    self.clone_tuple(related_tuple)

            return cloned_tuple

    def merge_workspaces(self, from_ws, to_ws, user):
        meta = from_ws._meta
        table_name = meta.object_name

        # Registering mapping between tuple and cloning tuple!
        self.mapping.add_mapping(table_name, from_ws.id, to_ws.id)

        self.final_tables = list(self.final_tables)
        self.extra_models['Variable'] = (
            ('platform', 'variablevalue', 'variable', {'user': from_ws.creator}),
        )
        self.fields_to_overwrite['VariableValue'] = {
            'user': user,
        }

        # Continue iterating over data-model structure
        extra_models = self.extra_models.get(table_name, [])
        for model in extra_models:
            related_tuples = get_related_tuples(model[0],  # app_label
                                                model[1],  # module_name
                                                model[2],  # field.name
                                                from_ws.id)
            for related_tuple in related_tuples:
                self.clone_tuple(related_tuple)

        from wirecloud.platform.get_data import _invalidate_cached_variable_values
        _invalidate_cached_variable_values(to_ws)

        return to_ws
