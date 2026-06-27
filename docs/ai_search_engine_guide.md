# Hướng dẫn cấu hình Ollama và sử dụng AI Search Engine

Tài liệu này hướng dẫn bạn cách thiết lập môi trường cho Ollama và cách sử dụng tính năng **AI Search Engine (Tìm kiếm bằng AI)** tích hợp trong dự án `bk-cacao`.

---

## 1. Cấu hình Ollama

Ứng dụng của chúng ta kết nối với mô hình ngôn ngữ lớn (LLM) thông qua Ollama. Để cấu hình Ollama, bạn cần chỉnh sửa file `.env.test` nằm ở thư mục gốc của dự án.

### Nội dung file `.env.test`
Bạn cần thiết lập các biến môi trường sau:
```env
OLLAMA_API=http://homeserver:11434 # Tự thêm URL máy chủ Ollama của bạn vào đây.
MODEL=gemma4:31b-cloud             # Tên model bạn muốn sử dụng (ví dụ: llama3, gemma4:31b-cloud,...)
OLLAMA_API_KEY=your_secret_key     # (Tùy chọn) Thêm khóa API nếu máy chủ Ollama yêu cầu xác thực.
```

**Lưu ý**: 
- Nếu bạn chạy Ollama trên máy tính cá nhân (local), URL thường sẽ là `http://localhost:11434`.
- Hãy đảm bảo bạn đã tải model về máy chủ Ollama bằng lệnh: `ollama pull <tên_model>`.

---

## 2. Khởi tạo dữ liệu (Seeding)

AI Search Engine sử dụng công nghệ **Semantic Search (Tìm kiếm theo ngữ nghĩa)**. Nó lưu trữ dữ liệu dưới dạng các "Vector Embeddings" trong thư mục `faiss_index` bằng thư viện FAISS và HuggingFace.

Lần đầu tiên chạy dự án, bạn nên tạo dữ liệu mẫu và Vector Store bằng cách chạy:
```bash
uv run seed_db.py
```
Lệnh này sẽ tự động tải mô hình nhúng (`all-MiniLM-L6-v2`) về (nếu chưa có) và nạp danh sách sản phẩm mẫu vào SQLite cùng với FAISS.

---

## 3. Khởi động Server

Chạy lệnh sau để khởi động API Server bằng FastAPI:
```bash
uv run uvicorn main:app --reload
```
Giao diện quản lý API và GraphQL sẽ khả dụng tại: `http://localhost:8000/graphql`

---

## 4. Cách sử dụng AI Search Engine

Cơ chế hoạt động của AI Search Engine gồm 2 bước:
1. **Trích xuất thông tin (Query Extraction)**: Khi bạn nhập một câu tiếng Anh, hệ thống gọi Ollama để trích xuất các tiêu chí tìm kiếm như `name`, `min_price`, và `max_price`.
2. **Tìm kiếm ngữ nghĩa (Semantic Search)**: Hệ thống sử dụng FAISS để tìm các sản phẩm có ý nghĩa tương đồng với `name` (thay vì tìm chính xác từng chữ), sau đó lọc thêm khoảng giá từ SQLite.

### Ví dụ truy vấn (GraphQL)

Tại giao diện `http://localhost:8000/graphql`, bạn có thể chạy truy vấn sau:

```graphql
query {
  searchProductsByAi(prompt: "Find me some warm winter clothes under 200 dollars") {
    id
    name
    price
    description
  }
}
```

**Kết quả kì vọng**:
- Ollama sẽ trích xuất ra: `name="warm winter clothes"`, `max_price=200`.
- FAISS sẽ tìm các sản phẩm gần nghĩa nhất như `Winter Coat` hay `Leather Jacket`.
- Kết quả trả về là một danh sách JSON thuần túy gồm thông tin chi tiết các sản phẩm đó.
