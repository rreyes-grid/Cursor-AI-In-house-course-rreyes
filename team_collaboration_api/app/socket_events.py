"""Socket.IO: real-time collaboration and notification delivery."""

from flask_socketio import join_room, leave_room

from app.extensions import socketio
from app.services.notifications import user_room


@socketio.on("connect")
def on_connect(auth):
    """Optional JWT in auth dict: { token: 'Bearer ...' } or query string."""
    try:
        if auth and isinstance(auth, dict) and auth.get("token"):
            token = auth["token"].replace("Bearer ", "").strip()
            from flask_jwt_extended import decode_token as jwt_decode

            decoded = jwt_decode(token)
            uid = int(decoded["sub"])
            join_room(user_room(uid))
            return True
    except Exception:
        pass
    # Allow anonymous connect for demo; production should require auth
    return True


@socketio.on("disconnect")
def on_disconnect():
    pass


@socketio.on("authenticate")
def on_authenticate(data):
    """Client sends JWT after connect: { token: '...' }"""
    from flask_jwt_extended import decode_token as jwt_decode

    try:
        token = (data or {}).get("token", "").replace("Bearer ", "").strip()
        if not token:
            return {"ok": False, "error": "missing token"}
        decoded = jwt_decode(token)
        uid = int(decoded["sub"])
        join_room(user_room(uid))
        return {"ok": True, "user_id": uid}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@socketio.on("join_project")
def on_join_project(data):
    """Subscribe to project room for live updates."""
    pid = (data or {}).get("project_id")
    if pid is not None:
        join_room(f"project_{pid}")
        return {"ok": True, "room": f"project_{pid}"}
    return {"ok": False}


@socketio.on("leave_project")
def on_leave_project(data):
    pid = (data or {}).get("project_id")
    if pid is not None:
        leave_room(f"project_{pid}")
        return {"ok": True}
    return {"ok": False}
