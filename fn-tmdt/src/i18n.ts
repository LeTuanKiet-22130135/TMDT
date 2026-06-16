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
        layout: {
          brandPrefix: "Lumine",
          brandSuffix: "",
          copyright: "© {{year}} Lumine. Tất cả các quyền được bảo lưu.",
          terms: "Điều khoản dịch vụ",
          privacy: "Chính sách bảo mật"
        }
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
