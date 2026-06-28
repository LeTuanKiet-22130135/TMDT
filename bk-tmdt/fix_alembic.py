import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
database_url = os.getenv("DB_URL")
if not database_url:
    database_url = "postgresql+psycopg2://postgres:12345@localhost:5432/tmdt"

print(f"Connecting to {database_url}...")
engine = create_engine(database_url)

with engine.begin() as conn:
    print("Clearing alembic_version table...")
    conn.execute(text("TRUNCATE TABLE alembic_version;"))
    print("Stamping database to '1c54c4a94abb'...")
    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('1c54c4a94abb');"))
    
print("Done! Now you can run `alembic upgrade head`.")
