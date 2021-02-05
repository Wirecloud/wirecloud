# Install dependencies
pip install elasticsearch==2.4.1

# Add ElasticSearch Haystack settings
cat ${TRAVIS_BUILD_DIR}/src/ci_scripts/templates/elasticsearch-conf.template >> settings.py
