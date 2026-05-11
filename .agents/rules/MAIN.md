---
trigger: always_on
---

# Ngôn ngữ
Luôn giai tiếp với tôi bằng ngôn ngữ tiếng việt.

# Code Guidelines

## Chú thích

KHÔNG sử dụng các chú thích kiểu "tiêu đề" như: // === Phương thức hỗ trợ === .

Hãy sử dụng chú thích tài liệu, nhưng tránh chú thích inline trừ khi THẬT SỰ cần thiết để làm rõ nghĩa. Mã nguồn nên tự giải thích!

## Test
- Luôn tạo test cho các hiện thực mã hóa.

## Print
- Khi in bất kỳ thông tin gì ra console, luôn viết bằng tiếng anh

## Error
- Luôn trả về cho client lỗi
```json
{
  "error": 500
"message": "Something wrong"
}
```
