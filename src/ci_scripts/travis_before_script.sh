if [ "${TEST_SUITE}" == "elasticsearch" ] || [ "${TEST_SUITE}" == "selenium" ]; then
    export INDEX_URI=http://localhost:9200
    docker run -p 9200:9200 --rm -d elasticsearch:2.4
elif [ "${TEST_SUITE}" == "solr" ]; then
    export INDEX_URI=http://localhost:8983
    docker run -p 8983:8983 --rm --name solr -d solr:6
fi
