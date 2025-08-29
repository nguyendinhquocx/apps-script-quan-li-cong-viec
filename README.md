# Hệ thống Quản Lý Công Việc

Ứng dụng web quản lý dự án và công việc được xây dựng trên Google Apps Script.

## Tính năng chính

- **Quản lý dự án**: Tạo, chỉnh sửa và theo dõi tiến độ dự án
- **Quản lý công việc**: Phân công và theo dõi nhiệm vụ
- **Quản lý nhân viên**: Quản lý thông tin và phân quyền
- **Hệ thống thông báo**: Giao tiếp linh hoạt theo vai trò (Admin/Manager/Staff)
- **Smart Sync**: Đồng bộ dữ liệu tự động trong nền
- **Báo cáo và thống kê**: Dashboard với biểu đồ trực quan

## Phân quyền

- **Admin**: Toàn quyền quản lý hệ thống
- **Manager**: Quản lý team và gửi thông báo
- **Staff**: Thực hiện công việc và gửi báo cáo

## Công nghệ

- **Backend**: Google Apps Script, Google Sheets
- **Frontend**: HTML5, Tailwind CSS, Alpine.js, Chart.js
- **Database**: Google Sheets làm cơ sở dữ liệu

## Cấu trúc file

- `code.js`: Backend logic và API
- `index.html`: Giao diện chính
- `js.html`: JavaScript frontend
- `css.html`: Styling và CSS
- `appsscript.json`: Cấu hình Google Apps Script

## Triển khai

1. Tạo Google Apps Script project mới
2. Copy nội dung các file vào project
3. Tạo Google Sheets cho database
4. Deploy as web app với quyền truy cập phù hợp

## Đóng góp

Dự án được phát triển và duy trì bởi team phát triển nội bộ.
