# Hướng dẫn thiết lập hệ thống Email (SMTP)

Tài liệu này hướng dẫn bạn cách cấu hình hệ thống gửi email tự động (chẳng hạn như gửi mã OTP) cho dịch vụ backend của dự án Lumine.

Để test, cần tạo một tài khoản mailtrap thì mới test được.

## 1. Cấu hình biến môi trường (.env)

Mở file `.env` nằm trong thư mục `bk-tmdt/` và thêm (hoặc cập nhật) các biến môi trường sau:

```ini
SMTP_HOST=smtp.gmail.com       # Hoặc host của nhà cung cấp dịch vụ mail bạn dùng
SMTP_PORT=587                  # Thường là 587 cho TLS hoặc 465 cho SSL
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
```

**Lưu ý đối với Gmail:**
- Bạn không thể dùng mật khẩu đăng nhập bình thường do chính sách bảo mật.
- Hãy bật **Xác minh 2 bước (2-Step Verification)** trên tài khoản Google của bạn.
- Tạo một **Mật khẩu ứng dụng (App Password)** (mật khẩu gồm 16 chữ cái) và dán nó vào `SMTP_PASSWORD`.

## 2. Cách kiểm tra (Test) hệ thống gửi mail

Để kiểm tra xem cấu hình email đã hoạt động hay chưa, bạn có thể áp dụng một trong hai cách sau:

### Cách 1: Kiểm tra qua giao diện Web (Frontend)
1. Đảm bảo cả hai dịch vụ Backend và Frontend đều đang chạy (`uv run python main.py` và `npm run dev`).
2. Mở trình duyệt và truy cập vào trang **Đăng ký tài khoản**.
3. Điền thông tin đăng ký với một **email có thật** mà bạn có thể mở ra kiểm tra được.
4. Bấm **Đăng Ký**.
5. Mở hộp thư đến (Inbox) của email đó. Nếu bạn nhận được email chứa mã OTP xác thực có logo của Lumine, nghĩa là hệ thống đã hoạt động chính xác!

### Cách 2: Test trực tiếp bằng Script Python
Bạn có thể tự tạo một đoạn script ngắn để test gửi mail trong thư mục `bk-tmdt` (Đảm bảo bạn đứng ở thư mục `bk-tmdt`):

1. Tạo file `test_email.py` với nội dung sau:
```python
from app.services.email import send_otp_email

# Thay thế bằng email thật của bạn
test_email = "email_cua_ban@domain.com" 

try:
    send_otp_email(test_email, "Người Dùng Test", "123456")
    print(f"✅ Đã gửi lệnh test email đến {test_email}!")
except Exception as e:
    print(f"❌ Lỗi khi gửi mail: {e}")
```

2. Chạy file script bằng câu lệnh:
```bash
uv run python test_email.py
```

3. Mở email kiểm tra xem có nhận được thư không.
> **Lưu ý**: Hãy nhớ xóa file `test_email.py` này sau khi test xong để giữ source code luôn gọn gàng và sạch sẽ nhé!
