FROM solr:6.4.0

# Prepare ssh
USER root
RUN apt-get update
RUN apt-get install -y openssh-server supervisor
RUN mkdir /var/run/sshd
RUN chmod 0755 /var/run/sshd

# Create user password to log in with ssh
RUN echo "${SOLR_USER}:wirecloud" | chpasswd

# Expose ssh port
EXPOSE 22

# Configure and launch supervisor
ADD supervisor-base.conf /etc/supervisor.conf
CMD ["supervisord", "-c", "/etc/supervisor.conf"]
