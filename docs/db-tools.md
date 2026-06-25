# db-tools — Hướng dẫn sử dụng

Tool backup và restore database PostgreSQL + file storage cho dự án Lumine.

## Yêu cầu

- Docker đang chạy với container `tmdt_db`
- Python 3.12+
- [uv](https://docs.astral.sh/uv/)

---

## Cài đặt

```bash
cd db-tools
uv sync
```

Tạo file `.env` từ mẫu (nếu cần thay đổi cấu hình mặc định):

```bash
cp .env.example .env
```

Các biến mặc định đã khớp với `docker-compose.yml` của dự án — không cần chỉnh nếu dùng setup chuẩn.

---

## Export — Xuất toàn bộ dữ liệu

Tạo một file `.tar.gz` chứa:
- `dump.sql` — toàn bộ schema + data từ PostgreSQL
- `uploads/` — toàn bộ file đã upload (ảnh sản phẩm, v.v.)

**Cú pháp:**

```bash
uv run python main.py export [--output-dir <thư_mục>]
```

**Ví dụ:**

```bash
# Xuất vào thư mục hiện tại
uv run python main.py export

# Xuất vào thư mục backups/
uv run python main.py export --output-dir ./backups
```

File tạo ra có dạng: `tmdt_backup_YYYYMMDD_HHMMSS.tar.gz`

---

## Import — Khôi phục dữ liệu

Khôi phục từ file archive vào một database đích (mặc định: `tmdt-backup`).  
**Không bao giờ import thẳng vào database `tmdt` đang production.**

**Cú pháp:**

```bash
uv run python main.py import <đường_dẫn_archive> [options]
```

**Options:**

| Flag | Mô tả | Mặc định |
|---|---|---|
| `--target-db` | Tên database đích | `tmdt-backup` |
| `--overwrite` | Xóa và tạo lại database đích trước khi restore | `false` |
| `--no-files` | Bỏ qua việc khôi phục file uploads | `false` |

**Ví dụ:**

```bash
# Import vào tmdt-backup (mặc định)
uv run python main.py import backups/tmdt_backup_20260625_171856.tar.gz

# Import vào database tên khác
uv run python main.py import archive.tar.gz --target-db tmdt-staging

# Ghi đè database đích nếu đã tồn tại (drop + recreate)
uv run python main.py import archive.tar.gz --target-db tmdt-backup --overwrite

# Chỉ restore database, không restore file
uv run python main.py import archive.tar.gz --no-files
```

**Vị trí file sau khi restore:**  
Files được copy vào `bk-tmdt/uploads_<tên-database>/` thay vì ghi đè `uploads/` production.  
Ví dụ: `bk-tmdt/uploads_tmdt-backup/`

---

## Cấu hình `.env`

```env
PG_CONTAINER=tmdt_db        # Tên Docker container chứa PostgreSQL
PG_USER=postgres             # PostgreSQL user
PG_PASSWORD=123              # Mật khẩu
PG_DB=tmdt                   # Database nguồn (để export)
PG_HOST=localhost
PG_PORT=5432

# Đường dẫn tuyệt đối đến thư mục uploads (tự động detect nếu để trống)
# UPLOADS_DIR=/path/to/bk-tmdt/uploads

BACKUP_DB=tmdt-backup        # Database đích mặc định khi import
```

---

## Quy trình backup định kỳ

```bash
# Chạy hàng ngày, lưu vào /backups với timestamp tự động
cd db-tools
uv run python main.py export --output-dir /backups
```

Gợi ý dùng cron:

```
0 3 * * * cd /home/huy/Workspace/TMDT/db-tools && uv run python main.py export --output-dir ./backups >> ./backups/cron.log 2>&1
```

---

## Cấu trúc file archive

```
tmdt_backup_YYYYMMDD_HHMMSS.tar.gz
├── dump.sql        # pg_dump --no-owner --no-acl (plain SQL)
└── uploads/
    ├── abc123.png
    └── ...
```
