"""
Test database connection using environment variables.
Usage: python test_db.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import OfficialRecord

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is not set.")
    print("Set it in backend/.env or as a system environment variable.")
    sys.exit(1)

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Check official records
    records = db.query(OfficialRecord).all()
    print(f"Total official records: {len(records)}")
    for r in records[:5]:
        print(f" - {r.register_number} — {r.full_name}")

    db.close()
    print("\nDatabase connection successful!")

except Exception as e:
    print(f"Error: {e}")
