from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_wtf import CSRFProtect
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

limiter = Limiter(
	key_func=get_remote_address,
	default_limits=[],
	storage_uri="memory://"
)

csrf = CSRFProtect()
