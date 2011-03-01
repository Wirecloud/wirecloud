# See license file (LICENSE.txt) for info about license terms.

import datetime
import re

from clients.python import ezsteroids_api
from pbums.models import Category, Property


def get_category_list():
    """Consigue todas las categorias"""
    api = ezsteroids_api.API()
    return api.get_all_categories()


def get_category(category_id):
    """Obtener una categoria"""
    category_list = get_category_list()
    for cat in category_list:
        if cat.id == category_id:
            return cat
    return None


def evaluate_category(user, category):
    """Evalua una categoria para un usuario"""
    if user.is_authenticated():
        api = ezsteroids_api.API()
        try:
            return api.check_category(user.username, category.slug)
        except ezsteroids_api.StatusException:
            return False
    else:
        return False


def _permission_user(user):
    api = ezsteroids_api.API()
    permissions_user = api.get_user_policies(user.username)
    return permissions_user


def _permission_category(user, categories):
    permission_category = []
    for category in categories:
        eval_category = _eval(category.predicates, {'user': user})
        if eval_category:
            permission_category = (permission_category and permission_category | category.policies) or  category.policies
    return permission_category

user_re = re.compile(r'{{ user.(?P<name>\w+) }}')
profile_re = re.compile(r'{{ profile.(?P<name>\w+) }}')
category_re = re.compile(r'{{ category.(?P<slug>[\.\-\_\w]+) }}')


def _eval(predicates, dict_variables):

    try:

        def user_changes(match):
            name = match.group('name')
            return " user.%s " % name

        def profile_changes(match):
            if not dict_variables['user'].is_anonymous():
                name = match.group('name')
                variable_name = "%s_%s" % (name, len(dict_variables))
                property = Property.objects.get(user=dict_variables['user'], property_type__name=name)
                value = property.value
                if property.property_type.type == "D":
                    value_split = value.split('-')
                    value = datetime.date(int(value_split[0]), int(value_split[1]), int(value_split[2]))
                dict_variables[variable_name] = value
                return variable_name
            else:
                return False

        def category_changes(match):
            slug = match.group('slug')
            variable_name = "%s_%s" % (slug, len(dict_variables))
            variable_name = variable_name.replace('-', '_')
            dict_variables[variable_name] = evaluate_category(dict_variables['user'], Category.objects.get(slug=slug))
            return variable_name

        predicates = user_re.sub(user_changes, predicates)
        predicates = profile_re.sub(profile_changes, predicates)
        predicates = category_re.sub(category_changes, predicates)

        dict_variables['datetime'] = datetime
        return_eval = eval(predicates, dict_variables)
        return return_eval
    except SyntaxError, e:
        raise SyntaxError(e)
    except NameError, e:
        raise NameError(e)
    except:
        return False
