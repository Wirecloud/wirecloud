FROM debian:jessie
RUN awk '$1 ~ "^deb" { $3 = $3 "-backports"; print; exit }' /etc/apt/sources.list > /etc/apt/sources.list.d/backports.list
RUN apt-get update && apt-get -y upgrade
RUN apt-get install -y python python-pip python3 --no-install-recommends && \
    apt-get install -y gcc python-dev python3-dev python3-pip \
            libxml2-dev libxslt1-dev zlib1g-dev libpcre3-dev libcurl4-openssl-dev libexif12 xvfb git \
            chromedriver \
            wget curl unzip \
            sqlite3 postgresql postgresql-client
RUN apt-get install -y libjpeg-dev libfreetype6-dev zlib1g-dev libtiff-dev liblcms2-dev
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list && \
    apt-get update && apt-get install -y google-chrome-stable
RUN version=$(curl 'http://chromedriver.storage.googleapis.com/LATEST_RELEASE' 2> /dev/null) && \
    url_file="chromedriver_linux64.zip" && \
    url_base="http://chromedriver.storage.googleapis.com" && \
    url="${url_base}/${version}/${url_file}" && \
    wget "$url" && unzip chromedriver_*.zip -d tmp && \
    mv tmp/chromedriver usr/bin/
RUN pip install virtualenv
EXPOSE 28081

# COPY ../../../wirecloud /home/wirecloud
ENV WORKSPACE=/wirecloud PATH=/usr/local/bin:$PATH DB_HOST=127.0.0.1 DB_PORT=5432
CMD git clone https://github.com/bgrana/wirecloud.git && /wirecloud/src/ci-scripts/virtenv-test.sh /usr/bin/python2.7 sqlite3 django1.9
