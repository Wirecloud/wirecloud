ARG NODE_VERSION=8.15.0-slim
FROM node:${NODE_VERSION}

ENV DOWNLOAD="latest" \
    SOURCE_BRANCH="develop" \
    GITHUB_ACCOUNT="wirecloud-fiware" \
    GITHUB_REPOSITORY="ngsi-source-operator" 

COPY build.sh /opt/widget-builder/build.sh

RUN apt-get update && \
	apt-get install -y git unzip python2.7 make build-essential g++ && \
	ln -s /usr/bin/python2.7 /usr/bin/python  && \
	npm install -g bower --silent && \
	npm install -g grunt-cli --silent && \
	apt-get clean && \
	chmod +x /opt/widget-builder/build.sh

VOLUME /opt/widget-builder/output
WORKDIR /opt/widget-builder

CMD ["/opt/widget-builder/build.sh"]
