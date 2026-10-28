import pytest
from pydantic import ValidationError
from backend.app.agent.tools import (
    CategoryArgs, TopProductsArgs, AnomalyArgs, ProductStatsArgs, CompareProductsArgs
)

def test_category_args_valid():
    args = CategoryArgs(limit=10)
    assert args.limit == 10

def test_category_args_limit_out_of_bounds():
    with pytest.raises(ValidationError):
        CategoryArgs(limit=50)  # Max allowed is 20

def test_anomaly_args_valid():
    args = AnomalyArgs(metric="delivery_delay")
    assert args.metric == "delivery_delay"

def test_anomaly_args_invalid_metric():
    with pytest.raises(ValidationError):
        AnomalyArgs(metric="arbitrary_metric")

def test_compare_products_min_max_length():
    with pytest.raises(ValidationError):
        CompareProductsArgs(product_ids=["single_id"])  # Needs min 2
    
    with pytest.raises(ValidationError):
        CompareProductsArgs(product_ids=["id1", "id2", "id3", "id4"])  # Max 3

    valid = CompareProductsArgs(product_ids=["id1", "id2"])
    assert len(valid.product_ids) == 2
