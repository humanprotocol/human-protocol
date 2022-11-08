#!/bin/bash
set -eux

# this script edits the sources allowing the autodoc to import them, runs the generation, then reverts the changes.

format='html'
if [ $# -eq 1 ] ; then
  format=$1
fi

cd docs
pipenv run make $format
cd ..
