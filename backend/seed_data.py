"""
Seed script to populate the Official Records (Master Registry) with test data.
Run this once before testing registration: python seed_data.py
"""

import sys
import os
import logging
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models import OfficialRecord
import csv


logger = logging.getLogger("unimart.seed")


def seed_official_records():
    db = SessionLocal()

    # Non-destructive: only seed if the table is empty
    existing_count = db.query(OfficialRecord).count()
    if existing_count > 0:
        logger.info("Official records already exist (%s records). Skipping seed.", existing_count)
        db.close()
        return

    # Resolve CSV path from env so private datasets can stay outside Git.
    csv_file = os.getenv("OFFICIAL_RECORDS_CSV", "official_data.csv").strip()
    csv_path = (
        csv_file
        if os.path.isabs(csv_file)
        else os.path.join(os.path.dirname(__file__), csv_file)
    )
    
    if not os.path.exists(csv_path):
        logger.error("Official records CSV not found: %s", csv_path)
        db.close()
        return

    records = []
    try:
        with open(csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Clean data (remove leading/trailing whitespace from keys and values)
                row = {k.strip(): v.strip() for k, v in row.items()}
                record = OfficialRecord(
                    register_number=row["register_no"],
                    full_name=row["name"],
                    university=row["university"],
                    college=row["college"],
                    department=row["department"],
                    official_email=row["email"]
                )
                records.append(record)
    except Exception as e:
        logger.exception("Error reading official records CSV")
        db.close()
        return

    if records:
        db.add_all(records)
        db.commit()
        logger.info("Successfully seeded %s official records from CSV", len(records))
    else:
        logger.warning("No records found in CSV to seed")

    logger.info("Sample register numbers available for signup:")
    for r in records[:5]: # Show first 5
        logger.info("%s -- %s (%s)", r.register_number, r.full_name, r.department)

    db.close()


if __name__ == "__main__":
    seed_official_records()
