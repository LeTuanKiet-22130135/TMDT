import smtplib
from email.message import EmailMessage
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.smtp_username or not settings.smtp_password:
        logger.warning("SMTP credentials not configured. Skipping email sending.")
        return

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = settings.smtp_from_email
    msg['To'] = to_email
    msg.set_content("Please enable HTML to view this email.")
    msg.add_alternative(html_body, subtype='html')

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
            logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

def send_otp_email(to_email: str, name: str, otp: str) -> None:
    subject = "Xác thực tài khoản của bạn - Mã OTP"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333; }}
            .header {{ background-color: #fbfbfe; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ padding: 30px; background-color: #ffffff; border: 1px solid #eaeaea; border-top: none; border-radius: 0 0 8px 8px; }}
            .otp-box {{ background-color: #fff0f3; border: 1px dashed #f65c88; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #db2e50; margin: 20px 0; border-radius: 8px; }}
            .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #888; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="color: #040316; margin: 0;">Chào mừng bạn đến với Lumine!</h2>
            </div>
            <div class="content">
                <p>Xin chào <strong>{name}</strong>,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã xác thực (OTP) dưới đây để xác minh tài khoản của bạn. Mã này có hiệu lực trong vòng 15 phút.</p>
                <div class="otp-box">{otp}</div>
                <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Lumine. Tất cả các quyền được bảo lưu.</p>
            </div>
        </div>
    </body>
    </html>
    """
    send_email(to_email, subject, html_body)

def send_password_reset_email(to_email: str, name: str, otp: str) -> None:
    subject = "Lấy lại mật khẩu"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333; }}
            .header {{ background-color: #fbfbfe; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ padding: 30px; background-color: #ffffff; border: 1px solid #eaeaea; border-top: none; border-radius: 0 0 8px 8px; }}
            .otp-box {{ background-color: #fff0f3; border: 1px dashed #f65c88; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #db2e50; margin: 20px 0; border-radius: 8px; }}
            .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #888; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="color: #040316; margin: 0;">Lấy lại mật khẩu</h2>
            </div>
            <div class="content">
                <p>Xin chào <strong>{name}</strong>,</p>
                <p>Bạn đã yêu cầu lấy lại mật khẩu. Vui lòng sử dụng mã xác thực (OTP) dưới đây để đổi mật khẩu. Mã này có hiệu lực trong vòng 15 phút.</p>
                <div class="otp-box">{otp}</div>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Lumine. Tất cả các quyền được bảo lưu.</p>
            </div>
        </div>
    </body>
    </html>
    """
    send_email(to_email, subject, html_body)
