Danh sách tham số - Thông tin gửi sang VNPAY (vnp_Command=pay)
Tham số 	Kiểu dữ liệu 	Bắt buộc/Tùy chọn 	Mô tả
vnp_Version 	Alphanumeric[1,8] 	Bắt buộc 	Phiên bản api mà merchant kết nối. Phiên bản hiện tại là : 2.1.0
vnp_Command 	Alpha[1,16] 	Bắt buộc 	Mã API sử dụng, mã cho giao dịch thanh toán là: pay
vnp_TmnCode 	Alphanumeric[8] 	Bắt buộc 	Mã website của merchant trên hệ thống của VNPAY. Ví dụ: 2QXUI4J4
vnp_Amount 	Numeric[1,12] 	Bắt buộc 	Số tiền thanh toán. Số tiền không mang các ký tự phân tách thập phân, phần nghìn, ký tự tiền tệ. Để gửi số tiền thanh toán là 10,000 VND (mười nghìn VNĐ) thì merchant cần nhân thêm 100 lần (khử phần thập phân), sau đó gửi sang VNPAY là: 1000000
vnp_BankCode 	Alphanumeric[3,20] 	Tùy chọn 	Mã phương thức thanh toán, mã loại ngân hàng hoặc ví điện tử thanh toán.
Nếu không gửi sang tham số này, chuyển hướng người dùng sang VNPAY chọn phương thức thanh toán.
Lưu ý:
Các mã loại hình thức thanh toán lựa chọn tại website-ứng dụng của merchant
vnp_BankCode=VNPAYQRThanh toán quét mã QR
vnp_BankCode=VNBANKThẻ ATM - Tài khoản ngân hàng nội địa
vnp_BankCode=INTCARDThẻ thanh toán quốc tế
vnp_CreateDate 	Numeric[14] 	Bắt buộc 	Là thời gian phát sinh giao dịch định dạng yyyyMMddHHmmss (Time zone GMT+7) Ví dụ: 20220101103111
vnp_CurrCode 	Alpha[3] 	Bắt buộc 	Đơn vị tiền tệ sử dụng thanh toán. Hiện tại chỉ hỗ trợ VND
vnp_IpAddr 	Alphanumeric[7,45] 	Bắt buộc 	Địa chỉ IP của khách hàng thực hiện giao dịch. Ví dụ: 13.160.92.202
vnp_Locale 	Alpha[2,5] 	Bắt buộc 	Ngôn ngữ giao diện hiển thị. Hiện tại hỗ trợ Tiếng Việt (vn), Tiếng Anh (en)
vnp_OrderInfo 	Alphanumeric[1,255] 	Bắt buộc 	Thông tin mô tả nội dung thanh toán quy định dữ liệu gửi sang VNPAY (Tiếng Việt không dấu và không bao gồm các ký tự đặc biệt)
Ví dụ: Nap tien cho thue bao 0123456789. So tien 100,000 VND
vnp_OrderType 	Alpha[1,100] 	Bắt buộc 	Mã danh mục hàng hóa. Mỗi hàng hóa sẽ thuộc một nhóm danh mục do VNPAY quy định. Xem thêm bảng Danh mục hàng hóa
vnp_ReturnUrl 	Alphanumeric[10,255] 	Bắt buộc 	URL thông báo kết quả giao dịch khi Khách hàng kết thúc thanh toán. Ví dụ: https://domain.vn/VnPayReturn
vnp_ExpireDate 	Numeric[14] 	Bắt buộc 	Thời gian hết hạn thanh toán GMT+7, định dạng: yyyyMMddHHmmss
vnp_TxnRef 	Alphanumeric[1,100] 	Bắt buộc 	Mã tham chiếu của giao dịch tại hệ thống của merchant. Mã này là duy nhất dùng để phân biệt các đơn hàng gửi sang VNPAY. Không được trùng lặp trong ngày. Ví dụ: 23554
vnp_SecureHash 	Alphanumeric[32,256] 	Bắt buộc 	Mã kiểm tra (checksum) để đảm bảo dữ liệu của giao dịch không bị thay đổi trong quá trình chuyển từ merchant sang VNPAY. Việc tạo ra mã này phụ thuộc vào cấu hình của merchant và phiên bản api sử dụng. Phiên bản hiện tại hỗ trợ SHA256, HMACSHA512. 

Mã python mẫu:
def payment(request):
    if request.method == 'POST':
        # Process input data and build url payment
        form = PaymentForm(request.POST)
        if form.is_valid():
            order_type = form.cleaned_data['order_type']
            order_id = form.cleaned_data['order_id']
            amount = form.cleaned_data['amount']
            order_desc = form.cleaned_data['order_desc']
            bank_code = form.cleaned_data['bank_code']
            language = form.cleaned_data['language']
            ipaddr = get_client_ip(request)
            # Build URL Payment
            vnp = vnpay()
            vnp.requestData['vnp_Version'] = '2.1.0'
            vnp.requestData['vnp_Command'] = 'pay'
            vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
            vnp.requestData['vnp_Amount'] = amount * 100
            vnp.requestData['vnp_CurrCode'] = 'VND'
            vnp.requestData['vnp_TxnRef'] = order_id
            vnp.requestData['vnp_OrderInfo'] = order_desc
            vnp.requestData['vnp_OrderType'] = order_type
            # Check language, default: vn
            if language and language != '':
                vnp.requestData['vnp_Locale'] = language
            else:
                vnp.requestData['vnp_Locale'] = 'vn'
                # Check bank_code, if bank_code is empty, customer will be selected bank on VNPAY
            if bank_code and bank_code != "":
                vnp.requestData['vnp_BankCode'] = bank_code

            vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
            vnp.requestData['vnp_IpAddr'] = ipaddr
            vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL
            vnpay_payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL, settings.VNPAY_HASH_SECRET_KEY)
            print(vnpay_payment_url)
                # Redirect to VNPAY
                return redirect(vnpay_payment_url)
        else:
            print("Form input not validate")
    else:
        return render(request, "payment.html", {"title": "Thanh toán"})
        // vui lòng tham khảo thêm tại code demo
http://localhost:5173/checkout/result?vnp_Amount=108400000&vnp_BankCode=NCB&vnp_BankTranNo=VNP15599400&vnp_CardType=ATM&vnp_OrderInfo=Lumine+7+digital+assets&vnp_PayDate=20260626073144&vnp_ResponseCode=00&vnp_TmnCode=3MAYAAXP&vnp_TransactionNo=15599400&vnp_TransactionStatus=00&vnp_TxnRef=f69e6ff7-5b28-4b02-b5b8-777e4bad7523&vnp_SecureHash=1a63d6cdece215cde99fb4f51206c035d914e6ad3c8eae19c230381b345c738a6034ad6779b484e2b7f36aeb6c5462134354249e590a3503af580f6b3dc19983