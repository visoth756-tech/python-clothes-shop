# python-clothes-shop

# Clone project
git clone YOUR_REPOSITORY_URL
cd python-clothes-shop

# Create virtual environment
python -m venv .venv

# Activate (Windows)
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run Node dependencies
npm run dev

# Configure environment
copy .env.example .env

# Initialize database (if using Flask-Migrate)
flask db upgrade

# Run application
flask run
