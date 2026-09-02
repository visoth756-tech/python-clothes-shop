from .base import BaseDocument
from .enums import Role, UserStatus
from app.extensions import db


class User(BaseDocument):
	__tablename__ = "users"
	
	image = db.Column(
		db.String(500),
		nullable=True
	)
	
	username = db.Column(
		db.String(255),
		nullable=False,
		unique=True
	)
	
	password = db.Column(
		db.String(255),
		nullable=False
	)
	
	role = db.Column(
		db.Enum(Role),
		nullable=False,
		default=Role.USER
	)
	
	status = db.Column(
		db.Enum(UserStatus),
		nullable=False,
		default=UserStatus.ACTIVE
	)
	
	__table_args__ = (
		db.CheckConstraint(
			"length(trim(username)) > 0",
			name="ck_user_username_not_blank"
		),
		db.CheckConstraint(
			"length(trim(password)) > 0",
			name="ck_user_password_not_blank"
		),
	)
	
	def __repr__(self):
		return f"<User {self.username}>"
