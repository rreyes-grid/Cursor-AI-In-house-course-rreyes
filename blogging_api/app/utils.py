import re


def slugify(text: str, max_length: int = 200) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text[:max_length] if text else "post"


def unique_post_slug(base: str, exclude_post_id: int | None = None) -> str:
    """Ensure slug is unique among posts (append -2, -3, ... if needed)."""
    from app.models import Post

    slug = slugify(base)
    candidate = slug
    n = 2
    while True:
        q = Post.query.filter_by(slug=candidate)
        if exclude_post_id is not None:
            q = q.filter(Post.id != exclude_post_id)
        if q.first() is None:
            return candidate
        candidate = f"{slug}-{n}"
        n += 1
        if len(candidate) > 300:
            candidate = f"{slug[:250]}-{n}"


def unique_category_slug(base: str, exclude_category_id: int | None = None) -> str:
    """Ensure slug is unique among categories."""
    from app.models import Category

    slug = slugify(base, max_length=160)
    candidate = slug
    n = 2
    while True:
        q = Category.query.filter_by(slug=candidate)
        if exclude_category_id is not None:
            q = q.filter(Category.id != exclude_category_id)
        if q.first() is None:
            return candidate
        candidate = f"{slug}-{n}"
        n += 1
        if len(candidate) > 160:
            candidate = f"{slug[:120]}-{n}"
