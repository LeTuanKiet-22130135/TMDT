import subprocess
import uuid

import bcrypt

from src.config import PG_CONTAINER, PG_USER, PG_DB

ROLES = ["BUYER", "SELLER", "ADMIN"]


def _run_sql(sql: str) -> str:
    result = subprocess.run(
        [
            "docker", "exec", PG_CONTAINER,
            "psql", "-U", PG_USER, "-d", PG_DB,
            "-t", "-c", sql,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def pick_role(prompt: str = "Chọn role") -> str:
    print(f"\n{prompt}:")
    for i, role in enumerate(ROLES, 1):
        print(f"  {i}. {role}")
    while True:
        raw = input("Nhập số (1-3): ").strip()
        if raw in ("1", "2", "3"):
            return ROLES[int(raw) - 1]
        print("  Nhập 1, 2, hoặc 3.")


def user_exists(email: str) -> bool:
    sql = f"SELECT COUNT(*) FROM users WHERE email = '{email}';"
    out = _run_sql(sql)
    return out.strip() == "1"


def create_user(email: str, full_name: str, password: str, role: str) -> None:
    user_id = str(uuid.uuid4())
    pw_hash = _hash_password(password)
    cart_id = str(uuid.uuid4())

    sql = f"""
INSERT INTO users (id, email, password_hash, auth_provider, role, full_name,
                   specialties, social_links, reward_points, is_active, is_verified, is_gold)
VALUES (
  '{user_id}', '{email}', '{pw_hash}', 'LOCAL', '{role}', '{full_name}',
  '[]'::jsonb, '{{}}'::jsonb, 0, true, true, false
);
INSERT INTO shopping_cart (id, user_id) VALUES ('{cart_id}', '{user_id}');
"""
    _run_sql(sql)
    print(f"\n✓ Tạo tài khoản thành công")
    print(f"  Email : {email}")
    print(f"  Role  : {role}")
    print(f"  ID    : {user_id}")


def change_password(email: str, new_password: str) -> None:
    pw_hash = _hash_password(new_password)
    sql = f"UPDATE users SET password_hash = '{pw_hash}' WHERE email = '{email}';"
    _run_sql(sql)
    print(f"\n✓ Đổi mật khẩu thành công cho {email}")


def change_role(email: str, new_role: str) -> None:
    sql = f"UPDATE users SET role = '{new_role}' WHERE email = '{email}';"
    _run_sql(sql)
    print(f"\n✓ Đổi role thành công: {email} → {new_role}")
