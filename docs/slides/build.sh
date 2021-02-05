#!/bin/bash
rm *.html
for file in *.cfg
do
    landslide "${file}"
done
