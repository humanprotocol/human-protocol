import io
import os
import zipfile
from glob import glob
from pathlib import Path


def extract_zip_archive(data: io.RawIOBase, dst_dir: os.PathLike[str], *, create_dir: bool = True):
    if not isinstance(dst_dir, Path):
        dst_dir = Path(dst_dir)

    if create_dir:
        dst_dir.mkdir()

    with zipfile.ZipFile(data) as f:
        f.extractall(dst_dir)


def write_dir_to_zip_archive(src_dir: str, dst_file: io.RawIOBase):
    with zipfile.ZipFile(dst_file, "w") as archive_zip_file:
        for fn in glob(os.path.join(src_dir, "**/*.*"), recursive=True):
            archive_zip_file.write(fn, os.path.relpath(fn, src_dir))
