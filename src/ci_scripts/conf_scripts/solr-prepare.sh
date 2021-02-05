# Install dependencies
pip install pysolr

# Add ElasticSearch Haystack settings
cat ${TRAVIS_BUILD_DIR}/src/ci_scripts/templates/solr-conf.template >> settings.py

# Upload Solr schema
mkdir solr_conf
python manage.py build_solr_schema --configure-directory solr_conf
docker exec -it --user=solr ${SOLR_CONTAINER:-solr} bin/solr create -c tester -n basic_config
docker exec -it ${SOLR_CONTAINER:-solr} rm -f /opt/solr/server/solr/tester/conf/managed-schema.xml
docker cp solr_conf/schema.xml ${SOLR_CONTAINER:-solr}:/opt/solr/server/solr/tester/conf/
docker cp solr_conf/solrconfig.xml ${SOLR_CONTAINER:-solr}:/opt/solr/server/solr/tester/conf/

# Reload the Solr core
curl "${INDEX_URI}/solr/admin/cores?action=RELOAD&core=tester"
