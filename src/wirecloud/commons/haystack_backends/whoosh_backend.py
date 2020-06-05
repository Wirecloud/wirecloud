# encoding: utf-8
"""Experimental Whoosh Grouping / Field Collapsing backend for Haystack 2.0"""
# NOTE: You must be running the latest PyWhoosh master - no PyPI release yet!
# See https://gist.github.com/3750774 for the current version of this code
# See http://wiki.apache.org/Whoosh/FieldCollapsing for the Whoosh feature documentation
from __future__ import absolute_import

import warnings

from django.conf import settings
from django.utils.encoding import force_text
from haystack.backends.whoosh_backend import WhooshEngine as OriginalWhooshEngine, WhooshSearchBackend, WhooshSearchQuery
from haystack.exceptions import SearchBackendError
from haystack.constants import DJANGO_CT, DJANGO_ID
from haystack.models import SearchResult
from haystack.query import SearchQuerySet
from haystack.utils import get_model_ct
from haystack import indexes
from haystack.fields import FacetMultiValueField
from haystack.utils.app_loading import haystack_get_model
from whoosh.query import And, Or, Term
from whoosh.sorting import FieldFacet


class GroupedSearchQuery(WhooshSearchQuery):

    def __init__(self, *args, **kwargs):
        super(GroupedSearchQuery, self).__init__(*args, **kwargs)
        self.grouping_field = None
        self.group_order_by = None
        self._total_document_count = None

    def _clone(self, **kwargs):
        clone = super(GroupedSearchQuery, self)._clone(**kwargs)
        clone.grouping_field = self.grouping_field
        clone.group_order_by = self.group_order_by
        return clone

    def add_group_by(self, field_name, order_by=None):
        self.grouping_field = field_name
        self.group_order_by = order_by

    def get_count(self):
        if self.grouping_field is not None:
            return len(self.get_results())
        else:
            return super(GroupedSearchQuery, self).get_count()

    def get_total_document_count(self):
        """Return the total number of matching documents rather than document groups
        If the query has not been run, this will execute the query and store the results.
        """
        if self._total_document_count is None:
            self.run()

        return self._total_document_count

    def build_params(self, *args, **kwargs):
        res = super(GroupedSearchQuery, self).build_params(*args, **kwargs)

        if self.grouping_field is not None:
            res["collapse"] = self.grouping_field
            res["collapse_limit"] = 5
            self.result_class = GroupedSearchResult
            res['result_class'] = GroupedSearchResult

        if self.group_order_by is not None:
            res["collapse_order"] = self.group_order_by

        return res


class GroupedSearchResult(object):

    def __init__(self, field_name, group_data):
        self.field_name = field_name
        self.key = group_data[0][field_name]  # TODO: convert _to_python
        self.hits = len(group_data)
        self.documents = list(self.process_documents(group_data))

    def __unicode__(self):
        return ''

    def process_documents(self, doclist):
        # TODO: tame import spaghetti

        from haystack import connections
        engine = connections["default"]

        unified_index = engine.get_unified_index()
        indexed_models = unified_index.get_indexed_models()

        for raw_result in doclist:
            app_label, model_name = raw_result[DJANGO_CT].split('.')
            additional_fields = {}
            model = haystack_get_model(app_label, model_name)

            if model and model in indexed_models:
                for key, value in raw_result.items():
                    index = unified_index.get_index(model)
                    string_key = str(key)
                    if string_key in index.fields and hasattr(index.fields[string_key], 'convert'):
                        additional_fields[string_key] = index.fields[string_key].convert(value)

                result = SearchResult(app_label, model_name, raw_result[DJANGO_ID], 1, **additional_fields)
                yield result


