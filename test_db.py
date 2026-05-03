import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load .env
env_path = os.path.join("backend_py", ".env")
load_dotenv(dotenv_path=env_path)

mongo_uri = os.getenv("MONGO_URI", "").strip() or "mongodb://localhost:27017/ecotrack"
print(f"Testing connection to: {mongo_uri}")

try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client.get_database("ecotrack")
    client.server_info()
    print("SUCCESS: Connected to MongoDB Atlas!")
except Exception as e:
    print(f"FAILURE: Could not connect to MongoDB. Error: {e}")
