import os
import uuid
from io import BytesIO

from werkzeug.utils import secure_filename
from PIL import Image

BASE_UPLOAD_DIR = os.path.join("static", "uploads")
USER_UPLOAD_DIR = os.path.join(BASE_UPLOAD_DIR, "users")
PRODUCT_UPLOAD_DIR = os.path.join(BASE_UPLOAD_DIR, "products")

os.makedirs(USER_UPLOAD_DIR, exist_ok=True)
os.makedirs(PRODUCT_UPLOAD_DIR, exist_ok=True)

ALLOWED_EXT = {"png", "jpg", "jpeg", "gif", "webp"}

MAIN_SIZE = (800, 800)
THUMB_SIZE = (200, 200)
JPEG_QUALITY = 80


def allowed_file(filename):
	return "." in filename and filename.rsplit(".", 1)[-1].lower() in ALLOWED_EXT


def get_thumb_filename(image_filename):
	if not image_filename:
		return None
	name, ext = os.path.splitext(image_filename)
	return f"{name}_thumb{ext}"


def _encode(image, ext, size):
	img = image.copy()
	
	if ext in ("jpg", "jpeg") and img.mode in ("RGBA", "P"):
		img = img.convert("RGB")
	
	img.thumbnail(size)
	
	buffer = BytesIO()
	if ext in ("jpg", "jpeg"):
		img.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
	elif ext == "png":
		img.save(buffer, format="PNG", optimize=True, compress_level=9)
	elif ext == "webp":
		img.save(buffer, format="WEBP", quality=JPEG_QUALITY)
	else:
		img.save(buffer, format=image.format or "PNG")
	
	buffer.seek(0)
	return buffer


def _save_image(upload_dir, file_storage, old_image=None):
	"""Shared save logic for any entity's image (user, product, etc.)."""
	if not file_storage or file_storage.filename == "":
		return None
	
	if not allowed_file(file_storage.filename):
		raise ValueError("Invalid file type")
	
	ext = secure_filename(file_storage.filename).rsplit(".", 1)[-1].lower()
	base_name = uuid.uuid4().hex
	
	image_name = f"{base_name}.{ext}"
	thumb_name = f"{base_name}_thumb.{ext}"
	
	try:
		image = Image.open(file_storage)
		
		main_buf = _encode(image, ext, MAIN_SIZE)
		thumb_buf = _encode(image, ext, THUMB_SIZE)
		
		with open(os.path.join(upload_dir, image_name), "wb") as f:
			f.write(main_buf.read())
		
		with open(os.path.join(upload_dir, thumb_name), "wb") as f:
			f.write(thumb_buf.read())
	
	except Exception:
		raise ValueError("Uploaded file is not a valid image")
	
	if old_image:
		_delete_image(upload_dir, old_image)
	
	return image_name


def _delete_image(upload_dir, filename):
	"""Shared delete logic for any entity's image (user, product, etc.)."""
	if not filename:
		return
	path = os.path.join(upload_dir, filename)
	if os.path.exists(path):
		os.remove(path)
	
	thumb_path = os.path.join(upload_dir, get_thumb_filename(filename))
	if os.path.exists(thumb_path):
		os.remove(thumb_path)


# ---- User images ----

def save_user_image(file_storage, old_image=None):
	return _save_image(USER_UPLOAD_DIR, file_storage, old_image)


def delete_user_image(filename):
	_delete_image(USER_UPLOAD_DIR, filename)


# ---- Product images ----

def save_product_image(file_storage, old_image=None):
	return _save_image(PRODUCT_UPLOAD_DIR, file_storage, old_image)


def delete_product_image(filename):
	_delete_image(PRODUCT_UPLOAD_DIR, filename)
