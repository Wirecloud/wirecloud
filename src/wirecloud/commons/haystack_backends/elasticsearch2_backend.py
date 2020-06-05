from __future__ import absolute_import

from haystack.backends.elasticsearch2_backend import Elasticsearch2SearchEngine as OriginalElasticsearch2SearchEngine, Elasticsearch2SearchBackend, Elasticsearch2SearchQuery
from haystack.constants import DJANGO_CT, DJANGO_ID
from haystack.models import SearchResult
from haystack.query import SearchQuerySet
from haystack import indexes
from haystack.fields import FacetMultiValueField
from haystack.utils.app_loading import haystack_get_model


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

    def parse_sort_field(self, order_by):
        if order_by and len(order_by) > 1:
            if order_by[0] == "-":
                order_sense = "desc"
                order_by = order_by[1:]
            else:
                order_sense = "asc"
            return (order_by, order_sense)
        return None

    def add_group_by(self, field_name, order_by=None):
        self.grouping_field = field_name

        # Get order sense
        result = self.parse_sort_field(order_by)
        self.group_order_by = result[0]
        self.group_order_sense = result[1]

        self.end_offset = 100

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
            parsed_order = self.parse_sort_field(self.order_by[0]) if len(self.order_by) > 0 else None

            aggregation = {
                "aggs": {
                    "items": {
                        "terms": {
                            "field": self.grouping_field,
                            "size": self.end_offset,
                        },
                        "aggs": {
                            "items": {"top_hits": {"size": 5}},
                        }
                    }
                },
                "result_class": GroupedSearchResult
            }

            if self.group_order_by:
                aggregation["aggs"]["items"]["aggs"]["items"]["top_hits"]["sort"] = [{self.group_order_by: {"order": self.group_order_sense}}]

            if parsed_order:
                aggregation["aggs"]["items"]["terms"]["order"] = {"max_order": parsed_order[1]}
                aggregation["aggs"]["items"]["aggs"]["max_order"] = {"max": {"field": parsed_order[0]}}

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

    def __init__(self, connection_alias, **connection_options):
        super(GroupedElasticsearch2SearchBackend, self).__init__(connection_alias, **connection_options)
        setattr(self, 'DEFAULT_SETTINGS', {
            'settings': {
                "analysis": {
                    "analyzer": {
                        "ngram_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["haystack_ngram", "lowercase"],
                        },
                        "edgengram_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["haystack_edgengram", "lowercase"],
                        }
                    },
                    "tokenizer": {
                        "haystack_ngram_tokenizer": {
                            "type": "nGram",
                            "min_gram": 3,
                            "max_gram": 20,
                        },
                        "haystack_edgengram_tokenizer": {
                            "type": "edgeNGram",
                            "min_gram": 2,
                            "max_gram": 20,
                            "side": "front",
                        },
                    },
                    "filter": {
                        "haystack_ngram": {
                            "type": "nGram",
                            "min_gram": 3,
                            "max_gram": 20
                        },
                        "haystack_edgengram": {
                            "type": "edgeNGram",
                            "min_gram": 2,
                            "max_gram": 20
                        }
                    }
                }
            }
        })

    def build_search_kwargs(self, *args, **kwargs):
        group_kwargs = [(i, kwargs.pop(i)) for i in list(kwargs) if i.startswith("aggs")]
        self.start_offset = kwargs["start_offset"]
        self.end_offset = kwargs["end_offset"]

        res = super(GroupedElasticsearch2SearchBackend, self).build_search_kwargs(*args, **kwargs)

        res.update(group_kwargs)
        if "query_string" in res["query"]["filtered"]["query"]:
            res["query"]["filtered"]["query"]["query_string"]["analyzer"] = "standard"

        return res

    def _process_results(self, raw_results, result_class=None, **kwargs):

        if GroupedSearchResult is not result_class:
            return super(GroupedElasticsearch2SearchBackend, self)._process_results(raw_results,
                                                                                    result_class=result_class,
                                                                                    **kwargs)
        res = {}
        res['results'] = results = []
        if raw_results == {}:
            res["matches"] = 0
            res["hits"] = 0
            return res

        res["matches"] = raw_results["hits"]["total"]
        groups = raw_results["aggregations"]["items"]["buckets"][self.start_offset:]
        res["hits"] = len(groups)

        for group in groups:
            results.append(result_class(group))
        return res


class Elasticsearch2SearchEngine(OriginalElasticsearch2SearchEngine):
    backend = GroupedElasticsearch2SearchBackend
    query = GroupedSearchQuery
    queryset = GroupedSearchQuerySet
