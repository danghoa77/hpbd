# 🎂 Interactive Birthday Book — Thiệp Sinh Nhật 3D Lật Trang

> Một website thiệp sinh nhật tương tác cao cấp được thiết kế dưới dạng **quyển sách điện tử 3D lật trang**.
> Hoàn toàn tĩnh (Static Site), không cần backend, không cần database, tương thích hoàn hảo với **Render Static Site** và GitHub Pages.

---

## 🌟 Tính Năng Nổi Bật

1. **Màn hình khóa bảo vệ bí mật**:
   - Giao diện hộp quà sang trọng với hiệu ứng ánh sáng dịu mắt.
   - Nhập mật khẩu bí mật để mở thiệp (mặc định: `birthday123`).
   - Xử lý mật khẩu mượt mà ở frontend, rung nhẹ và thông báo dễ thương khi nhập sai.
   - Hỗ trợ lưu phiên đăng nhập (`sessionStorage`) giúp không phải nhập lại mật khẩu khi reload trong cùng phiên.

2. **Hiệu ứng mở sách 3D sống động (Realistic 3D Book Experience)**:
   - Khi mở quà, quyển sách xuất hiện cân đối ở trung tâm với đổ bóng 3D mềm mại.
   - Bìa sách mở lật sang trái với góc nhìn phối cảnh 3D (`perspective`, `rotateY(-180deg)`).
   - Hiệu ứng đổ bóng gáy sách (spine shadow), viền trang giấy xếp lớp chân thực.

3. **Chế độ hiển thị linh hoạt (Dual-Mode UI)**:
   - **Desktop & Tablet (≥ 768px)**: Hiển thị dạng **Two-page Spread** (2 trang mở song song đối xứng qua gáy sách).
   - **Mobile (< 768px)**: Tự động chuyển đổi sang dạng **Single-page Book** gọn gàng, chữ to rõ ràng, không bao giờ xuất hiện thanh cuộn ngang (horizontal scrollbar).

4. **Đa dạng cách lật trang**:
   - Click nút **Trước** / **Tiếp** ở thanh điều khiển dưới cùng.
   - Click vào các chấm tròn chỉ số trang (`Indicator Dots`).
   - Click trực tiếp vào mép trái / mép phải của trang sách.
   - Sử dụng phím mũi tên bàn phím: `←` và `→`.
   - Cử chỉ vuốt chạm trên màn hình cảm ứng điện thoại (`Touch Swipe Left / Right`).

5. **Trang kết thúc bùng nổ (Grand Finale Celebration)**:
   - Bánh kem sinh nhật với hiệu ứng ngọn nến lung linh.
   - Hiệu ứng pháo hoa giấy rực rỡ (`canvas-confetti`) bắn từ trung tâm và hai góc màn hình.
   - Những trái tim và ngôi sao lấp lánh bay bổng từ cạnh dưới.
   - Nút **↻ Xem lại từ đầu** để đọc lại sách bất cứ lúc nào.

6. **Âm nhạc nền thông minh (Dual Audio Engine)**:
   - Phát file MP3 đặt tại thư mục `assets/audio/birthday.mp3`.
   - **Cơ chế dự phòng độc quyền**: Nếu chưa có file nhạc MP3 hoặc file bị lỗi, hệ thống tự động kích hoạt bộ tổng hợp âm thanh **Web Audio API Synthesizer** mô phỏng giai điệu hộp nhạc (Music Box) *"Happy Birthday"* êm dịu, không lo lỗi 404!
   - Nút bật/tắt âm thanh (🔊 / 🔇) trực quan ở góc trên bên phải.

7. **Xử lý ảnh an toàn (Robust Image Fallback)**:
   - Hỗ trợ ảnh định dạng JPG, JPEG, PNG, WEBP.
   - Tự động hiển thị khung ảnh Polaroid nghệ thuật dự phòng nếu ảnh bị thiếu hoặc sai đường dẫn, không bao giờ làm vỡ layout.

