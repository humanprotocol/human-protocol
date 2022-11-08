#!/bin/sh

pipenv shell
black .
pylint .
