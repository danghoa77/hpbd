/**
 * ====================================================================
 * 🎂 TOÀN BỘ CẤU HÌNH THIỆP SINH NHẬT (BIRTHDAY CONFIGURATION)
 * ====================================================================
 * Bạn có thể tự do chỉnh sửa tất cả thông tin, tên, mật khẩu, thông báo lỗi,
 * hình ảnh, lời chúc, bài hát... tại duy nhất file này mà không cần sửa HTML hay JS!
 *
 * Mẹo: Trong các đoạn text, bạn có thể dùng:
 *   {recipient} -> sẽ tự động thay bằng tên người nhận (config.recipient.name)
 *   {sender}    -> sẽ tự động thay bằng tên người gửi (config.sender.name)
 * ====================================================================
 */

const birthdayConfig = {
    // ----------------------------------------------------------------
    // 1. MẬT KHẨU & BẢO MẬT (PASSWORD & SECURITY)
    // ----------------------------------------------------------------
    auth: {
        // Mật khẩu để mở thiệp (ví dụ: ngày sinh "16092003" hoặc nickname)
        password: "16092003",

        // Ghi nhớ trạng thái đã mở trong phiên (sessionStorage):
        // true: Sau khi nhập đúng 1 lần, F5 tải lại trang sẽ không phải nhập lại.
        // false: Luôn yêu cầu nhập mật khẩu mỗi lần vào trang.
        rememberUnlock: true
    },

    // ----------------------------------------------------------------
    // 2. THÔNG TIN NGƯỜI NHẬN & NGƯỜI GỬI (PEOPLE)
    // ----------------------------------------------------------------
    recipient: {
        name: "Ngọc Ánh",          // Tên chính hiển thị trên thiệp
        nickname: "Yêu"                  // Biệt danh / cách gọi thân mật
    },

    sender: {
        name: "Someone who cares"        // Tên hoặc danh xưng người gửi thiệp
    },

    birthday: {
        date: "16/09/2003",              // Ngày sinh nhật (dd/mm/yyyy)
        formattedDate: "16 Tháng 09, 2003"
    },

    // ----------------------------------------------------------------
    // 3. TIÊU ĐỀ & THANH ĐIỀU HƯỚNG TRÊN CÙNG (HEADER & TOP BAR)
    // ----------------------------------------------------------------
    header: {
        pageTitle: "Happy Birthday! ", // Tiêu đề hiển thị trên tab trình duyệt
        brandText: "Birthday Surprise",                          // Chữ thương hiệu góc trên bên trái
        musicTooltip: "Bật / Tắt âm nhạc",
        lockTooltip: "Khóa lại màn hình"
    },

    // ----------------------------------------------------------------
    // 4. MÀN HÌNH KHÓA (LOCK SCREEN)
    // ----------------------------------------------------------------
    lockScreen: {
        badge: "Chúc mừng sinh nhật em",
        title: "Gửi Ngọc Ánh",
        subtitle: "Nhập mật khẩu để mở món quà sinh nhật đặc biệt này hé!",
        inputPlaceholder: "Nhập mật khẩu bí mật...",
        buttonText: "Mở quà 🎁",
        // Thông báo khi nhập sai mật khẩu:
        errorMessage: "Hmm... mật khẩu chưa đúng 💭 Thử lại hé!",
        // Gợi ý mật khẩu:
        showHint: false, // Đổi thành true nếu muốn hiện gợi ý bên dưới form
        hintText: "Gợi ý: Ngày tháng năm sinh viết liền (vd: 16092003)"
    },

    // ----------------------------------------------------------------
    // 5. BÌA SÁCH (BOOK COVERS)
    // ----------------------------------------------------------------
    cover: {
        // Mặt ngoài bìa sách (Front Cover)
        front: {
            sealIcon: "🌸",
            badge: "",
            title: "Happy Birthday",
            subtitle: "Một lời chúc",
            instruction: "Nhấn nút 'Mở sách' hoặc lật góc để bắt đầu nè📖",
            openButtonText: "Mở sách ✨"
        },

        // Mặt trong bìa sách (Inside Cover - Trang ngỏ mở đầu bên trái)
        inside: {
            tag: "Tặng em",
            title: "Một món quà nhỏ anh gửi em",
            divider: "✨ 🌸 ✨",
            message: "Anh cũng đã gửi thiệp tay cho em rồi nhưng nó ngắn và chữ không đẹp lắm nên anh làm cái này",
            quote: "“Chúc cho hành trình tuổi mới của {recipient} mọi việc luôn suôn sẻ, và nhiều sức khỏe, không có ốm vặt”",
            hint: "Lật tiếp đi hé! 👉"
        }
    },

    // ----------------------------------------------------------------
    // 6. NỘI DUNG CÁC TRANG TRONG SÁCH (BOOK PAGES)
    // ----------------------------------------------------------------
    pages: [
        // Trang 1: Lời mở đầu (Opening)
        {
            type: "opening",
            chapter: "Chương I",
            title: "Hôm Nay Là Một Ngày Đặc Biệt",
            subtitle: "Tuổi mới rạng rỡ",
            decor: "🌸",
            content: "Hôm nay em đi chơi có vui không, hẳn là vui he, có được nhận quà của mấy đứa kia không á, linh thì chắc tặng váy rồi còn mấy nhỏ kia anh không biết, đi ăn xong có hát hò không đó :>",
            quote: "“Mong rằng ngày mai thức dậy, muộn phiền từ tuổi cũ của em sẽ qua hết hehe”"
        },

        // Trang 2: Kỷ niệm đáng nhớ (Memory - Ảnh lớn)
        {
            type: "memory",
            chapter: "Chương II",
            title: "Xinh gái chụp ảnh",
            subtitle: "Ảnh đẹp he",
            decor: "📷",
            image: "assets/images/photo-1.jpg",
            dateTag: "✨ Kỷ niệm đáng nhớ",
            caption: "Mới đó mà nhanh quá ha, cứ như hôm qua thôi :>."
        },

        // Trang 3: Bộ sưu tập ảnh (Gallery Polaroid)
        {
            type: "photos",
            chapter: "Chương III",
            title: "Tiên nữ cũng chỉ đến thế",
            subtitle: "Những nụ cười đong đầy niềm vui",
            decor: "✨",
            photos: [
                {
                    image: "assets/images/photo-2.jpg",
                    caption: "Tươi chưa kìa"
                },
                {
                    image: "assets/images/photo-3.jpg",
                    caption: "Dịu keo hẹ hẹ 🌷"
                }
            ],
            quote: "“Cười xinh thế cơ mà.”"
        },

        // Trang 4: Mục ảnh kỷ niệm (Photo Section 2)
        {
            type: "photos",
            chapter: "Chương IV",
            title: "Ngọt quá, Tan chảy mất",
            subtitle: "Từng nụ cười đong đầy niềm vui",
            decor: "💖",
            photos: [
                {
                    image: "assets/images/photo-4.jpg",
                    caption: "Quá đẹpp 💖"
                },
                {
                    image: "assets/images/photo-7.jpg",
                    caption: "Xinh quó ✨"
                }
            ],
            quote: "“Nhớ ghê he 💖 .”"
        },

        // Trang 5: Mục ảnh yêu thương (Photo Section 3)
        {
            type: "photos",
            chapter: "Chương V",
            title: "Mỹ Nữ",
            subtitle: "Lưu giữ những điều tuyệt vời nhất",
            decor: "🌸",
            photos: [
                {
                    image: "assets/images/photo-6.jpg",
                    caption: "Chói quá 🌸"
                },
                {
                    image: "assets/images/photo-5.jpg",
                    caption: "Mong có cơ hội chụp lại ảnh này!"
                }
            ],
            quote: "“Chúc em tuổi mới luôn là đóa hoa xinh đẹp và hạnh phúc nhất.”"
        },

        // Trang 6: Trang chúc mừng sinh nhật bùng nổ (Final Celebration)
        {
            type: "final",
            badge: "Happy Birthday",
            title: "HAPPY BIRTHDAY!",
            recipientName: "{recipient} 🎂",
            wishText: "Chúc em có một tuổi mới thật nhiều niềm vui, nhiều may mắn và thật nhiều điều đẹp đẽ.",
            closing: "With love,",
            senderName: "{sender}",
            cakeIcon: "🎂",
            cakeHint: "Nhấn vào bánh kem để bắn thêm pháo hoa!",
            replayButtonText: "↻ Xem lại từ đầu"
        }
    ],

    // ----------------------------------------------------------------
    // 7. TRANG LỜI CHÚC KẾT & BÌA SAU (CLOSING & BACK COVER)
    // ----------------------------------------------------------------
    closing: {
        tag: "Lời Chúc Cuối",
        title: "Một Ngày Trọn Vẹn",
        divider: "✨ 💖 ✨",
        icon: "🎁",
        quote: "“Cảm ơn vì đã luôn là chính em — một đóa hoa dịu dàng và rực rỡ nhất.”",
        message: "Chúc em một tuổi mới bình an, tự tin và ngập tràn những phép màu tuyệt đẹp!",
        replayButtonText: "↻ Xem lại từ đầu"
    },

    backCover: {
        sealIcon: "💖",
        title: "Happy Birthday",
        subtitle: "Made with love for {recipient}",
        date: "16/09/2003"
    },

    // ----------------------------------------------------------------
    // 8. ĐIỀU HƯỚNG & NHÃN NÚT BẤM (NAVIGATION & BUTTONS)
    // ----------------------------------------------------------------
    navigation: {
        prevButtonText: "Trước",
        nextButtonText: "Tiếp",
        coverLabel: "Bìa sách 📖",
        backCoverLabel: "Bìa sau 💖",
        pagePattern: "Trang {page} / {total}",
        spreadPattern: "Trang {start} - {end} / {total}",
        celebrationPattern: "Trang {total} / {total} • Kết thúc 🎂"
    },

    // ----------------------------------------------------------------
    // 9. ÂM NHẠC NỀN (BACKGROUND MUSIC)
    // ----------------------------------------------------------------
    music: {
        enabled: true,
        // File nhạc MP3 đặt trong thư mục assets/audio/
        // Nếu không tìm thấy file hoặc chưa tải được, hệ thống tự động phát
        // giai điệu hộp nhạc (Music Box) "Happy Birthday" bằng Web Audio API.
        src: "assets/audio/Happy Birthday (Piano Version).mp3",
        autoplay: false
    },

    // ----------------------------------------------------------------
    // 10. MÀU SẮC & GIAO DIỆN (THEME)
    // ----------------------------------------------------------------
    theme: {
        primaryColor: "#c86d51",
        secondaryColor: "#e5b382",
        accentGold: "#d4af37",
        coverBackground: "linear-gradient(145deg, #7c1d2e 0%, #460f1b 100%)",
        pageBackground: "#fffdf9",
        textColor: "#332219"
    }
};

// Đảm bảo có thể truy cập được từ global scope (window) hoặc module
if (typeof window !== "undefined") {
    window.birthdayConfig = birthdayConfig;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = birthdayConfig;
}
