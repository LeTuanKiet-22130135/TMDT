import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  vi: {
    translation: {
      auth: {
        login: {
          title: "Đăng Nhập",
          emailPlaceholder: "Địa chỉ Email",
          passwordPlaceholder: "Mật khẩu",
          forgotPassword: "Quên mật khẩu?",
          submit: "Đăng Nhập",
          noAccount: "Chưa có tài khoản?",
          registerNow: "Đăng ký ngay",
          error: "Đăng nhập thất bại. Vui lòng thử lại."
        },
        register: {
          title: "Tạo Tài Khoản",
          fullNamePlaceholder: "Họ và Tên",
          emailPlaceholder: "Địa chỉ Email",
          passwordPlaceholder: "Mật khẩu",
          agreeTerms: "Tôi đồng ý với",
          termsLink: "các điều khoản và dịch vụ",
          submit: "Đăng Ký",
          hasAccount: "Đã có tài khoản?",
          loginNow: "Đăng nhập",
          termsError: "Vui lòng đồng ý với các điều khoản và dịch vụ.",
          error: "Đăng ký thất bại. Vui lòng thử lại."
        },
        verify: {
          title: "Xác Thực OTP",
          instruction: "Chúng tôi đã gửi mã xác nhận đến email",
          inputPlaceholder: "Nhập mã OTP 6 số",
          submit: "Xác Thực Ngay",
          successTitle: "Xác Thực Thành Công",
          successMessage: "Tài khoản của bạn đã được xác thực thành công. Hệ thống sẽ tự động chuyển hướng đến trang đăng nhập trong giây lát...",
          toLogin: "Đến Trang Đăng Nhập",
          lengthError: "Mã OTP phải có 6 chữ số",
          error: "Xác thực thất bại. Vui lòng thử lại."
        },
        forgotPassword: {
          title: "Quên Mật Khẩu",
          instruction: "Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn để lấy lại mật khẩu.",
          emailPlaceholder: "Địa chỉ Email",
          submit: "Gửi Yêu Cầu",
          success: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn lấy lại mật khẩu.",
          error: "Đã có lỗi xảy ra. Vui lòng thử lại.",
          backToLogin: "Quay lại trang Đăng Nhập"
        },
        verifyResetOtp: {
          title: "Xác Nhận OTP",
          instruction: "Vui lòng nhập mã OTP 6 số đã được gửi đến email của bạn.",
          otpPlaceholder: "Nhập mã OTP",
          submit: "Tiếp Tục",
          error: "Vui lòng nhập mã OTP gồm 6 chữ số."
        },
        resetPassword: {
          title: "Đặt Lại Mật Khẩu",
          instruction: "Vui lòng nhập mật khẩu mới của bạn.",
          passwordPlaceholder: "Mật khẩu mới",
          confirmPlaceholder: "Xác nhận mật khẩu",
          submit: "Xác Nhận Đổi Mật Khẩu",
          success: "Đổi mật khẩu thành công. Đang chuyển hướng...",
          error: "Đã có lỗi xảy ra. Vui lòng thử lại.",
          matchError: "Mật khẩu không khớp.",
          invalidToken: "Đường dẫn không hợp lệ hoặc đã hết hạn."
        },
        layout: {
          brandPrefix: "Lumine",
          brandSuffix: "",
          copyright: "© {{year}} Lumine. Tất cả các quyền được bảo lưu.",
          terms: "Điều khoản dịch vụ",
          privacy: "Chính sách bảo mật"
        }
      },
      header: {
        searchPlaceholder: "Tìm kiếm tài nguyên...",
        shiroSearching: "Shiro đang sử dụng thanh tìm kiếm...",
        library: "Thư viện",
        create: "Tạo mới",
        login: "Đăng nhập",
        register: "Đăng ký",
        searchPanel: {
          shiro: {
            tab: "Shiro",
            title: "Sử dụng Shiro để tìm kiếm cho bạn",
            promptPlaceholder: "Nhập yêu cầu của bạn, Shiro sẽ xử lý tất cả..."
          },
          manual: {
            tab: "Manual",
            title: "Lọc thủ công thông qua khung nhập",
            priceFilter: "Lọc theo giá",
            categoryFilter: "Danh mục",
            tagsTitle: "Gợi ý cho bạn"
          }
        }
      },
      home: {
        title: "Bộ sưu tập tuần",
        subtitle: "Những tài nguyên cao cấp được chọn lọc thủ công từ các nhà sáng tạo đổi mới nhất thế giới. Chiều sâu, kết cấu và linh hồn trong từng byte.",
        latest: "Mới nhất",
        popular: "Phổ biến"
      },
      user: {
        menu: {
          profile: "Chỉnh sửa hồ sơ",
          settings: "Cài đặt",
          orders: "Đơn hàng của tôi",
          shops: "Cửa hàng của tôi",
          logout: "Đăng xuất"
        }
      },
      footer: {
        copyrightShort: "© {{year}} Lumine."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "vi",
    fallbackLng: "vi",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