class GroupedSearchQuerySet(SearchQuerySet):

    def __init__(self, *args, **kwargs):
        super(GroupedSearchQuerySet, self).__init__(*args, **kwargs)

        if not isinstance(self.query, GroupedSearchQuery):
            raise TypeError("GroupedSearchQuerySet must be used with a GroupedSearchQuery query")

    def group_by(self, field, **kwargs):
        """Have Whoosh group results based on the provided field name"""
        clone = self._clone()
        clone.query.add_group_by(field, **kwargs)
        return clone

    def post_process_results(self, results):
        # Override the default model-specific processing
        return results

    def total_document_count(self):
        """Returns the count for the total number of matching documents rather than groups
        A GroupedSearchQuerySet normally returns the number of document groups; this allows
        you to indicate the total number of matching documents - quite handy for making facet counts match the
        displayed numbers
        """
        if self.query.has_run():
            return self.query.get_total_document_count()
        else:
            clone = self._clone()
            return clone.query.get_total_document_count()


class GroupedWhooshSearchBackend(WhooshSearchBackend):

    def search(self, query_string, sort_by=None, start_offset=0, end_offset=None,
               fields='', highlight=False, facets=None, date_facets=None, query_facets=None,
               narrow_queries=None, spelling_query=None, within=None,
               dwithin=None, distance_point=None, models=None,
               limit_to_registered_models=None, result_class=None, **kwargs):
        if not self.setup_complete:
            self.setup()

        # A zero length query should return no results.
        if len(query_string) == 0:
            return {
                'results': [],
                'hits': 0,
            }
        query_string = force_text(query_string)

        # A one-character query (non-wildcard) gets nabbed by a stopwords
        # filter and should yield zero results.
        if len(query_string) <= 1 and query_string != u'*':
            return {
                'results': [],
                'hits': 0,
            }

        reverse = False

        if sort_by is not None:
            # Determine if we need to reverse the results and if Whoosh can
            # handle what it's being asked to sort by. Reversing is an
            # all-or-nothing action, unfortunately.
            sort_by_list = []
            reverse_counter = 0

            for order_by in sort_by:
                if order_by.startswith('-'):
                    reverse_counter += 1

            if reverse_counter and reverse_counter != len(sort_by):
                raise SearchBackendError("Whoosh requires all order_by fields"
                                         " to use the same sort direction")

            for order_by in sort_by:
                if order_by.startswith('-'):
                    sort_by_list.append(order_by[1:])

                    if len(sort_by_list) == 1:
                        reverse = True
                else:
                    sort_by_list.append(order_by)

                    if len(sort_by_list) == 1:
                        reverse = False

            sort_by = sort_by_list[0]

        if facets is not None:
            warnings.warn("Whoosh does not handle faceting.", Warning, stacklevel=2)

        if date_facets is not None:
            warnings.warn("Whoosh does not handle date faceting.", Warning, stacklevel=2)

        if query_facets is not None:
            warnings.warn("Whoosh does not handle query faceting.", Warning, stacklevel=2)

        narrowed_results = None
        self.index = self.index.refresh()

        if limit_to_registered_models is None:
            limit_to_registered_models = getattr(settings, 'HAYSTACK_LIMIT_TO_REGISTERED_MODELS', True)

        if models and len(models):
            model_choices = sorted(get_model_ct(model) for model in models)
        elif limit_to_registered_models:
            # Using narrow queries, limit the results to only models handled
            # with the current routers.
            model_choices = self.build_models_list()
        else:
            model_choices = []

        narrow_searcher = None

        if narrow_queries is not None:
            # Potentially expensive? I don't see another way to do it in Whoosh...
            narrow_searcher = self.index.searcher()

            for nq in narrow_queries:
                recent_narrowed_results = narrow_searcher.search(self.parser.parse(force_text(nq)),
                                                                 limit=None)

                if len(recent_narrowed_results) <= 0:
                    return {
                        'results': [],
                        'hits': 0,
                    }

                if narrowed_results:
                    narrowed_results.filter(recent_narrowed_results)
                else:
                    narrowed_results = recent_narrowed_results

        self.index = self.index.refresh()

        if self.index.doc_count():
            parsed_query = self.parser.parse(query_string)
            if len(model_choices) > 0:
                narrow_model = [Term(DJANGO_CT, rm) for rm in model_choices]
                parsed_query = And([Or(narrow_model), parsed_query])

            searcher = self.index.searcher()

            # In the event of an invalid/stopworded query, recover gracefully.
            if parsed_query is None:
                return {
                    'results': [],
                    'hits': 0,
                }

            page_num, page_length = self.calculate_page(start_offset, end_offset)

            collapse_field = kwargs.get("collapse")
            collapse_limit = kwargs.get("collapse_limit")

            search_kwargs = {
                'pagelen': page_length,
                'sortedby': sort_by,
                'reverse': reverse
            }

            if collapse_field is not None:
                search_kwargs['collapse'] = FieldFacet(collapse_field)
                search_kwargs['collapse_limit'] = 1

                if kwargs.get("collapse_order") is not None:
                    order = kwargs.get("collapse_order")
                    collapse_order = FieldFacet(order.replace('-', ''), reverse=order.find('-') > -1)
                    search_kwargs['collapse_order'] = collapse_order

            # Handle the case where the results have been narrowed.
            if narrowed_results is not None:
                search_kwargs['filter'] = narrowed_results

            try:
                raw_page = searcher.search_page(parsed_query, page_num, **search_kwargs)
            except ValueError:
                if not self.silently_fail:
                    raise

                return {
                    'results': [],
                    'hits': 0,
                    'spelling_suggestion': None,
                }

            # Because as of Whoosh 2.5.1, it will return the wrong page of
            # results if you request something too high. :(
            grouped_results = None
            if raw_page.pagenum < page_num:
                return {
                    'results': [],
                    'hits': 0,
                    'spelling_suggestion': None,
                }
            if collapse_field is not None and collapse_limit > 1:
                search_kwargs = {
                    'sortedby': collapse_order
                }
                grouped_results = []
                for result in raw_page:
                    query = And([Term(collapse_field, result[collapse_field]), parsed_query])
                    results = searcher.search(query, limit=collapse_limit, **search_kwargs)

                    grouped_results.append(results)

            results = self._process_results(raw_page, result_class=result_class, collapse_field=collapse_field, grouped_results=grouped_results)
            searcher.close()

            if hasattr(narrow_searcher, 'close'):
                narrow_searcher.close()

            return results
        else:
            if self.include_spelling:
                if spelling_query:
                    spelling_suggestion = self.create_spelling_suggestion(spelling_query)
                else:
                    spelling_suggestion = self.create_spelling_suggestion(query_string)
            else:
                spelling_suggestion = None

            return {
                'results': [],
                'hits': 0,
                'spelling_suggestion': spelling_suggestion,
            }

    def build_schema(self, fields):

        for field_name, field_class in fields.items():
            # Convert FacetFields into FacetMultiValueFields
            if field_class.field_type is None and hasattr(field_class, "facet_for"):
                field_class.is_multivalued = True

        return super(GroupedWhooshSearchBackend, self).build_schema(fields)

    def build_search_kwargs(self, *args, **kwargs):
        group_kwargs = [(i, kwargs.pop(i)) for i in kwargs.keys() if i.startswith("group")]

        res = super(GroupedWhooshSearchBackend, self).build_search_kwargs(*args, **kwargs)

        res.update(group_kwargs)

        return res

    def _process_results(self, raw_results, result_class=None, collapse_field=None, grouped_results=None, **kwargs):
        if GroupedSearchResult is not result_class:
            return super(GroupedWhooshSearchBackend, self)._process_results(raw_results, result_class=result_class, **kwargs)

        res = {}
        res['results'] = results = []
        matches = 0
        hits = 0

        for group in grouped_results:
            hits += 1
            matches += len(group)
            results.append(result_class(collapse_field, group))

        res["hits"] = hits
        res['matches'] = matches
        return res


class WhooshEngine(OriginalWhooshEngine):
    backend = GroupedWhooshSearchBackend
    query = GroupedSearchQuery
    queryset = GroupedSearchQuerySet
