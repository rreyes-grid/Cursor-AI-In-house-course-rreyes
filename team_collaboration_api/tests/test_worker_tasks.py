def test_celery_create_notification_task(app, client, auth_headers):
    from app.extensions import db
    from app.models import User
    from app.worker_tasks import create_notification_task, invalidate_project_cache_task

    with app.app_context():
        uid = User.query.filter_by(email="user1@test.local").first().id

    res = create_notification_task.apply(
        args=[uid, "Hello", "Body", "info", None, None, False]
    )
    assert res.successful()
    nid = res.result
    assert isinstance(nid, int)

    with app.app_context():
        from app.models import Notification

        n = Notification.query.get(nid)
        assert n is not None
        assert n.title == "Hello"
        db.session.delete(n)
        db.session.commit()

    with app.app_context():
        from app.models import Project

        p = Project.query.first()
        if p:
            invalidate_project_cache_task.apply(args=[p.id])
