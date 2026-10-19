import logging

from app.core.logging import LOGGER_NAME, configure_logging, kv


def test_kv_renders_plain_values_bare_and_quotes_awkward_ones():
    assert kv(method="GET", status=200, duration_ms="1.50") == "method=GET status=200 duration_ms=1.50"
    assert kv(path="/a b") == 'path="/a b"'
    assert kv(note='say "hi"') == 'note="say \\"hi\\""'
    assert kv(empty="") == 'empty=""'


def test_configure_logging_is_idempotent_and_sets_the_level():
    logger = logging.getLogger(LOGGER_NAME)
    configure_logging("INFO")
    handlers = len(logger.handlers)
    configure_logging("DEBUG")
    assert len(logger.handlers) == handlers
    assert logger.level == logging.DEBUG
    configure_logging("INFO")
