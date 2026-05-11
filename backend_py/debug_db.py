import json
import os

db_path = r'c:\Users\DELL\OneDrive\Music\Documents\Oops_project\carbon-footprint-app\backend_py\local_db.json'

if not os.path.exists(db_path):
    print(f"File not found: {db_path}")
else:
    with open(db_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        users = data.get('users', [])
        found = False
        for user in users:
            if 'bhavishayas2009@gmail.com' in user.get('email', '').lower():
                print(f"Found user: {user.get('firstName')} {user.get('lastName')} ({user.get('email')}) - Role: {user.get('role')}")
                found = True
        if not found:
            print("User bhavishayas2009@gmail.com not found in local_db.json")
            print(f"Total users in DB: {len(users)}")
            if users:
                print("Last 5 users:")
                for u in users[-5:]:
                    print(f"- {u.get('firstName')} {u.get('lastName')} ({u.get('email')})")
