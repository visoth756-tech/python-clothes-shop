import enum


class OrderStatus(enum.Enum):
	PENDING = "PENDING"
	CONFIRMED = "CONFIRMED"
	CANCELLED = "CANCELLED"


class PaymentStatus(enum.Enum):
	PENDING = "PENDING"
	PAID = "PAID"
	FAILED = "FAILED"


class Role(enum.Enum):
	ADMIN = "ADMIN"
	USER = "USER"


class UserStatus(enum.Enum):
	ACTIVE = "ACTIVE"
	INACTIVE = "INACTIVE"
