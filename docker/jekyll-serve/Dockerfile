FROM jekyll/jekyll:4.2.2

WORKDIR /srv/jekyll

COPY docker/jekyll-serve/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]