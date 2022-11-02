import sys

source = open("hmt_escrow/" + sys.argv[1] + ".py.backup", "r")
target = open("hmt_escrow/" + sys.argv[1] + ".py", "w")

# Comment out the lines which can't be executed when the autodoc imports the file.
comment = False

for line in source:
    if line.startswith("CONTRACTS = compile_files("):
        target.write("# " + line)
        comment = True
    else:
        if comment:
            target.write("# " + line)
            if line.startswith(")"):
                comment = False
        else:
            target.write(line)

target.close()
source.close()
