#!/usr/bin/env python3
"""Seed database with initial concepts, Euclid entries, and resources."""
import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.base import SessionLocal, init_db
from app.db.models import Concept, EuclidEntry, Resource


DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def load_json(filename: str) -> dict:
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_euclid(db):
    print("Seeding Euclid's Elements entries...")
    data = load_json("seed_euclid.json")
    count = 0
    for entry in data["entries"]:
        existing = db.query(EuclidEntry).filter(EuclidEntry.reference == entry["reference"]).first()
        if existing:
            continue
        db.add(EuclidEntry(
            reference=entry["reference"],
            book=entry["book"],
            entry_type=entry["entry_type"],
            number=entry["number"],
            original_text=entry["original_text"],
            modern_text=entry.get("modern_text"),
        ))
        count += 1
    db.commit()
    print(f"  Added {count} Euclid entries.")


def seed_concepts(db):
    print("Seeding concepts...")
    data = load_json("seed_concepts.json")

    # First pass: create all concepts
    slug_to_concept = {}
    count = 0
    for c in data["concepts"]:
        existing = db.query(Concept).filter(Concept.slug == c["slug"]).first()
        if existing:
            slug_to_concept[c["slug"]] = existing
            continue
        concept = Concept(
            slug=c["slug"],
            name=c["name"],
            description=c.get("description"),
            level=c.get("level", 0),
            category=c.get("category"),
            euclid_ref=c.get("euclid_ref"),
        )
        db.add(concept)
        slug_to_concept[c["slug"]] = concept
        count += 1
    db.commit()

    # Second pass: link prerequisites
    for c in data["concepts"]:
        concept = slug_to_concept.get(c["slug"])
        if not concept:
            continue
        for prereq_slug in c.get("prerequisites", []):
            prereq = slug_to_concept.get(prereq_slug)
            if prereq and prereq not in concept.prerequisites:
                concept.prerequisites.append(prereq)
    db.commit()
    print(f"  Added {count} concepts with prerequisites.")


def seed_resources(db):
    print("Seeding resources...")
    data = load_json("seed_resources.json")
    count = 0
    for r in data["resources"]:
        existing = db.query(Resource).filter(Resource.title == r["title"]).first()
        if existing:
            resource = existing
        else:
            resource = Resource(
                title=r["title"],
                author=r.get("author"),
                resource_type=r["resource_type"],
                difficulty=r.get("difficulty"),
                url=r.get("url"),
                isbn=r.get("isbn"),
                description=r.get("description"),
            )
            db.add(resource)
            count += 1

        # Link to concepts
        for slug in r.get("concepts", []):
            concept = db.query(Concept).filter(Concept.slug == slug).first()
            if concept and concept not in resource.concepts:
                resource.concepts.append(concept)
    db.commit()
    print(f"  Added {count} resources.")


def main():
    print("Initializing database...")
    init_db()

    db = SessionLocal()
    try:
        seed_euclid(db)
        seed_concepts(db)
        seed_resources(db)
        print("Database seeding complete!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
