"""Populate Product_Option_Value from legacy Product_Option_Group links."""

from ..extensions import db
from ..models import OptionValue, ProductOptionGroup, ProductOptionValue


def migrate_product_options_from_groups() -> int:
    """Create per-product option rows from group-level links when table is empty."""
    if ProductOptionValue.query.first():
        return 0

    links = ProductOptionGroup.query.all()
    if not links:
        return 0

    values_by_group: dict[int, list[int]] = {}
    for option_value in OptionValue.query.order_by(OptionValue.MaOptionValue.asc()).all():
        values_by_group.setdefault(option_value.MaOptionGroup, []).append(option_value.MaOptionValue)

    rows: list[ProductOptionValue] = []
    seen: set[tuple[int, int]] = set()
    for link in links:
        for option_value_id in values_by_group.get(link.MaOptionGroup, []):
            key = (link.MaSP, option_value_id)
            if key in seen:
                continue
            seen.add(key)
            rows.append(ProductOptionValue(MaSP=link.MaSP, MaOptionValue=option_value_id))

    if rows:
        db.session.add_all(rows)
        db.session.commit()
    return len(rows)


def seed_product_option_values(links: list[tuple[int, int]], values_by_group: dict[int, list[int]]) -> None:
    rows = [
        ProductOptionValue(MaSP=product_id, MaOptionValue=option_value_id)
        for product_id, group_id in links
        for option_value_id in values_by_group.get(group_id, [])
    ]
    db.session.add_all(rows)
    db.session.commit()
