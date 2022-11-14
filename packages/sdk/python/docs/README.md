To generate the documentation, you need sphinx installed (`pip install sphinx`). It is already added to the pipfile.

If you run `make` in the sphinx-documentation folder you can see the different formats sphinx can generate.

Because the code is not yet ideally structured for importing by the autodoc, we need to escape several lines. So we prepared a script for that:

To generate the documentation, run:
`bin/generate-docs [<format>]`

If format is not given, `html` is the default.

The documentation will be saved in the folder `sphinx-documentation/build/`
