from datetime import datetime, timezone, timedelta

from app import db
from app.models.base import BaseDocument


class RateLimitLog(BaseDocument):
    __tablename__ = "rate_limit_logs"
 
    ip_address = db.Column(
        db.String(45),
        nullable=True
    )

    endpoint = db.Column(
        db.String(255),
        nullable=False
    )

    method = db.Column(
        db.String(10),
        nullable=False
    )

    limit = db.Column(
        db.String(50),
        nullable=False
    )
    
    timestamp = db.Column(
        db.DateTime,
        default=lambda: datetime.now(
            timezone(timedelta(hours=7))
        ).replace(tzinfo=None),
        nullable=False
    )