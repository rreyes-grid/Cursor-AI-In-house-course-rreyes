from flask import Blueprint, abort, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.errors import ApiError
from app.extensions import cache, db
from app.models import Category, Comment, Post
from app.post_cache import (
    invalidate_after_post_write,
    post_detail_key,
    post_list_payload_key,
)
from app.schemas import (
    CommentCreateSchema,
    CommentSchema,
    PostCreateSchema,
    PostDetailSchema,
    PostListItemSchema,
    PostUpdateSchema,
)
from app.utils import unique_post_slug

bp = Blueprint("posts", __name__, url_prefix="/api/posts")


def _cache_backend_name() -> str:
    return current_app.config.get("CACHE_TYPE", "unknown")


def _current_user_id() -> int:
    return int(get_jwt_identity())


def _paginate(query, page: int, per_page: int):
    p = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": p.items,
        "page": p.page,
        "per_page": p.per_page,
        "total": p.total,
        "pages": p.pages,
    }


@bp.route("", methods=["GET"])
def list_posts():
    """
    List posts (newest first), paginated (20 per page). Cached (Redis when configured).
    ---
    tags:
      - Posts
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
    responses:
      200:
        description: Paginated list
    """
    page = request.args.get("page", type=int)
    if page is None:
        page = 1
    elif page < 1:
        raise ApiError("page must be >= 1", 400)
    per_page = current_app.config.get("POSTS_PER_PAGE", 20)
    cache_key = post_list_payload_key(page, per_page)
    cached = cache.get(cache_key)
    if cached is not None:
        current_app.logger.info(
            "posts list cache HIT key=%s page=%s backend=%s",
            cache_key,
            page,
            _cache_backend_name(),
        )
        return jsonify(cached)

    current_app.logger.info(
        "posts list cache MISS -> DB query page=%s per_page=%s backend=%s",
        page,
        per_page,
        _cache_backend_name(),
    )
    q = Post.query.order_by(Post.created_at.desc(), Post.id.desc())
    result = _paginate(q, page, per_page)
    schema = PostListItemSchema(many=True)
    payload = {
        "items": schema.dump(result["items"]),
        "page": result["page"],
        "per_page": result["per_page"],
        "total": result["total"],
        "pages": result["pages"],
    }
    cache.set(
        cache_key,
        payload,
        timeout=current_app.config.get("CACHE_DEFAULT_TIMEOUT", 120),
    )
    return jsonify(payload)


@bp.route("", methods=["POST"])
@jwt_required()
def create_post():
    """
    Create a post (JWT required).
    ---
    tags:
      - Posts
    security:
      - Bearer: []
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [title, body]
          properties:
            title: { type: string }
            body: { type: string }
            category_id: { type: integer }
            slug: { type: string }
    responses:
      201:
        description: Created
      401:
        description: Unauthorized
      404:
        description: Category not found
      422:
        description: Validation error
    """
    data = PostCreateSchema().load(request.get_json(force=True, silent=True) or {})
    uid = _current_user_id()
    category = None
    if data.get("category_id") is not None:
        category = Category.query.get(data["category_id"])
        if not category:
            raise ApiError("Category not found", 404)
    base_slug = data.get("slug") or data["title"]
    slug = unique_post_slug(base_slug)
    post = Post(
        author_id=uid,
        category_id=category.id if category else None,
        title=data["title"],
        slug=slug,
        body=data["body"],
    )
    db.session.add(post)
    db.session.commit()
    invalidate_after_post_write(post.id)
    return jsonify(PostDetailSchema().dump(post)), 201


@bp.route("/<int:post_id>", methods=["GET"])
def get_post(post_id):
    """
    Get a single post by id.
    ---
    tags:
      - Posts
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      200:
        description: OK
      404:
        description: Not found
    """
    detail_key = post_detail_key(post_id)
    cached = cache.get(detail_key)
    if cached is not None:
        current_app.logger.info(
            "post detail cache HIT post_id=%s key=%s backend=%s",
            post_id,
            detail_key,
            _cache_backend_name(),
        )
        return jsonify(cached)

    current_app.logger.info(
        "post detail cache MISS -> DB query post_id=%s backend=%s",
        post_id,
        _cache_backend_name(),
    )
    post = Post.query.get(post_id)
    if post is None:
        abort(404)
    payload = PostDetailSchema().dump(post)
    cache.set(
        detail_key,
        payload,
        timeout=current_app.config.get("CACHE_DEFAULT_TIMEOUT", 120),
    )
    return jsonify(payload)


