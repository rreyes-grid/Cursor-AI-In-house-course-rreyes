def test_cache_invalidate_project(app, project_id):
    from app.cache_service import (
        activity_key,
        invalidate_project_caches,
        project_detail_key,
        project_list_key,
        tasks_list_key,
    )
    from app.extensions import cache
    from app.models import Project

    with app.app_context():
        p = Project.query.get(project_id)
        cache.set(project_list_key(p.owner_id), {"x": 1})
        cache.set(project_detail_key(project_id), {"y": 2})
        cache.set(tasks_list_key(project_id), {"z": 3})
        cache.set(activity_key(project_id), {"a": 4})
        invalidate_project_caches(p)
        assert cache.get(project_list_key(p.owner_id)) is None
        assert cache.get(project_detail_key(project_id)) is None
