import hashlib

from app.core.config import Settings
from app.ml.model import file_sha256


def test_loaded_model_carries_the_sha256_of_its_pickle(model):
    path = Settings(_env_file=None).model_path
    assert model.sha256 == hashlib.sha256(path.read_bytes()).hexdigest()
    assert len(model.sha256) == 64


def test_file_sha256_hashes_in_chunks(tmp_path):
    data = b"x" * (3 * 1024 * 1024 + 17)  # more than one 1 MiB chunk
    f = tmp_path / "blob.bin"
    f.write_bytes(data)
    assert file_sha256(f) == hashlib.sha256(data).hexdigest()


def test_short_hash_is_the_first_twelve_characters(model):
    assert model.short_hash == model.sha256[:12]
    assert len(model.short_hash) == 12
