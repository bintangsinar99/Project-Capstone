from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

try:
    import psycopg
except ImportError:  # PostgreSQL is optional until DATABASE_URL is configured.
    psycopg = None


PBKDF2_ALGORITHM = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 260_000


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return "$".join(
        [
            PBKDF2_ALGORITHM,
            str(PBKDF2_ITERATIONS),
            base64.b64encode(salt).decode("ascii"),
            base64.b64encode(digest).decode("ascii"),
        ]
    )


def _verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False

    if stored_hash.startswith(f"{PBKDF2_ALGORITHM}$"):
        try:
            _, iterations, salt_b64, digest_b64 = stored_hash.split("$", 3)
            salt = base64.b64decode(salt_b64.encode("ascii"))
            expected = base64.b64decode(digest_b64.encode("ascii"))
            actual = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                salt,
                int(iterations),
            )
        except (ValueError, TypeError):
            return False
        return hmac.compare_digest(actual, expected)

    # Compatibility for older local users.json records that used plain SHA-256.
    legacy_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_hash, stored_hash)


class UserStore:
    def __init__(self, file_path: Path | None = None, database_url: str | None = None):
        self._load_local_env()
        self.file_path = file_path or Path(__file__).resolve().parents[2] / "data" / "users.json"
        self.database_url = database_url or os.getenv("DATABASE_URL")
        self.admin_username = os.getenv("ADMIN_USERNAME", "admin").strip()
        self.admin_password = os.getenv("ADMIN_PASSWORD", "").strip()
        self.admin_tokens: set[str] = set()
        self.mode = "postgresql" if self.database_url else "json"

        if self.mode == "postgresql":
            if psycopg is None:
                raise RuntimeError(
                    "DATABASE_URL sudah diisi, tetapi dependency psycopg belum terpasang. "
                    "Jalankan: python -m pip install -r requirements.txt"
                )
            self._init_postgres()
        else:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            if not self.file_path.exists():
                self.file_path.write_text("[]", encoding="utf-8")

    def _load_local_env(self) -> None:
        backend_root = Path(__file__).resolve().parents[2]
        for env_path in (backend_root / ".env", backend_root.parent / ".env"):
            if not env_path.exists():
                continue

            for raw_line in env_path.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue

                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and value:
                    os.environ.setdefault(key, value)

    def _connect(self):
        conninfo = self.database_url or ""
        if conninfo.startswith("postgres://"):
            conninfo = "postgresql://" + conninfo[len("postgres://") :]

        kwargs = {}
        if "sslmode=" not in conninfo:
            kwargs["sslmode"] = os.getenv("DATABASE_SSLMODE", "require")

        return psycopg.connect(conninfo, **kwargs)

    def _init_postgres(self) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        username TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'user',
                        token TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        last_login_at TEXT
                    )
                    """
                )
                cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'")
            connection.commit()

    def _read_json(self) -> list[dict]:
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _write_json(self, users: list[dict]) -> None:
        self.file_path.write_text(json.dumps(users, indent=2), encoding="utf-8")

    def _username_exists_json(self, username: str) -> bool:
        return any(user.get("username") == username for user in self._read_json())

    def _username_exists_postgres(self, username: str) -> bool:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM users WHERE username = %s LIMIT 1", (username,))
                return cursor.fetchone() is not None

    def username_exists(self, username: str) -> bool:
        if self.admin_username and username == self.admin_username:
            return True
        if self.mode == "postgresql":
            return self._username_exists_postgres(username)
        return self._username_exists_json(username)

    def count_users(self) -> int:
        if self.mode == "postgresql":
            with self._connect() as connection:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
                    return int(cursor.fetchone()[0])

        return sum(1 for user in self._read_json() if user.get("role", "user") == "user")

    def _register_json(self, username: str, password: str) -> dict:
        users = self._read_json()
        token = str(uuid4())
        users.append(
            {
                "id": str(uuid4()),
                "username": username,
                "password_hash": _hash_password(password),
                "role": "user",
                "token": token,
                "created_at": _now(),
                "updated_at": _now(),
                "last_login_at": None,
            }
        )
        self._write_json(users)
        return {"username": username, "token": token, "role": "user"}

    def _register_postgres(self, username: str, password: str) -> dict:
        token = str(uuid4())
        timestamp = _now()
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO users (
                        id, username, password_hash, role, token, created_at, updated_at, last_login_at
                    )
                    VALUES (%s, %s, %s, 'user', %s, %s, %s, NULL)
                    """,
                    (
                        str(uuid4()),
                        username,
                        _hash_password(password),
                        token,
                        timestamp,
                        timestamp,
                    ),
                )
            connection.commit()
        return {"username": username, "token": token, "role": "user"}

    def register(self, username: str, password: str) -> dict:
        if self.mode == "postgresql":
            return self._register_postgres(username, password)
        return self._register_json(username, password)

    def _login_json(self, username: str, password: str) -> dict | None:
        admin_result = self._login_admin(username, password)
        if admin_result:
            return admin_result

        users = self._read_json()
        for user in users:
            if user.get("username") != username:
                continue

            stored_hash = user.get("password_hash") or user.get("password") or ""
            if not _verify_password(password, stored_hash):
                return None

            user["password_hash"] = _hash_password(password)
            user.pop("password", None)
            user["token"] = str(uuid4())
            user["updated_at"] = _now()
            user["last_login_at"] = _now()
            self._write_json(users)
            return {"username": username, "token": user["token"], "role": user.get("role", "user")}

        return None

    def _login_postgres(self, username: str, password: str) -> dict | None:
        admin_result = self._login_admin(username, password)
        if admin_result:
            return admin_result

        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT password_hash, role FROM users WHERE username = %s LIMIT 1",
                    (username,),
                )
                row = cursor.fetchone()
                if row is None:
                    return None

                if not _verify_password(password, row[0]):
                    return None

                token = str(uuid4())
                timestamp = _now()
                cursor.execute(
                    """
                    UPDATE users
                    SET token = %s, updated_at = %s, last_login_at = %s
                    WHERE username = %s
                    """,
                    (token, timestamp, timestamp, username),
                )
            connection.commit()

        return {"username": username, "token": token, "role": row[1] or "user"}

    def _login_admin(self, username: str, password: str) -> dict | None:
        if not self.admin_username or not self.admin_password:
            return None
        if username != self.admin_username:
            return None
        if not hmac.compare_digest(password, self.admin_password):
            return None
        token = f"admin-{uuid4()}"
        self.admin_tokens.add(token)
        return {"username": username, "token": token, "role": "admin"}

    def is_admin_session(self, username: str | None, token: str | None, role: str | None) -> bool:
        if role != "admin":
            return False
        if username != self.admin_username:
            return False
        if not token:
            return False
        return token in self.admin_tokens

    def login(self, username: str, password: str) -> dict | None:
        if self.mode == "postgresql":
            return self._login_postgres(username, password)
        return self._login_json(username, password)
