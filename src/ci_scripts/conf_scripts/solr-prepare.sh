# Install dependencies
pip install pysolr

# Remove default haystack settings
sed '34,39d' ${WC_INSTANCE_NAME}/settings.py

# Add ElasticSearch Haystack settings
cat ${WORKSPACE}/src/ci_scripts/templates/solr-conf.template >> ${WC_INSTANCE_NAME}/settings.py
