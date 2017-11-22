# Install dependencies
pip install elasticsearch==2.4.1

# Remove default haystack settings
sed '34,39d' ${WC_INSTANCE_NAME}/settings.py

# Add ElasticSearch Haystack settings
cat ${WORKSPACE}/src/ci_scripts/templates/elasticsearch-conf.template >> ${WC_INSTANCE_NAME}/settings.py
