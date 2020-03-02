#!/bin/bash

git config --global user.email "kevin@austincodingacademy.com"
git config --global user.name "Kevin Colten"
if [ "${CIRCLE_BRANCH}" == "preview" ]; then export JEKYLL_ENV='preview.'; fi
if [ "${CIRCLE_BRANCH}" == "preview" ] || [ "${CIRCLE_BRANCH}" == "master" ]; then
  mkdir _data
  node _javascripts/events.js
  node _javascripts/tutoring.js
  yarn images
  yarn configs
  node _javascripts/github.js
  # KEY=austincodingacademy.com yarn jekyll-build-amp
  # yarn optimize
  # yarn css
  ITER=0
  for file in ./_configs/*; do
    if [[ -f $file ]] && [[ $(($ITER % $CIRCLE_NODE_TOTAL)) == $CIRCLE_NODE_INDEX ]]; then
      export KEY=$(echo $file | sed "s/^.\/_configs\/\(.*\).yml$/\1/")
      yarn jekyll-build-amp
      yarn optimize
      yarn css
      yarn jekyll-build
      yarn favicon
      if [ "${CIRCLE_BRANCH}" == "master" ]; then yarn sitemap; fi
      yarn jekyll-build
      yarn jekyll-build-amp
      yarn optimize
      if [ "${CIRCLE_BRANCH}" == "preview" ]; then yarn encrypt; fi
      if [[ "${KEY}" == "austincodingacademy.com" ]] && [[ "${CIRCLE_BRANCH}" == "master" ]]
      then
        sudo apt install rsync
        rsync -a --delete -e "ssh -o StrictHostKeyChecking=no" _site/ root@134.209.57.190:/usr/share/nginx/html
      else
        yarn deploy
      fi
    fi
    ((ITER++))
  done
fi
