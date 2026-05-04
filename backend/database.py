import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'users.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    
    # We will also add tokens table for simple token auth
    c.execute('''
        CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    # Safe schema migration for new profile fields
    try:
        c.execute("ALTER TABLE users ADD COLUMN address TEXT DEFAULT 'Not provided'")
    except sqlite3.OperationalError:
        pass # Column already exists
        
    try:
        c.execute("ALTER TABLE users ADD COLUMN contact_info TEXT DEFAULT 'Not provided'")
    except sqlite3.OperationalError:
        pass # Column already exists
        
    try:
        c.execute("ALTER TABLE users ADD COLUMN profile_picture TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass # Column already exists
        
    conn.commit()
    conn.close()

def register_user(email, password, name, role):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT id FROM users WHERE email = ?", (email,))
        if c.fetchone():
            return None, "Email already exists"
            
        user_id = str(uuid.uuid4())
        hashed = generate_password_hash(password)
        
        c.execute("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)",
                  (user_id, email, hashed, name, role))
        conn.commit()
        return user_id, None
    except Exception as e:
        return None, str(e)
    finally:
        conn.close()

def login_user(email, password):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT id, password_hash, name, role, address, contact_info, profile_picture FROM users WHERE email = ?", (email,))
        row = c.fetchone()
        
        if row and check_password_hash(row[1], password):
            user_id = row[0]
            name = row[2]
            role = row[3]
            address = row[4]
            contact_info = row[5]
            profile_pic = row[6]
            
            # Generate session token
            token = str(uuid.uuid4())
            c.execute("INSERT INTO tokens (token, user_id) VALUES (?, ?)", (token, user_id))
            conn.commit()
            
            return {"token": token, "user": {"id": user_id, "name": name, "role": role, "address": address, "contact_info": contact_info, "profile_picture": profile_pic}}, None
            
        return None, "Invalid email or password"
    except Exception as e:
        return None, str(e)
    finally:
        conn.close()

def get_user_by_token(token):
    if not token:
        return None
        
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute('''
            SELECT u.id, u.email, u.name, u.role, u.address, u.contact_info, u.profile_picture
            FROM users u
            JOIN tokens t ON u.id = t.user_id
            WHERE t.token = ?
        ''', (token,))
        row = c.fetchone()
        if row:
            return {"id": row[0], "email": row[1], "name": row[2], "role": row[3], "address": row[4], "contact_info": row[5], "profile_picture": row[6]}
        return None
    finally:
        conn.close()

def update_user_profile(user_id, name, email, address, contact_info, profile_picture):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        # Check if email is already taken by someone else
        c.execute("SELECT id FROM users WHERE email = ? AND id != ?", (email, user_id))
        if c.fetchone():
            return False, "Email already in use by another account"

        c.execute('''
            UPDATE users
            SET name = ?, email = ?, address = ?, contact_info = ?, profile_picture = ?
            WHERE id = ?
        ''', (name, email, address, contact_info, profile_picture, user_id))
        conn.commit()
        return True, None
    except Exception as e:
        print("Profile update error:", e)
        return False, str(e)
    finally:
        conn.close()
