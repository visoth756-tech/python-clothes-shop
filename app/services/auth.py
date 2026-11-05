"""Invalidate sessions and JWTs whenever the saved account changes."""
import hashlib
import hmac
import json
from datetime import UTC, datetime
from flask import current_app


def auth_stamp(user):
    updated = user.updated_at
    if updated and updated.tzinfo:
        updated = updated.astimezone(UTC).replace(tzinfo=None)
    payload = json.dumps([user.id, user.username, user.password, user.image,
                          user.role.value, user.status.value,
                          updated.isoformat(timespec="microseconds") if updated else None])
    key = current_app.config["SECRET_KEY"]
    if isinstance(key, str):
        key = key.encode()
    return hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()


def valid_stamp(user, stamp):
    return isinstance(stamp, str) and hmac.compare_digest(auth_stamp(user), stamp)


def invalidate_login(user):
    user.updated_at = datetime.now(UTC)
