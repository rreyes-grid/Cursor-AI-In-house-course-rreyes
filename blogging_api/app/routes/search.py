from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import func, or_

from app.errors import ApiError
from app.models import Post
from app.schemas import PostListItemSchema

bp = Blueprint("search", __name__, url_prefix="/api")


@bp.route("/search", methods=["GET"])
def search_posts():
    """
    Search posts by keyword in title or body (paginated, 20 per page).
    ---
    tags:
      - Search
    parameters:
      - in: query
        name: q
        type: string
        required: true
        description: Search keyword
      - in: query
        name: page
        type: integer
        default: 1
    responses:
      200:
        description: Paginated results
      400:
        description: Missing or invalid q
    """
    q = (request.args.get("q") or "").strip()
    if not q:
        raise ApiError("Query parameter q is required", 400)
    page = request.args.get("page", type=int)
    if page is None:
        page = 1
    elif page < 1:
        raise ApiError("page must be >= 1", 400)
    per_page = current_app.config.get("POSTS_PER_PAGE", 20)
    like = f"%{q.lower()}%"
    base = Post.query.filter(
        or_(
            func.lower(Post.title).like(like),
            func.lower(Post.body).like(like),
        )
    ).order_by(Post.created_at.desc(), Post.id.desc())
    p = base.paginate(page=page, per_page=per_page, error_out=False)
    schema = PostListItemSchema(many=True)
    return jsonify(
        {
            "items": schema.dump(p.items),
            "page": p.page,
            "per_page": p.per_page,
            "total": p.total,
            "pages": p.pages,
            "q": q,
        }
    )
