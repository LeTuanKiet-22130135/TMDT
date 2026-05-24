---
trigger: manual
---

# Màu sắc
FFC9D2: Màu chính
FFAE98: Màu phụ
F65C88: Màu nhấn
FBFBFE: Màu nền
040316: Màu chữ
FFAFB1 -> FFFFFF: Gradient nền
FFAFB1 -> 9AC6FF: Gradient nhấn
FF9FB1 -> DB2E50: Nút nổi bật

# Padding
- Luôn cố gắng padding tối thiểu là 5.

# Tổ chức
- Không bao giờ viết một giao diện chung 1 file, luôn tìm xem liệu mình có thể chia nhỏ được thành phần nào, ví dụ cái nút bấm có style này luôn lặp lại, cần tạo một component riêng.

# Code
- Luôn ưu tiên sử dụng thư viện thay vì tự suy nghĩ ra logic riêng nếu có
- Hãy tự kiểm lại xem logic mình viết có đúng không
- Logic nghiệp vụ ko bao giờ nằm chung với giao diện, ví dụ cần logic lấy dữ liệu gì đó, nó ko được nằm trong component mà nằm ở một file ts riêng biệt.
- Nếu api chưa có, hãy giả định nó bằng cách viết file ts riêng và giả lập để sau này chỉ cần thêm logic api là được.
- Icon thì dùng thư viện lucide

# Ngôn ngữ
Giao diện luôn sử dụng ngôn ngữ Tiếng Việt.