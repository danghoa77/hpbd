/**
 * ====================================================================
 * BIRTHDAY CARD CONFIGURATION
 * ====================================================================
 * Bạn có thể tự do chỉnh sửa nội dung, mật khẩu, hình ảnh và âm nhạc
 * tại file này mà không cần can thiệp vào logic xử lý của ứng dụng.
 */

const birthdayConfig = {
    // ----------------------------------------------------------------
    // 1. MẬT KHẨU MỞ THIỆP
    // ----------------------------------------------------------------
    // Mật khẩu để mở sách. Nhập đúng mật khẩu này để mở thiệp.
    password: "birthday123",

    // Lưu trạng thái đã mở trong phiên duyệt web (session).
    // Nếu true: Sau khi nhập đúng 1 lần, F5 reload trang sẽ không phải nhập lại mật khẩu.
    // Nếu false: Luôn yêu cầu nhập mật khẩu mỗi lần load trang.
    rememberUnlock: true,

    // ----------------------------------------------------------------
    // 2. THÔNG TIN NGƯỜI NHẬN & NGƯỜI GỬI
    // ----------------------------------------------------------------
    recipient: {
        name: "Người đặc biệt",
        nickname: "Bé Yêu"
    },

    sender: {
        name: "Someone who cares"
    },

    birthday: {
        title: "Happy Birthday!",
        subtitle: "Chúc mừng sinh nhật",
        date: "15/09/2026"
    },

    // ----------------------------------------------------------------
    // 3. MÀN HÌNH KHÓA (PASSWORD SCREEN)
    // ----------------------------------------------------------------
    lockScreen: {
        badge: "Special Birthday Surprise",
        title: "A little surprise for you",
        subtitle: "Nhập mật khẩu để mở món quà sinh nhật đặc biệt này nhé!",
        inputPlaceholder: "Nhập mật khẩu bí mật...",
        buttonText: "Mở quà 🎁",
        hintText: "Gợi ý: Mật khẩu mặc định là 'birthday123'",
        errorMessage: "Hmm... mật khẩu chưa đúng 💭 Thử lại nhé!"
    },

    // ----------------------------------------------------------------
    // 4. BÌA SÁCH (BOOK COVER)
    // ----------------------------------------------------------------
    cover: {
        badge: "Đặc biệt dành riêng cho bạn",
        title: "Happy Birthday",
        subtitle: "A little book made just for you",
        instruction: "Nhấn nút 'Mở sách' hoặc lật góc để bắt đầu 📖",
        openButtonText: "Mở sách ✨"
    },

    // ----------------------------------------------------------------
    // 5. NỘI DUNG CÁC TRANG SÁCH (PAGES)
    // ----------------------------------------------------------------
    pages: [
        // Trang 1: Lời mở đầu
        {
            type: "opening",
            pageNumber: 1,
            title: "Hôm Nay Là Một Ngày Đặc Biệt",
            subtitle: "Chào tuổi mới rạng rỡ",
            content: "Có một ngày trong năm mà cả vũ trụ dường như trở nên ấm áp và lấp lánh hơn, bởi đó chính là ngày bạn xuất hiện trên thế giới này. Cảm ơn sự hiện diện dịu dàng của bạn đã mang đến biết bao niềm vui và những khoảnh khắc tuyệt vời cho những người xung quanh.",
            quote: "“Mong rằng mỗi ngày thức dậy, bạn đều tìm thấy một lý do thật ngọt ngào để mỉm cười.”",
            decor: "🌸"
        },

        // Trang 2: Kỷ niệm đáng nhớ (Ảnh đơn lớn)
        {
            type: "memory",
            pageNumber: 2,
            title: "Những Khoảnh Khắc Đẹp",
            subtitle: "Lưu giữ kỷ niệm",
            image: "assets/images/photo-1.jpg",
            caption: "Một kỷ niệm thật đẹp trên chặng đường chúng ta cùng đi qua. Mỗi bức ảnh là một thước phim vô giá.",
            date: "Kỷ niệm đáng nhớ",
            decor: "📷"
        },

        // Trang 3: Bộ sưu tập ảnh (Gallery / Polaroid Scrapbook)
        {
            type: "gallery",
            pageNumber: 3,
            title: "Góc Kỷ Niệm Yêu Thương",
            subtitle: "Những nụ cười đong đầy niềm vui",
            photos: [
                {
                    image: "assets/images/photo-2.jpg",
                    caption: "Nụ cười tỏa nắng ✨"
                },
                {
                    image: "assets/images/photo-3.jpg",
                    caption: "Bình yên dịu dàng 🌷"
                },
                {
                    image: "assets/images/photo-4.jpg",
                    caption: "Khoảnh khắc đáng yêu 💖"
                }
            ]
        },

        // Trang 4: Những lời chúc ý nghĩa (Wishes Cards)
        {
            type: "wishes",
            pageNumber: 4,
            title: "Những Điều Ước Cho Tuổi Mới",
            subtitle: "Gửi trọn những yêu thương chân thành nhất",
            cards: [
                {
                    icon: "✨",
                    title: "Bình An & Rạng Rỡ",
                    text: "Mong bạn luôn giữ được sự an nhiên trong tâm hồn và nụ cười tươi tắn như ánh mai sớm."
                },
                {
                    icon: "🌷",
                    title: "Vạn Sự Như Ý",
                    text: "Mong mọi ước mơ, dự định bạn ấp ủ sẽ đều đơm hoa kết trái thật ngọt ngào và rực rỡ."
                },
                {
                    icon: "🎂",
                    title: "Ngập Tràn Niềm Vui",
                    text: "Chúc bạn một tuổi mới nhiều sức khỏe, luôn may mắn và gặp gỡ những điều tuyệt vời."
                },
                {
                    icon: "💖",
                    title: "Mãi Được Yêu Thương",
                    text: "Hy vọng mỗi ngày trôi qua, bạn luôn được chở che, thấu hiểu và yêu thương trọn vẹn."
                }
            ]
        },

        // Trang 5: Lá thư tay tâm tình (Personal Handwritten Letter)
        {
            type: "letter",
            pageNumber: 5,
            title: "Lá Thư Gửi Bạn",
            date: "15 Tháng 09",
            greeting: "Gửi người tôi luôn trân quý,",
            content: "Cảm ơn bạn vì đã luôn là một người bạn, một người đồng hành thật tuyệt vời. Có những ngày mỏi mệt, chỉ cần một nụ cười hay câu chuyện vui từ bạn cũng đủ khiến mọi thứ trở nên nhẹ nhàng hơn rất nhiều. Tuổi mới hãy luôn tự tin bước tiếp trên con đường bạn đã chọn nhé, vì bạn xứng đáng với tất cả những điều tốt đẹp nhất trên đời!",
            signature: "From someone who cares with all my heart"
        },

        // Trang 6: Trang kết đặc biệt (Final Celebration & Confetti)
        {
            type: "final",
            pageNumber: 6,
            badge: "Happy Birthday",
            title: "HAPPY BIRTHDAY!",
            recipientName: "Người đặc biệt 🎂",
            wishText: "Chúc bạn có một tuổi mới thật nhiều niềm vui, nhiều may mắn và thật nhiều điều đẹp đẽ.",
            closing: "With love,",
            senderName: "Someone who cares",
            replayText: "↻ Xem lại từ đầu"
        }
    ],

    // ----------------------------------------------------------------
    // 6. ÂM NHẠC NỀN (BACKGROUND MUSIC)
    // ----------------------------------------------------------------
    music: {
        enabled: true,
        // File nhạc MP3 đặt trong assets/audio/
        // Nếu không có file nhạc hoặc file chưa tải được, hệ thống sẽ tự động chuyển
        // sang giai điệu chúc mừng sinh nhật nhẹ nhàng bằng Web Audio API synthesizer.
        src: "assets/audio/birthday.mp3",
        autoplay: false // Trình duyệt chặn autoplay âm thanh trước khi tương tác
    },

    // ----------------------------------------------------------------
    // 7. GIAO DIỆN & MÀU SẮC (THEME)
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

// Đảm bảo có thể truy cập được từ global scope
if (typeof window !== "undefined") {
    window.birthdayConfig = birthdayConfig;
}
