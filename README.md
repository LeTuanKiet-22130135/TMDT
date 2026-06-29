Hướng dẫn dành cho con người.

# Cấu trúc
```
. (root dự án)
├── bk-cacao (backend python)
├── bk-tmdt (backend java hoặc thích gì dùng cái đó)
├── docs (tài liệu)
├── fn-tmdt (frontend)
└── các service khác...
```

# Tool cần cài
- docker desktop
- uv package manager : dành cho dự án python.

# Cách tạo service mới.
Để tạo serivce mới bằng ngôn ngữ khác, hãy tạo dự án đó trong thư mục root dự án.
## Bắt đầu:
- Tìm xem graphql trong dự án muốn làm cần setup như nào.
- Tìm xem orm trong dự án muốn làm cần setup như nào.
## Ví dụ:
- Nếu là python thì tạo thư mục mới rồi code trong thư mục đó. Nodejs cũng làm tương tự.
- Nếu là java, trong intelij chọn tạo dự án mới, chọn lưu ở root dự án rồi đặt tên. Kết quả là một thư mục dự án java nằm trong root dự án.

Luôn tạo một Dockerfile cho service mới tạo. Nó sử dụng để chạy dự án không phân biệt môi trường.

# Cách vibe code
- Nếu thích vibe code, hãy nhớ ghi rule vào .agents/rules
- Hãy tạo skill nếu cần thiết.
- Tùy chọn: ghi docs nếu muốn nhờ ai đó làm gì.
- Luôn bổ sung architecture vào architecture.md, nó dùng để cho AI biết dự án dùng cái gì, cấu trúc thư mục balaa.

# Commit
- Tất cả commit cần vào nhánh dev
- Khi chắc chắn nó chạy đc thì commit vào main
- backup chứa cái chạy được của nhánh main trước đó. Ví dụ main đang ở phiên bản 1.1 thì backup đang ở phiên bản 1.0

# Chú ý:
- Luôn sử dụng graphql trong dự án.
- Luôn sử dụng orm trong dự án. Hạn chế viết sql thuần, nếu có dùng thì comment rõ ràng.
- Đảm bảo service phải chạy được khi dùng docker.
- Luôn update architecture.md.
- KHÔNG ĐƯỢC COMMIT LÊN GITEA. CÁI GÌ QUAN TRỌNG CAPLOCK.
- KHÔNG SỬ GITEA/WORKFLOW HOẶC KÊU **AI** SỬA WORKFLOW NẾU ĐỘT NHIÊN THẤY NÓ TRONG DỰ ÁN.

# Các chức năng chính (Features)
## Wallet & Rút tiền (Withdrawals)
Hệ thống ví điện tử tích hợp VNPay và rút tiền nội bộ:
- **Nạp tiền (Topup):** Người dùng nạp qua cổng VNPay, tiền nạp thành công sẽ được cập nhật trực tiếp vào `Wallet` thông qua REST API Callback từ VNPay.
- **Thanh toán bằng ví (Wallet Checkout):** Khi thanh toán, người dùng có thể chọn phương thức `WALLET` (nếu số dư khả dụng >= giá trị đơn hàng). Tiền sẽ bị trừ ngay trong ví và giao dịch được lưu với `transaction_type=PAYMENT`.
- **Rút tiền (Withdrawal):** 
  - Người dùng yêu cầu rút tiền (tối thiểu 50,000 VND), cung cấp thông tin ngân hàng. Tiền bị trừ tạm tính khỏi ví và giao dịch có trạng thái `PENDING`.
  - Admin vào trang Dashboard (`fn-admin` -> Yêu cầu rút tiền) để xem các yêu cầu rút tiền.
  - Khi Admin duyệt (`SUCCESS`), tiền xem như đã chuyển xong.
  - Khi Admin từ chối (`FAILED`), hệ thống tự động hoàn tiền (`Refund`) vào số dư ví của người dùng.