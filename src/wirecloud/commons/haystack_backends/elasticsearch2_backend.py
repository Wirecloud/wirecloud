from __future__ import absolute_import

from django.db.models.loading import get_model
from haystack.backends.elasticsearch2_backend import Elasticsearch2SearchEngine as OriginalElasticsearch2SearchEngine, Elasticsearch2SearchBackend, Elasticsearch2SearchQuery
from haystack.constants import DJANGO_CT, DJANGO_ID
from haystack.models import SearchResult
from haystack.query import SearchQuerySet


class GroupedSearchQuery(Elasticsearch2SearchQuery):

    def __init__(self, *args, **kwargs):
        super(GroupedSearchQuery, self).__init__(*args, **kwargs)
        self.grouping_field = None
        self.group_order_by = None
        self.group_order_sense = None
        self._total_document_count = None

    def _clone(self, **kwargs):
        clone = super(GroupedSearchQuery, self)._clone(**kwargs)
        clone.grouping_field = self.grouping_field
        clone.group_order_by = self.group_order_by
        clone.group_order_sense = self.group_order_sense
        return clone

    def add_group_by(self, field_name, order_by=None):
        self.grouping_field = field_name

        # Get order sense
        if order_by and len(order_by) > 1:
            order_sense = "asc"
            if order_by[0] == "-":
                order_sense = "desc"
                order_by = order_by[1:]
            elif order_by[0] == "+":
                order_sense = "asc"
                order_by = order_by[1:]
            self.group_order_sense = order_sense

        self.end_offset = 100
        self.group_order_by = order_by

    def post_process_facets(self, results):
        # FIXME: remove this hack once https://github.com/toastdriven/django-haystack/issues/750 lands
        # See matches dance in _process_results below:
        total = 0

        if 'hits' in results:
            total = int(results['hits'])
        elif 'matches' in results:
            total = int(results['matches'])

        self._total_document_count = total

        return super(GroupedSearchQuery, self).post_process_facets(results)

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
            aux = {"items": {"top_hits": {"size": 5}}}

            if self.group_order_by:
                aux["items"]["top_hits"]["sort"] = [{self.group_order_by: {"order": self.group_order_sense}}]
            aggregation = {
                "aggs": {
                    "items": {
                        "terms": {
                            "field": self.grouping_field,
                            "size": self.end_offset
                        },
                        "aggs": aux
                    }
                },
                "result_class": GroupedSearchResult
            }
            res.update(aggregation)

        return res


class GroupedSearchResult(object):

    def __init__(self, group_data):
        self.key = group_data['key']  # TODO: convert _to_python
        self.hits = len(group_data["items"]["hits"]["hits"])
        self.documents = list(self.process_documents(group_data["items"]["hits"]["hits"]))

    def __unicode__(self):
        return 'GroupedSearchResult({0.group_key}, hits={0.hits})'.format(self)

    def process_documents(self, doclist):
        # TODO: tame import spaghetti
        from haystack import connections
        engine = connections["default"]

        unified_index = engine.get_unified_index()
        indexed_models = unified_index.get_indexed_models()

        for raw_result in doclist:
            raw_result = raw_result["_source"]
            app_label, model_name = raw_result[DJANGO_CT].split('.')
            additional_fields = {}
            model = get_model(app_label, model_name)

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
        """Have Elasticsearch2 group results based on the provided field name"""
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


class GroupedElasticsearch2SearchBackend(Elasticsearch2SearchBackend):

    def build_search_kwargs(self, *args, **kwargs):
        group_kwargs = [(i, kwargs.pop(i)) for i in kwargs.keys() if i.startswith("aggs")]

        res = super(GroupedElasticsearch2SearchBackend, self).build_search_kwargs(*args, **kwargs)

        res.update(group_kwargs)

        return res

    def _process_results(self, raw_results, result_class=None, **kwargs):

        if GroupedSearchResult is not result_class:
            return super(GroupedElasticsearch2SearchBackend, self)._process_results(raw_results,
                                                                                    result_class=result_class,
                                                                                    **kwargs)

        res = {}
        res['results'] = results = []
        res["matches"] = raw_results["hits"]["total"]
        groups = raw_results["aggregations"]["items"]["buckets"]
        res["hits"] = len(groups)

        for group in groups:
            results.append(result_class(group))
        return res


class Elasticsearch2SearchEngine(OriginalElasticsearch2SearchEngine):
    backend = GroupedElasticsearch2SearchBackend
    query = GroupedSearchQuery
    queryset = GroupedSearchQuerySet
