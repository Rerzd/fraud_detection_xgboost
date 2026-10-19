import pytest

from app.services.batch_service import BatchError, parse_csv

HEADER = "type,step,amount,oldbalanceOrg,newbalanceOrig,oldbalanceDest,newbalanceDest"
ROW = "TRANSFER,10,100,500,400,0,100"


def parse(text: str, max_rows: int = 100):
    return parse_csv(text.encode(), max_rows)


def test_line_numbers_count_the_header_as_line_one():
    valid, errors = parse(f"{HEADER}\n{ROW}\nPAYMENT,1,1,1,1,1,1\n{ROW}")
    assert [line for line, _ in valid] == [2, 4]
    assert [e["row"] for e in errors] == [3]


def test_blank_lines_are_skipped_without_an_error():
    valid, errors = parse(f"{HEADER}\n{ROW}\n,,,,,,\n\n{ROW}")
    assert len(valid) == 2 and errors == []


def test_bom_and_padded_headers_are_accepted():
    padded = " type , step ,amount,oldbalanceOrg,newbalanceOrig,oldbalanceDest,newbalanceDest"
    text = "﻿" + padded + "\n" + ROW
    valid, errors = parse_csv(text.encode("utf-8"), 10)
    assert len(valid) == 1 and errors == []


def test_valid_rows_come_back_as_plain_dicts():
    (_, tx), = parse(f"{HEADER}\n{ROW}")[0]
    assert tx == {
        "type": "TRANSFER",
        "step": 10,
        "amount": 100.0,
        "oldbalanceOrg": 500.0,
        "newbalanceOrig": 400.0,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 100.0,
    }


@pytest.mark.parametrize(
    ("content", "message"),
    [
        (b"\xff\xfe\x00", "not valid UTF-8"),
        (f"{HEADER}\n".encode(), "no data rows"),
        (b"type,step\nTRANSFER,1", "Missing required columns"),
        (f"{HEADER}\n{ROW}\n{ROW}\n{ROW}".encode(), "Too many rows"),
    ],
)
def test_file_level_problems_raise_batch_error(content, message):
    with pytest.raises(BatchError, match=message):
        parse_csv(content, 2)