@bp.route("/<int:post_id>", methods=["PUT"])
@jwt_required()
def update_post(post_id):
    """
    Update a post (author only).
    ---
    tags:
      - Posts
    security:
      - Bearer: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            title: { type: string }
            body: { type: string }
            category_id: { type: integer }
    responses:
      200:
        description: OK
      401:
        description: Unauthorized
      403:
        description: Not the author
      404:
        description: Post or category not found
      422:
        description: Validation error
    """
    post = Post.query.get_or_404(post_id)
    uid = _current_user_id()
    if post.author_id != uid:
        raise ApiError("You can only edit your own posts", 403)
    data = PostUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    if not data:
        raise ApiError("No fields to update", 400)
    if "category_id" in data:
        cid = data["category_id"]
        if cid is None:
            post.category_id = None
        else:
            cat = Category.query.get(cid)
            if not cat:
                raise ApiError("Category not found", 404)
            post.category_id = cat.id
    if "title" in data:
        post.title = data["title"]
        post.slug = unique_post_slug(data["title"], exclude_post_id=post.id)
    if "body" in data:
        post.body = data["body"]
    db.session.commit()
    invalidate_after_post_write(post.id)
    return jsonify(PostDetailSchema().dump(post))


@bp.route("/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    """
    Delete a post (author only); cascades comments.
    ---
    tags:
      - Posts
    security:
      - Bearer: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      204:
        description: Deleted
      403:
        description: Not the author
      404:
        description: Not found
    """
    post = Post.query.get_or_404(post_id)
    uid = _current_user_id()
    if post.author_id != uid:
        raise ApiError("You can only delete your own posts", 403)
    pid = post.id
    db.session.delete(post)
    db.session.commit()
    invalidate_after_post_write(pid)
    return "", 204


@bp.route("/<int:post_id>/comments", methods=["GET"])
def list_comments(post_id):
    """
    List comments for a post (oldest first).
    ---
    tags:
      - Comments
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      200:
        description: OK
      404:
        description: Post not found
    """
    Post.query.get_or_404(post_id)
    comments = (
        Comment.query.filter_by(post_id=post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return jsonify(CommentSchema(many=True).dump(comments))


@bp.route("/<int:post_id>/comments", methods=["POST"])
@jwt_required()
def create_comment(post_id):
    """
    Add a comment to a post (JWT required).
    ---
    tags:
      - Comments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          required: [body]
          properties:
            body: { type: string }
    responses:
      201:
        description: Created
      404:
        description: Post not found
      422:
        description: Validation error
    """
    Post.query.get_or_404(post_id)
    data = CommentCreateSchema().load(request.get_json(force=True, silent=True) or {})
    uid = _current_user_id()
    c = Comment(post_id=post_id, user_id=uid, body=data["body"])
    db.session.add(c)
    db.session.commit()
    return jsonify(CommentSchema().dump(c)), 201


@bp.route("/<int:post_id>/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(post_id, comment_id):
    """
    Delete a comment (comment author or post author).
    ---
    tags:
      - Comments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: path
        name: comment_id
        type: integer
        required: true
    responses:
      204:
        description: Deleted
      403:
        description: Forbidden
      404:
        description: Not found
    """
    post = Post.query.get_or_404(post_id)
    c = Comment.query.filter_by(id=comment_id, post_id=post_id).first()
    if not c:
        raise ApiError("Comment not found", 404)
    uid = _current_user_id()
    if c.user_id != uid and post.author_id != uid:
        raise ApiError("You can only delete your own comments or comments on your posts", 403)
    db.session.delete(c)
    db.session.commit()
    return "", 204
