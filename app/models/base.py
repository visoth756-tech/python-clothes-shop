import uuid
from datetime import datetime, UTC
from app.extensions import db


def gen_uuid() -> str:
	return uuid.uuid4().hex

class BaseDocument(db.Model):
	__abstract__ = True
	
	id = db.Column(
		db.String(32),
		primary_key=True,
		default=gen_uuid
	)
	
	created_at = db.Column(
		db.DateTime(timezone=True),
		default=lambda: datetime.now(UTC),
		nullable=False
	)
	
	updated_at = db.Column(
		db.DateTime(timezone=True),
		default=lambda: datetime.now(UTC),
		onupdate=lambda: datetime.now(UTC),
		nullable=False
	)