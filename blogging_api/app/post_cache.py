"""Redis / in-process cache for post list and detail reads."""

from flask import current_app
from sqlalchemy import select

from app.extensions import cache, db


def _prefix() -> str:
    return current_app.config.get("CACHE_KEY_PREFIX", "blog:")


def _list_version_key() -> str:
    return f"{_prefix()}posts:list:version"


def get_post_list_version() -> int:
    v = cache.get(_list_version_key())
    return int(v) if v is not None else 0


def bump_post_list_cache() -> int:
    """Invalidate all paginated post listings by bumping the version token."""
    v = get_post_list_version() + 1
    cache.set(
        _list_version_key(),
        v,
        timeout=current_app.config.get("CACHE_VERSION_TTL", 86400 * 365),
    )
    return v


def post_list_payload_key(page: int, per_page: int) -> str:
    ver = get_post_list_version()
    return f"{_prefix()}posts:list:v{ver}:p{page}:n{per_page}"


def post_detail_key(post_id: int) -> str:
    return f"{_prefix()}posts:detail:{post_id}"


def invalidate_post_detail(post_id: int) -> None:
    cache.delete(post_detail_key(post_id))


def invalidate_after_post_write(post_id: int) -> None:
    """Call after create, update, or delete of a post."""
    bump_post_list_cache()
    invalidate_post_detail(post_id)


def invalidate_for_category_change(category_id: int) -> None:
    """Listings and post bodies may show category; bump list and drop detail for affected posts."""
    from app.models import Post

    bump_post_list_cache()
    ids = db.session.scalars(
        select(Post.id).where(Post.category_id == category_id)
    ).all()
    for pid in ids:
        invalidate_post_detail(pid)