8. **Tùy biến dễ dàng**:
   - Toàn bộ nội dung, mật khẩu, hình ảnh, lời chúc và âm nhạc được tách riêng vào file [`js/config.js`](file:///C:/Users/dangh/Desktop/hpbd/js/config.js).

---

## 📁 Cấu Trúc Thư Mục

```text
hpbd/
│
├── index.html              # Trang chủ HTML5 ngữ nghĩa
├── render.yaml             # Cấu hình tự động deploy trên Render Static Site
├── README.md               # Tài liệu hướng dẫn sử dụng & triển khai
│
├── assets/
│   ├── images/             # Nơi chứa ảnh kỷ niệm (photo-1.jpg, photo-2.jpg, ...)
│   │   ├── .gitkeep
│   │   ├── photo-1.jpg
│   │   ├── photo-2.jpg
│   │   ├── photo-3.jpg
│   │   └── photo-4.jpg
│   │
│   └── audio/              # Nơi chứa file nhạc nền (birthday.mp3)
│       ├── .gitkeep
│       └── birthday.mp3
│
├── css/
│   └── style.css           # Toàn bộ hiệu ứng 3D, typography, layout & responsive
│
└── js/
    ├── config.js           # File cấu hình nội dung, mật khẩu, lời chúc
    └── app.js              # Logic ứng dụng, xác thực, lật trang, âm thanh & confetti
```

---

## ⚙️ Hướng Dẫn Tùy Biến (Customize The Birthday Card)

Mọi chỉnh sửa đều thực hiện trong file [`js/config.js`](file:///C:/Users/dangh/Desktop/hpbd/js/config.js) mà không cần đụng đến code logic!

### 1. Thay đổi mật khẩu mở thiệp
Mở [`js/config.js`](file:///C:/Users/dangh/Desktop/hpbd/js/config.js) và tìm dòng:
```javascript
password: "birthday123", // Thay bằng mật khẩu bí mật của bạn (ví dụ: ngày sinh "15092026")
rememberUnlock: true,    // true: reload không cần nhập lại trong cùng phiên duyệt web
```

### 2. Thay đổi tên người nhận và người gửi
```javascript
recipient: {
    name: "Tên người nhận (ví dụ: Lan Anh)",
    nickname: "Bé Yêu"
},

sender: {
    name: "Tên người gửi (ví dụ: Hoàng Đăng)"
},

birthday: {
    title: "Happy Birthday!",
    subtitle: "Chúc mừng sinh nhật tuổi 20",
    date: "15/09/2026"
},
```

### 3. Thay đổi hình ảnh kỷ niệm
1. Copy ảnh của bạn vào thư mục `assets/images/`.
2. Khuyến khích đổi tên thành `photo-1.jpg`, `photo-2.jpg`, `photo-3.jpg`, `photo-4.jpg` (hoặc định dạng `.png`, `.webp`).
3. Cập nhật đường dẫn trong `config.js`:
```javascript
// Trang 2: Ảnh kỷ niệm lớn
image: "assets/images/photo-1.jpg",
caption: "Một kỷ niệm thật đẹp tại Đà Lạt năm ấy.",

// Trang 3: Bộ sưu tập 3 ảnh polaroid
photos: [
    { image: "assets/images/photo-2.jpg", caption: "Nụ cười tỏa nắng ✨" },
    { image: "assets/images/photo-3.jpg", caption: "Bình yên dịu dàng 🌷" },
    { image: "assets/images/photo-4.jpg", caption: "Khoảnh khắc đáng yêu 💖" }
]
```
> *Lưu ý: Nếu không có ảnh hoặc đường dẫn sai, hệ thống sẽ tự động hiển thị khung Polaroid minh họa tuyệt đẹp.*

### 4. Thay đổi lời chúc của từng trang
Trong mảng `pages: [...]` của `config.js`:
- **Trang 1 (`type: "opening"`)**: Lời mở đầu, đoạn trích dẫn ý nghĩa.
- **Trang 2 (`type: "memory"`)**: Ảnh kỷ niệm lớn cùng câu chuyện kèm theo.
- **Trang 3 (`type: "gallery"`)**: Bộ 3 ảnh dạng scrapbook polaroid dán băng keo washi.
- **Trang 4 (`type: "wishes"`)**: 4 thẻ điều ước tương ứng với các icon ✨, 🌷, 🎂, 💖.
- **Trang 5 (`type: "letter"`)**: Lá thư viết tay bằng font chữ mềm mại (`Dancing Script`) kèm con dấu sáp cổ điển.
- **Trang 6 (`type: "final"`)**: Trang kết chúc mừng sinh nhật, kích hoạt pháo hoa và hoa giấy bay.

### 5. Thêm nhạc nền MP3
1. Copy file bài hát yêu thích định dạng `.mp3` vào thư mục `assets/audio/`.
2. Đặt tên là `birthday.mp3` (hoặc chỉnh lại thuộc tính `src` trong `config.js`):
```javascript
music: {
    enabled: true,
    src: "assets/audio/birthday.mp3",
    autoplay: false // Trình duyệt yêu cầu tương tác trước khi phát âm thanh
}
```
> *Mẹo: Khi click "Mở quà", nhạc sẽ bắt đầu phát. Bạn có thể bấm nút 🔊 ở góc trên bên phải để tắt/bật bất kỳ lúc nào.*

### 6. Thay đổi màu sắc chủ đạo (Theme)
Trong `config.js`:
```javascript
theme: {
    primaryColor: "#c86d51", // Màu nhấn chính (terracotta / rose)
    secondaryColor: "#e5b382",
    accentGold: "#d4af37", // Màu vàng kim loại viền sách
    coverBackground: "linear-gradient(145deg, #7c1d2e 0%, #460f1b 100%)", // Màu bìa nhung đỏ rượu
    pageBackground: "#fffdf9"
}
```

---

## 🚀 Hướng Dẫn Chạy Thử Tại Máy (Local)

Website chạy hoàn toàn bằng HTML/CSS/JS thuần, bạn có thể chạy bằng bất kỳ cách nào:

### Cách 1: Mở trực tiếp file HTML
- Nhấp đúp chuột vào file `index.html` trong thư mục dự án để mở bằng Chrome, Edge, Safari hoặc Firefox.

### Cách 2: Chạy qua Static Server (Khuyên dùng)
Nếu máy bạn có cài đặt Python hoặc Node.js:
- **Bằng Python**:
  ```bash
  python -m http.server 8000
  ```
  Sau đó mở trình duyệt tại: `http://localhost:8000`
- **Bằng Node.js (npx serve)**:
  ```bash
  npx serve .
  ```
- **Bằng VS Code**: Cài extension *Live Server* và bấm **Go Live**.

---

## 🌐 Hướng Dẫn Đưa Lên GitHub & Deploy Tự Động Với Render

Dự án đã có sẵn file [`render.yaml`](file:///C:/Users/dangh/Desktop/hpbd/render.yaml) chuẩn chuẩn Render Static Site Blueprint:

```yaml
services:
  - type: web
    name: birthday-book
    runtime: static
    buildCommand: ""
    staticPublishPath: .
```

### Bước 1: Khởi tạo và đẩy code lên GitHub
Chạy các lệnh sau trong terminal tại thư mục dự án:

```bash
# 1. Khởi tạo Git repository
git init

# 2. Thêm toàn bộ file vào git
git add .

# 3. Tạo commit đầu tiên
git commit -m "Initial birthday book"

# 4. Đặt tên nhánh chính là main
git branch -M main

# 5. Thêm địa chỉ remote GitHub của bạn
git remote add origin https://github.com/danghoa77/hpbd.git

# 6. Push code lên GitHub
git push -u origin main
```

### Bước 2: Tạo Static Site trên Render
1. Truy cập [dashboard.render.com](https://dashboard.render.com) và đăng nhập (hoặc đăng ký bằng tài khoản GitHub).
2. Nhấn nút **New +** ở góc trên và chọn **Static Site**.
3. Chọn kết nối tài khoản GitHub và cấp quyền truy cập repository `hpbd` (hoặc `danghoa77/hpbd`).
4. Nhập các thông tin:
   - **Name**: `birthday-book` (hoặc tên bạn muốn, link web sẽ có dạng `tên-bạn.onrender.com`)
   - **Branch**: `main`
   - **Build Command**: Để trống (không cần build)
   - **Publish Directory**: `.` (thư mục gốc)
5. Nhấn nút **Create Static Site**.
6. Render sẽ tự động deploy trong khoảng 30 giây. Sau khi hoàn tất, Render sẽ cung cấp URL công khai để bạn gửi tặng người ấy!

### Quy trình tự động cập nhật (Continuous Deployment)
Mỗi lần bạn chỉnh sửa nội dung hoặc thay đổi ảnh:
```text
Sửa nội dung trong js/config.js hoặc thêm ảnh
         │
         ▼
    git add .
         │
         ▼
git commit -m "Cập nhật lời chúc mới"
         │
         ▼
    git push
         │
         ▼
Render tự động build và cập nhật phiên bản mới ngay lập tức!
```

---

## 🛡️ Tuyên Bố Miễn Trừ Bảo Mật (Security Disclaimer)

> **Lưu ý quan trọng**: Mật khẩu trong website tĩnh (Static Site) chỉ là một lớp khóa giao diện mang tính chất tạo sự bất ngờ và thú vị cho trải nghiệm người dùng. Vì đây là ứng dụng client-side hoàn toàn không có backend hay database, người dùng có kiến thức kỹ thuật vẫn có thể xem mật khẩu hoặc nội dung bằng cách xem mã nguồn (`Inspect Element` / `Source Code`). **Tuyệt đối không sử dụng cơ chế này để lưu trữ hoặc bảo vệ các thông tin mật, nhạy cảm cá nhân.**

---

## 📱 Khả Năng Tương Thích & Đã Được Kiểm Thử

- [x] **Trình duyệt**: Chrome, Microsoft Edge, Mozilla Firefox, Safari, Chrome Android, Mobile Safari.
- [x] **Màn hình Responsive**:
  - Mobile: 375x667 (iPhone SE), 390x844 (iPhone 12/13/14), 430x932 (iPhone 14/15 Pro Max).
  - Tablet: 768x1024 (iPad).
  - Desktop: 1366x768, 1440x900, 1920x1080 Full HD.
- [x] **Cử chỉ Touch Swipe**: Vuốt trái/phải mượt mà trên smartphone.
- [x] **Trợ năng (Accessibility)**: Hỗ trợ `@media (prefers-reduced-motion: reduce)` giảm hiệu ứng chuyển động cho người dùng nhạy cảm.
- [x] **Hiệu năng**: Không thư viện nặng, không layout shift, 0 console error.
