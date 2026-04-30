## Current tasks from user prompt
- Đưa gửi email thành optional.
- Cho phép đăng nhập bằng Google/GitHub only khi chưa cấu hình được mail sender.
- Tắt tạm thời (không xoá) các chức năng liên quan email; có thể bật lại khi có đủ env của ít nhất 1 mail sender.
- Implement theo plan `social_only_auth_auto_toggle` (không sửa plan file), hoàn thành tất cả todos.

## Plan (simple): your plan & thoughts to solve task(s).
- Chuẩn hoá detection “mail enabled” dựa trên env thực sự hợp lệ (non-empty, đủ cặp user/pass khi cần) và làm `MAIL_SENDER` optional khi mail off.
- Guard các API endpoint/flows cần gửi email; thêm endpoint capability để FE biết state.
- FE: vẫn hiển thị khối email nhưng disabled + thông báo khi mail off; social login vẫn hoạt động.
- Policy: chặn cả `/pwdless/validate` khi mail off để đảm bảo “google/github only”.

## Steps
- Audit mail config/validator và fix điều kiện tạo transporter.
- Implement `isMailEnabled` (central) và dùng nó trong AuthService/AuthController.
- Thêm `GET /auth/capabilities`.
- FE fetch capability, disable email UI và map lỗi thân thiện.
- Kiểm tra lint/test cơ bản.

## Things done
- Khởi tạo workflow memory file.
- `MAIL_SENDER` trở thành optional; mail transporter chỉ bật khi credential non-empty thực sự.
- Thêm mail capability helper và MailService tự no-op khi không có transporter.
- API: guard các flow/register/pwdless/confirm/validate khi mail off; thêm `GET /auth/capabilities`.
- API: Google login không còn làm app crash nếu thiếu AUTH_GOOGLE_ID/SECRET (trả lỗi cấu hình khi gọi).
- FE: login page fetch capabilities, disable email UI + thông báo; disable nút social nếu provider không bật.
- FE: auth-provider map lỗi `mail_not_configured` thành message thân thiện.
- Verified: `yarn nx build api` chạy thành công.

## Things not done yet
- (Tuỳ chọn) Chạy build/lint FE nếu cần trong CI.

