import pytest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer

from app.ml.explain import explain
from app.ml.preprocessing import build_features
from conftest import NOTEBOOK_FRAUD_ROW


@pytest.fixture
def features():
    return build_features([NOTEBOOK_FRAUD_ROW])


def test_preprocessing_steps_in_front_of_the_classifier_are_applied_first(model, features):
    # The shipped pipeline is the classifier alone. A pipeline with a transformer in front must be
    # explained on the transformed data, and an identity transform must not change the answer.
    with_transformer = Pipeline(
        [("identity", FunctionTransformer()), ("classifier", model.pipeline[-1])]
    )
    assert explain(with_transformer, features) == explain(model.pipeline, features)


def test_a_transformer_that_changes_the_data_changes_the_explanation(model, features):
    # Proves the transformed data, not the raw features, is what the booster sees.
    doubled = Pipeline(
        [("double", FunctionTransformer(lambda x: x * 2)), ("classifier", model.pipeline[-1])]
    )
    assert explain(doubled, features) != explain(model.pipeline, features)
