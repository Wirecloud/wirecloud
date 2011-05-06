#!/bin/bash
# Delete all the url base of selenium tests

find -type f -name \*html -exec sed -i "s/href=\"http.*\"/href=\"\"/g" {} \;
