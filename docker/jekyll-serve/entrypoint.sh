#!/bin/bash
set -euo pipefail

cd /srv/jekyll
bundle install
exec bundle exec jekyll serve --host 0.0.0.0 --livereload --force_polling --incremental