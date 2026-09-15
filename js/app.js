/**
 * ==========================================================================
 * INTERACTIVE BIRTHDAY BOOK — CORE APPLICATION
 * ==========================================================================
 * Quản lý toàn bộ logic tương tác:
 * - Màn hình khóa và xác thực password (frontend UX)
 * - Hiệu ứng mở sách 3D và lật trang (Spread trên desktop, Single page trên mobile)
 * - Tương tác cử chỉ Touch Swipe, Phím mũi tên, Click trang
 * - Phát nhạc nền (HTML5 Audio + Web Audio API Music Box synthesizer dự phòng)
 * - Hiệu ứng Confetti và Floating Hearts khi đến trang kết
 * - Hiệu ứng Ambient Canvas Particles
 * ==========================================================================
 */

(function () {
    "use strict";

    // ----------------------------------------------------------------------
    // GLOBAL APP STATE
    // ----------------------------------------------------------------------
    const state = {
        isUnlocked: false,
        currentPage: 0,        // Trang hiện tại (0: Bìa sách, 1..N: Các trang con, N+1: Bìa sau)
        totalSpreads: 5,       // Tổng số lượt lật trên desktop
        totalMobilePages: 7,   // Tổng số trang trên mobile (Bìa + 6 trang nội dung)
        isMobile: false,
        isFlipping: false,
        isPlayingMusic: false,
        musicSynthActive: false,
        audioContext: null,
        synthInterval: null,
        touchStartX: 0,
        touchStartY: 0
    };

    // Safe access to configuration
    const config = window.birthdayConfig || {
        password: "birthday123",
        rememberUnlock: true,
        recipient: { name: "Người đặc biệt" },
        sender: { name: "Someone who cares" },
        pages: []
    };

    // ----------------------------------------------------------------------
    // DOM ELEMENTS CACHE
    // ----------------------------------------------------------------------
    const DOM = {
        // App Containers
        lockScreen: document.getElementById("lock-screen"),
        bookScreen: document.getElementById("book-screen"),
        bookViewport: document.getElementById("book-viewport"),
        bookWrapper: document.getElementById("book-wrapper"),
        bookSheetsContainer: document.getElementById("book-sheets"),

        // Lock Screen Elements
        lockForm: document.getElementById("lock-form"),
        passwordInput: document.getElementById("password-input"),
        togglePwBtn: document.getElementById("toggle-pw-visibility"),
        lockErrorMsg: document.getElementById("lock-error-msg"),
        errorText: document.getElementById("error-text"),
        unlockBtn: document.getElementById("unlock-btn"),
        unlockBtnText: document.getElementById("unlock-btn-text"),
        lockTitle: document.getElementById("lock-title"),
        lockSubtitle: document.getElementById("lock-subtitle"),
        lockBadgeText: document.getElementById("lock-badge-text"),
        lockHint: document.getElementById("lock-hint"),

        // Navigation Controls
        prevBtn: document.getElementById("prev-btn"),
        nextBtn: document.getElementById("next-btn"),
        pageIndicator: document.getElementById("page-indicator"),
        indicatorDots: document.getElementById("indicator-dots"),
        edgePrevBtn: document.getElementById("edge-prev-btn"),
        edgeNextBtn: document.getElementById("edge-next-btn"),

        // Top Actions
        musicToggleBtn: document.getElementById("music-toggle-btn"),
        musicIcon: document.getElementById("music-icon"),
        lockToggleBtn: document.getElementById("lock-toggle-btn"),
        topTitle: document.getElementById("top-title"),

        // Celebration & Audio
        bgAudio: document.getElementById("bg-audio"),
        celebrationParticles: document.getElementById("celebration-particles"),
        particlesCanvas: document.getElementById("particles-canvas")
    };

    // ----------------------------------------------------------------------
    // 1. INITIALIZATION ENTRY POINT
    // ----------------------------------------------------------------------
    function initializeApp() {
        checkViewportMode();
        window.addEventListener("resize", handleWindowResize);

        // Áp dụng nội dung từ config vào giao diện
        applyConfigToUI();

        // Khởi tạo các module con
        initializeBackgroundParticles();
        initializePasswordScreen();
        initializeBook();
        initializeMusic();
        initializeKeyboardAndTouch();

        // Kiểm tra session đã mở trước đó chưa
        if (config.rememberUnlock && sessionStorage.getItem("birthdayUnlocked") === "true") {
            bypassPasswordScreen();
        }
    }

    function checkViewportMode() {
        state.isMobile = window.innerWidth < 768;
    }

    function handleWindowResize() {
        const wasMobile = state.isMobile;
        checkViewportMode();
        if (wasMobile !== state.isMobile) {
            updateBookSpreadDisplay();
        }
    }

    function applyConfigToUI() {
        if (config.lockScreen) {
            if (config.lockScreen.title) DOM.lockTitle.textContent = config.lockScreen.title;
            if (config.lockScreen.subtitle) DOM.lockSubtitle.textContent = config.lockScreen.subtitle;
            if (config.lockScreen.badge) DOM.lockBadgeText.textContent = config.lockScreen.badge;
            if (config.lockScreen.buttonText) DOM.unlockBtnText.textContent = config.lockScreen.buttonText;
            if (config.lockScreen.inputPlaceholder) DOM.passwordInput.placeholder = config.lockScreen.inputPlaceholder;
        }

        if (config.recipient && config.recipient.name) {
            DOM.topTitle.textContent = `Happy Birthday • ${config.recipient.name}`;
            document.title = `Happy Birthday, ${config.recipient.name}! 🎂`;
        }
    }

    // ----------------------------------------------------------------------
    // 2. PASSWORD SCREEN MODULE
    // ----------------------------------------------------------------------
    function initializePasswordScreen() {
        if (!DOM.lockForm) return;

        // Form submit
        DOM.lockForm.addEventListener("submit", function (e) {
            e.preventDefault();
            handlePasswordSubmit();
        });

        // Toggle ẩn/hiện mật khẩu
        if (DOM.togglePwBtn) {
            DOM.togglePwBtn.addEventListener("click", function () {
                const isPassword = DOM.passwordInput.type === "password";
                DOM.passwordInput.type = isPassword ? "text" : "password";
                DOM.togglePwBtn.textContent = isPassword ? "🙈" : "👁️";
            });
        }

        // Lock button ở thanh điều khiển trên cùng (để người dùng có thể khóa lại test)
        if (DOM.lockToggleBtn) {
            DOM.lockToggleBtn.addEventListener("click", function () {
                sessionStorage.removeItem("birthdayUnlocked");
                lockBook();
            });
        }
    }

    function handlePasswordSubmit() {
        const enteredPassword = DOM.passwordInput.value.trim();
        const expectedPassword = (config.password || "birthday123").trim();

        if (enteredPassword === expectedPassword) {
            // Mật khẩu đúng
            handlePasswordSuccess();
        } else {
            // Mật khẩu sai
            handlePasswordError();
        }
    }

    function handlePasswordSuccess() {
        DOM.lockErrorMsg.classList.remove("visible");

        if (config.rememberUnlock) {
            sessionStorage.setItem("birthdayUnlocked", "true");
        }

        state.isUnlocked = true;

        // Bắt đầu nhạc nếu được cấu hình
        startMusicOnUserGesture();

        // Animation chuyển tiếp từ Lock Card sang Book
        DOM.lockScreen.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        DOM.lockScreen.style.opacity = "0";
        DOM.lockScreen.style.transform = "translateY(-20px) scale(0.96)";

        setTimeout(() => {
            DOM.lockScreen.style.display = "none";
            DOM.bookScreen.classList.remove("hidden");
            openBookAnimation();
        }, 600);
    }

    function handlePasswordError() {
        const errorMsg = (config.lockScreen && config.lockScreen.errorMessage) 
            ? config.lockScreen.errorMessage 
            : "Hmm... mật khẩu chưa đúng 💭 Thử lại nhé!";

        DOM.errorText.textContent = errorMsg;
        DOM.lockErrorMsg.classList.add("visible");

        // Rung nhẹ thẻ
        const card = DOM.lockScreen.querySelector(".lock-card");
        if (card) {
            card.classList.remove("shake-card");
            // Trigger reflow
            void card.offsetWidth;
            card.classList.add("shake-card");
            setTimeout(() => card.classList.remove("shake-card"), 600);
        }

        DOM.passwordInput.focus();
        DOM.passwordInput.select();
    }

    function bypassPasswordScreen() {
        state.isUnlocked = true;
        DOM.lockScreen.style.display = "none";
        DOM.bookScreen.classList.remove("hidden");
        // Mở sách trực tiếp đến trang đầu tiên
        turnToSpread(1, false);
    }

    function lockBook() {
        state.isUnlocked = false;
        DOM.passwordInput.value = "";
        DOM.lockErrorMsg.classList.remove("visible");
        DOM.bookScreen.classList.add("hidden");
        DOM.lockScreen.style.display = "flex";
        DOM.lockScreen.style.opacity = "1";
        DOM.lockScreen.style.transform = "translateY(0) scale(1)";
        state.currentPage = 0;
        updateBookSpreadDisplay();
    }

    // ----------------------------------------------------------------------
    // 3. BOOK OPENING & PAGE TURNING MECHANICS
    // ----------------------------------------------------------------------
    function initializeBook() {
        renderBookSheets();
        renderIndicatorDots();
        turnToSpread(0, false);
        updateBookSpreadDisplay();

        // Nút Trước / Tiếp
        if (DOM.prevBtn) DOM.prevBtn.addEventListener("click", previousPage);
        if (DOM.nextBtn) DOM.nextBtn.addEventListener("click", nextPage);

        // Vùng bấm cạnh màn hình
        if (DOM.edgePrevBtn) DOM.edgePrevBtn.addEventListener("click", previousPage);
        if (DOM.edgeNextBtn) DOM.edgeNextBtn.addEventListener("click", nextPage);
    }

    /**
     * Tạo các trang sách 3D từ cấu hình
     */
    function renderBookSheets() {
        const pages = config.pages || [];
        const recipientName = (config.recipient && config.recipient.name) || "Người đặc biệt";
        const senderName = (config.sender && config.sender.name) || "Someone who cares";

        DOM.bookSheetsContainer.innerHTML = `
            <!-- SHEET 0: FRONT COVER & INSIDE COVER -->
            <div class="book-sheet" data-sheet-index="0" id="sheet-0">
                <!-- Front: Bìa sách ngoài -->
                <div class="sheet-face sheet-front sheet-cover-front">
                    <div class="cover-emboss-frame"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <span class="corner-ornament corner-br"></span>
                    
                    <div class="cover-content">
                        <div class="cover-seal" aria-hidden="true">🎂</div>
                        <span class="cover-badge">${escapeHTML(config.cover?.badge || "Special Edition")}</span>
                        <h2 class="cover-main-title">${escapeHTML(config.cover?.title || "Happy Birthday")}</h2>
                        <div class="cover-recipient">${escapeHTML(recipientName)}</div>
                        <div class="cover-divider">
                            <span></span>
                            <i>✨</i>
                            <span></span>
                        </div>
                        <p class="cover-subtitle">${escapeHTML(config.cover?.subtitle || "A little book made just for you")}</p>
                        <div class="cover-instruction">
                            <span>📖</span>
                            <span>${escapeHTML(config.cover?.instruction || "Nhấn để mở quà")}</span>
                        </div>
                    </div>
                </div>

                <!-- Back: Bìa trong (Inside Cover) -->
                <div class="sheet-face sheet-back">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header">
                            <span class="page-tag">Dành tặng bạn</span>
                            <h3 class="page-title">Một Món Quà Nhỏ</h3>
                            <div class="flourish-divider">✨ 🌸 ✨</div>
                        </div>
                        <div class="opening-body" style="text-align: center; justify-content: center;">
                            <p style="font-size: 1.05rem; line-height: 1.8;">
                                Quyển sách nhỏ này được tạo nên từ những tình cảm chân thành nhất,
                                lưu giữ những lời chúc và kỷ niệm đẹp đẽ nhân ngày sinh nhật của bạn.
                            </p>
                            <div class="opening-quote" style="border-left: none; border-top: 2px solid var(--color-accent-gold); border-bottom: 2px solid var(--color-accent-gold); border-radius: 0; padding: 1rem;">
                                “Chúc cho hành trình tuổi mới của ${escapeHTML(recipientName)} luôn tràn ngập nụ cười và ánh nắng rực rỡ.”
                            </div>
                            <p style="font-size: 0.88rem; color: var(--text-muted);">
                                Hãy lật sang trang tiếp theo để cùng khám phá nhé! 👉
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SHEET 1: PAGE 1 (OPENING) & PAGE 2 (MEMORY PHOTO) -->
            <div class="book-sheet" data-sheet-index="1" id="sheet-1">
                <!-- Front: Trang 1 (Opening) -->
                <div class="sheet-face sheet-front">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-br"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header">
                            <span class="page-tag">Chương I</span>
                            <h3 class="page-title">${escapeHTML(pages[0]?.title || "Ngày Thật Đặc Biệt")}</h3>
                            <p class="page-subtitle">${escapeHTML(pages[0]?.subtitle || "Gửi lời chào tuổi mới")}</p>
                            <div class="flourish-divider">🌸</div>
                        </div>
                        <div class="opening-body">
                            <p class="opening-dropcap">
                                ${escapeHTML(pages[0]?.content || "Hôm nay là một ngày thật đặc biệt, ngày vũ trụ mang đến một món quà tuyệt vời.")}
                            </p>
                            <div class="opening-quote">
                                ${escapeHTML(pages[0]?.quote || "“Mong bạn luôn mỉm cười và hạnh phúc.”")}
                            </div>
                        </div>
                    </div>
                    <span class="page-num">1</span>
                </div>

                <!-- Back: Trang 2 (Memory Photo) -->
                <div class="sheet-face sheet-back">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header">
                            <span class="page-tag">Chương II</span>
                            <h3 class="page-title">${escapeHTML(pages[1]?.title || "Những Khoảnh Khắc Đẹp")}</h3>
                            <p class="page-subtitle">${escapeHTML(pages[1]?.subtitle || "Lưu giữ kỷ niệm")}</p>
                            <div class="flourish-divider">📷</div>
                        </div>
                        <div class="memory-body">
                            <div class="memory-frame">
                                ${renderSafeImage(pages[1]?.image || "assets/images/photo-1.jpg", "Kỷ niệm đẹp", "memory-photo", "Khoảnh khắc đáng nhớ")}
                            </div>
                            <span class="memory-date-tag">✨ ${escapeHTML(pages[1]?.date || "Kỷ niệm tuổi mới")}</span>
                            <p class="memory-caption">${escapeHTML(pages[1]?.caption || "Một kỷ niệm thật đẹp và đáng nhớ trên từng chặng đường.")}</p>
                        </div>
                    </div>
                    <span class="page-num">2</span>
                </div>
            </div>

            <!-- SHEET 2: PAGE 3 (GALLERY SCRAPBOOK) & PAGE 4 (WISHES CARDS) -->
            <div class="book-sheet" data-sheet-index="2" id="sheet-2">
                <!-- Front: Trang 3 (Gallery Scrapbook) -->
                <div class="sheet-face sheet-front">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-br"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header" style="margin-bottom: 0.75rem;">
                            <span class="page-tag">Chương III</span>
                            <h3 class="page-title">${escapeHTML(pages[2]?.title || "Góc Kỷ Niệm Yêu Thương")}</h3>
                            <p class="page-subtitle">${escapeHTML(pages[2]?.subtitle || "Từng nụ cười đong đầy")}</p>
                        </div>
                        <div class="gallery-scrapbook">
                            ${renderGalleryPhotos(pages[2]?.photos)}
                        </div>
                    </div>
                    <span class="page-num">3</span>
                </div>

                <!-- Back: Trang 4 (Wishes Cards) -->
                <div class="sheet-face sheet-back">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header" style="margin-bottom: 0.75rem;">
                            <span class="page-tag">Chương IV</span>
                            <h3 class="page-title">${escapeHTML(pages[3]?.title || "Những Điều Ước")}</h3>
                            <p class="page-subtitle">${escapeHTML(pages[3]?.subtitle || "Gửi trọn những yêu thương")}</p>
                        </div>
                        <div class="wishes-grid">
                            ${renderWishCards(pages[3]?.cards)}
                        </div>
                    </div>
                    <span class="page-num">4</span>
                </div>
            </div>

            <!-- SHEET 3: PAGE 5 (HANDWRITTEN LETTER) & PAGE 6 (FINAL CELEBRATION) -->
            <div class="book-sheet" data-sheet-index="3" id="sheet-3">
                <!-- Front: Trang 5 (Handwritten Letter) -->
                <div class="sheet-face sheet-front">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-br"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header" style="margin-bottom: 0.6rem;">
                            <span class="page-tag">Chương V</span>
                            <h3 class="page-title">${escapeHTML(pages[4]?.title || "Lá Thư Gửi Bạn")}</h3>
                            <div class="flourish-divider">💌</div>
                        </div>
                        <div class="letter-body">
                            <div class="letter-greeting">${escapeHTML(pages[4]?.greeting || `Gửi ${recipientName},`)}</div>
                            <p class="letter-text">${escapeHTML(pages[4]?.content || "Cảm ơn bạn vì đã luôn là một người bạn tuyệt vời. Chúc bạn tuổi mới luôn rực rỡ và hạnh phúc!")}</p>
                            <div class="letter-footer">
                                <div class="letter-wax-seal" aria-hidden="true">🎂</div>
                                <div class="letter-signature">${escapeHTML(pages[4]?.signature || `From ${senderName}`)}</div>
                            </div>
                        </div>
                    </div>
                    <span class="page-num">5</span>
                </div>

                <!-- Back: Trang 6 (Final Celebration Page) -->
                <div class="sheet-face sheet-back">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <div class="page-content-wrapper">
                        <div class="final-celebration-body">
                            <div class="cake-container" id="final-cake-icon" title="Nhấn để bắn thêm pháo hoa!">🎂</div>
                            <span class="final-badge">Special Celebration</span>
                            <h3 class="final-title">${escapeHTML(pages[5]?.title || "HAPPY BIRTHDAY!")}</h3>
                            <div class="final-recipient">${escapeHTML(recipientName)} 🎉</div>
                            <p class="final-wishes">${escapeHTML(pages[5]?.wishText || "Chúc bạn có một tuổi mới thật nhiều niềm vui, nhiều may mắn và ngập tràn điều tốt đẹp!")}</p>
                            <span class="final-closing">${escapeHTML(pages[5]?.closing || "With love,")}</span>
                            <span class="final-sender">${escapeHTML(senderName)}</span>
                            
                            <button type="button" class="btn replay-btn" id="final-replay-btn">
                                <span>↻ Xem lại từ đầu</span>
                            </button>
                        </div>
                    </div>
                    <span class="page-num">6</span>
                </div>
            </div>

            <!-- SHEET 4: CLOSING SPREAD & BACK COVER -->
            <div class="book-sheet" data-sheet-index="4" id="sheet-4">
                <!-- Front: Trang kết thúc bên trong -->
                <div class="sheet-face sheet-front">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-br"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header">
                            <span class="page-tag">Lời Chúc Cuối</span>
                            <h3 class="page-title">Một Ngày Trọn Vẹn</h3>
                            <div class="flourish-divider">✨ 💖 ✨</div>
                        </div>
                        <div class="opening-body" style="text-align: center; justify-content: center; gap: 1.25rem;">
                            <div style="font-size: 3.2rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15));" aria-hidden="true">🎁</div>
                            <div class="opening-quote" style="border-left: none; border-top: 2px solid var(--color-accent-gold); border-bottom: 2px solid var(--color-accent-gold); border-radius: 0; padding: 1.1rem; background: rgba(229, 179, 130, 0.12);">
                                “Cảm ơn vì đã luôn là chính bạn — một đóa hoa dịu dàng và rực rỡ nhất.”
                            </div>
                            <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">
                                Chúc bạn một tuổi mới bình an, tự tin và ngập tràn những phép màu tuyệt đẹp!
                            </p>
                            <button type="button" class="btn replay-btn" id="closing-replay-btn" style="align-self: center; margin-top: 0.5rem;">
                                <span>↻ Xem lại từ đầu</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Back: Bìa sau (Hard Back Cover) -->
                <div class="sheet-face sheet-back sheet-cover-back">
                    <div class="cover-emboss-frame"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <div class="cover-content">
                        <div class="cover-seal" aria-hidden="true">💖</div>
                        <h3 style="font-family: var(--font-heading); font-size: 1.8rem; color: #fff;">Happy Birthday</h3>
                        <p style="font-family: var(--font-handwriting); font-size: 1.6rem; color: var(--color-secondary);">
                            Made with love for ${escapeHTML(recipientName)}
                        </p>
                        <div class="cover-divider">
                            <span></span>
                            <i>✨</i>
                            <span></span>
                        </div>
                        <small style="color: rgba(255, 255, 255, 0.6);">${config.birthday?.date || "15/09/2026"}</small>
                    </div>
                </div>
            </div>
        `;

        // Gắn sự kiện click vào các sheet để lật trang
        const allSheets = DOM.bookSheetsContainer.querySelectorAll(".book-sheet");
        allSheets.forEach((sheet, index) => {
            sheet.addEventListener("click", function (e) {
                // Tránh trigger khi nhấn nút con bên trong
                if (e.target.closest("button") || e.target.closest("a")) return;

                if (state.isMobile) {
                    nextPage();
                } else {
                    // Nếu sheet này đã lật rồi (đang ở bên trái), click vào nó sẽ lật ngược lại (Previous)
                    if (sheet.classList.contains("flipped")) {
                        previousPage();
                    } else {
                        nextPage();
                    }
                }
            });
        });

        // Gắn sự kiện cho các nút "Xem lại từ đầu"
        const replayBtn1 = document.getElementById("final-replay-btn");
        const replayBtn2 = document.getElementById("closing-replay-btn");
        const cakeIcon = document.getElementById("final-cake-icon");

        if (replayBtn1) replayBtn1.addEventListener("click", resetBookToCover);
        if (replayBtn2) replayBtn2.addEventListener("click", resetBookToCover);
        if (cakeIcon) {
            cakeIcon.addEventListener("click", () => {
                triggerConfettiExplosion();
                triggerFloatingHearts();
            });
        }
    }

    /**
     * Helper render ảnh với fallback tự động nếu ảnh lỗi/thiếu
     */
    function renderSafeImage(imageSrc, altText, cssClass, fallbackCaption) {
        return `
            <img 
                src="${escapeHTML(imageSrc)}" 
                alt="${escapeHTML(altText)}" 
                class="${escapeHTML(cssClass)}"
                loading="lazy"
                onerror="this.onerror=null; this.parentElement.innerHTML = '<div class=\\'img-fallback\\'><span class=\\'img-fallback-icon\\'>📷</span><span class=\\'img-fallback-text\\'>${escapeHTML(fallbackCaption)}</span></div>';"
            >
        `;
    }

    /**
     * Render các ảnh polaroid trang 3
     */
    function renderGalleryPhotos(photos) {
        const defaultPhotos = [
            { image: "assets/images/photo-2.jpg", caption: "Nụ cười tỏa nắng ✨" },
            { image: "assets/images/photo-3.jpg", caption: "Bình yên dịu dàng 🌷" },
            { image: "assets/images/photo-4.jpg", caption: "Khoảnh khắc đáng yêu 💖" }
        ];

        const list = (photos && photos.length) ? photos : defaultPhotos;
        return list.slice(0, 3).map((item, idx) => `
            <div class="polaroid-card" data-polaroid-idx="${idx}">
                <div class="polaroid-tape" aria-hidden="true"></div>
                <div class="polaroid-img-box">
                    ${renderSafeImage(item.image, item.caption, "polaroid-img", item.caption)}
                </div>
                <div class="polaroid-caption">${escapeHTML(item.caption)}</div>
            </div>
        `).join("");
    }

    /**
     * Render các thẻ lời chúc trang 4
     */
    function renderWishCards(cards) {
        const defaultCards = [
            { icon: "✨", title: "Bình An & Rạng Rỡ", text: "Mong bạn luôn giữ được sự an nhiên và nụ cười rạng rỡ như ánh mai sớm." },
            { icon: "🌷", title: "Vạn Sự Như Ý", text: "Mong mọi ước mơ bạn ấp ủ sẽ đều đơm hoa kết trái thật ngọt ngào." },
            { icon: "🎂", title: "Ngập Tràn Niềm Vui", text: "Chúc bạn một tuổi mới nhiều sức khỏe, may mắn và hạnh phúc ngập tràn." },
            { icon: "💖", title: "Mãi Được Yêu Thương", text: "Hy vọng mỗi ngày trôi qua, bạn luôn được yêu thương và chở che trọn vẹn." }
        ];

        const list = (cards && cards.length) ? cards : defaultCards;
        return list.slice(0, 4).map(card => `
            <div class="wish-card">
                <div class="wish-header">
                    <span class="wish-icon" aria-hidden="true">${escapeHTML(card.icon || "✨")}</span>
                    <h4 class="wish-title">${escapeHTML(card.title)}</h4>
                </div>
                <p class="wish-text">${escapeHTML(card.text)}</p>
            </div>
        `).join("");
    }

    /**
     * Animation mở sách ban đầu từ trạng thái đóng
     */
    function openBookAnimation() {
        DOM.bookWrapper.classList.add("book-entering");
        state.currentPage = 0;
        updateBookSpreadDisplay();

        // Sau khi book xuất hiện cân đối ở giữa, tự động mở bìa sách để vào trang 1
        setTimeout(() => {
            DOM.bookWrapper.classList.remove("book-entering");
            turnToSpread(1, true);
        }, 900);
    }

    /**
     * Chuyển đến trang tiếp theo
     */
    function nextPage() {
        if (state.isFlipping) return;
        const maxPages = state.isMobile ? state.totalMobilePages : state.totalSpreads;
        if (state.currentPage < maxPages) {
            turnToSpread(state.currentPage + 1, true);
        }
    }

    /**
     * Chuyển về trang trước đó
     */
    function previousPage() {
        if (state.isFlipping) return;
        if (state.currentPage > 0) {
            turnToSpread(state.currentPage - 1, true);
        }
    }

    /**
     * Logic lật trang sang index cụ thể
     */
    function turnToSpread(targetPage, animate = true) {
        if (state.isFlipping && animate) return;
        state.isFlipping = true;

        const prevPage = state.currentPage;
        state.currentPage = targetPage;

        const allSheets = DOM.bookSheetsContainer.querySelectorAll(".book-sheet");
        const totalSheets = allSheets.length;

        if (state.isMobile) {
            // ==========================================
            // CHẾ ĐỘ MOBILE (SINGLE PAGE VIEW)
            // ==========================================
            // Trên mobile, hiển thị 1 trang/mặt tại một thời điểm
            allSheets.forEach((sheet, idx) => {
                const sheetIndex = parseInt(sheet.dataset.sheetIndex, 10);
                // Tìm sheet chứa trang này
                // Sheet 0: Trang 0 (Cover) & Inside Cover
                // Sheet 1: Trang 1 & Trang 2
                // Sheet 2: Trang 3 & Trang 4
                // Sheet 3: Trang 5 & Trang 6
                // Sheet 4: Closing & Back Cover
                if (targetPage === 0) {
                    // Bìa ngoài
                    sheet.classList.remove("flipped");
                    sheet.style.display = (sheetIndex === 0) ? "block" : "none";
                    sheet.style.zIndex = totalSheets - sheetIndex;
                } else if (targetPage === 1) {
                    sheet.classList.remove("flipped");
                    sheet.style.display = (sheetIndex === 1) ? "block" : "none";
                    sheet.style.zIndex = 10;
                } else if (targetPage === 2) {
                    sheet.classList.add("flipped");
                    sheet.style.display = (sheetIndex === 1) ? "block" : "none";
                    sheet.style.zIndex = 10;
                } else if (targetPage === 3) {
                    sheet.classList.remove("flipped");
                    sheet.style.display = (sheetIndex === 2) ? "block" : "none";
                    sheet.style.zIndex = 10;
                } else if (targetPage === 4) {
                    sheet.classList.add("flipped");
                    sheet.style.display = (sheetIndex === 2) ? "block" : "none";
                    sheet.style.zIndex = 10;
                } else if (targetPage === 5) {
                    sheet.classList.remove("flipped");
                    sheet.style.display = (sheetIndex === 3) ? "block" : "none";
                    sheet.style.zIndex = 10;
                } else if (targetPage >= 6) {
                    sheet.classList.add("flipped");
                    sheet.style.display = (sheetIndex === 3) ? "block" : "none";
                    sheet.style.zIndex = 10;
                }
            });
        } else {
            // ==========================================
            // CHẾ ĐỘ DESKTOP / TABLET (2-PAGE SPREAD)
            // ==========================================
            allSheets.forEach((sheet) => {
                const sheetIndex = parseInt(sheet.dataset.sheetIndex, 10);
                sheet.style.display = "block"; // Luôn hiển thị trên desktop

                if (sheetIndex < targetPage) {
                    // Sheet nằm bên trái (đã lật)
                    sheet.classList.add("flipped");
                    sheet.style.zIndex = sheetIndex + 1;
                    const leftDepth = sheetIndex * 2;
                    sheet.style.transform = `rotateY(-180deg) translateZ(${leftDepth}px)`;
                } else {
                    // Sheet nằm bên phải (chưa lật)
                    sheet.classList.remove("flipped");
                    sheet.style.zIndex = totalSheets - sheetIndex;
                    const rightDepth = (totalSheets - sheetIndex) * 2;
                    sheet.style.transform = `rotateY(0deg) translateZ(${rightDepth}px)`;
                }
            });

            // Khi đang lật, nâng độ sâu Z của sheet đang chuyển động để bay mượt phía trên
            const activeSheetIndex = (targetPage > prevPage) ? targetPage - 1 : targetPage;
            const activeSheet = document.getElementById(`sheet-${activeSheetIndex}`);
            if (activeSheet) {
                activeSheet.style.zIndex = totalSheets + 20;
            }
        }

        // Cập nhật text hiển thị số trang và trạng thái các nút
        updateBookSpreadDisplay();

        // Kiểm tra xem đã đến trang cuối (Final Celebration) chưa để kích hoạt Confetti
        const isFinalPage = (state.isMobile && state.currentPage >= 6) || (!state.isMobile && state.currentPage >= 4);
        if (isFinalPage) {
            triggerFinalCelebration();
        }

        setTimeout(() => {
            state.isFlipping = false;
        }, animate ? 850 : 50);
    }

    /**
     * Cập nhật chỉ số trang, indicator dots và trạng thái Next/Prev button
     */
    function updateBookSpreadDisplay() {
        const maxPages = state.isMobile ? state.totalMobilePages : state.totalSpreads;

        // Cập nhật vị trí cân đối của bìa sách trên Desktop
        if (DOM.bookWrapper) {
            if (!state.isMobile) {
                if (state.currentPage === 0) {
                    DOM.bookWrapper.classList.add("state-cover-closed");
                    DOM.bookWrapper.classList.remove("state-back-closed");
                } else if (state.currentPage >= state.totalSpreads) {
                    DOM.bookWrapper.classList.remove("state-cover-closed");
                    DOM.bookWrapper.classList.add("state-back-closed");
                } else {
                    DOM.bookWrapper.classList.remove("state-cover-closed", "state-back-closed");
                }
            } else {
                DOM.bookWrapper.classList.remove("state-cover-closed", "state-back-closed");
            }
        }

        // Cập nhật disabled button
        if (DOM.prevBtn) DOM.prevBtn.disabled = (state.currentPage <= 0);
        if (DOM.nextBtn) DOM.nextBtn.disabled = (state.currentPage >= maxPages);

        // Text hiển thị trang
        if (DOM.pageIndicator) {
            if (state.currentPage === 0) {
                DOM.pageIndicator.textContent = "Bìa sách 📖";
            } else if (state.isMobile) {
                DOM.pageIndicator.textContent = `Trang ${state.currentPage} / 6`;
            } else {
                if (state.currentPage === 1) {
                    DOM.pageIndicator.textContent = "Trang 1 / 6";
                } else if (state.currentPage === 2) {
                    DOM.pageIndicator.textContent = "Trang 2 - 3 / 6";
                } else if (state.currentPage === 3) {
                    DOM.pageIndicator.textContent = "Trang 4 - 5 / 6";
                } else if (state.currentPage >= 4) {
                    DOM.pageIndicator.textContent = "Trang 6 / 6 • Kết thúc 🎂";
                }
            }
        }

        // Cập nhật active indicator dot
        const dots = DOM.indicatorDots ? DOM.indicatorDots.querySelectorAll(".dot") : [];
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === state.currentPage);
        });
    }

    /**
     * Render các dấu chấm chỉ số trang ở thanh điều hướng
     */
    function renderIndicatorDots() {
        if (!DOM.indicatorDots) return;
        DOM.indicatorDots.innerHTML = "";
        const count = state.isMobile ? state.totalMobilePages + 1 : state.totalSpreads + 1;

        for (let i = 0; i < count; i++) {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = `dot ${i === state.currentPage ? "active" : ""}`;
            dot.setAttribute("aria-label", `Chuyển tới trang ${i}`);
            dot.addEventListener("click", () => turnToSpread(i, true));
            DOM.indicatorDots.appendChild(dot);
        }
    }

    /**
     * Reset sách về bìa hoặc trang mở đầu
     */
    function resetBookToCover() {
        turnToSpread(0, true);
    }

    // ----------------------------------------------------------------------
    // 4. CONFETTI & FINAL CELEBRATION
    // ----------------------------------------------------------------------
    let celebrationTriggered = false;

    function triggerFinalCelebration() {
        // Chỉ nổ pháo hoa lớn 1 lần mỗi khi chuyển vào trang cuối,
        // nhưng cho phép người dùng click bánh kem để bắn lại
        triggerConfettiExplosion();
        triggerFloatingHearts();
    }

    function triggerConfettiExplosion() {
        // Kiểm tra xem canvas-confetti CDN đã sẵn sàng chưa
        if (typeof window.confetti === "function") {
            try {
                // Vụ nổ trung tâm
                window.confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ["#d4af37", "#f3d078", "#c86d51", "#ff8da1", "#ffffff"]
                });

                // Pháo hoa từ góc trái
                setTimeout(() => {
                    window.confetti({
                        particleCount: 50,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0.1, y: 0.8 },
                        colors: ["#d4af37", "#c86d51", "#ffccd5"]
                    });
                }, 250);

                // Pháo hoa từ góc phải
                setTimeout(() => {
                    window.confetti({
                        particleCount: 50,
                        angle: 120,
                        spread: 55,
                        origin: { x: 0.9, y: 0.8 },
                        colors: ["#d4af37", "#e5b382", "#ff8da1"]
                    });
                }, 400);
            } catch (err) {
                runFallbackConfetti();
            }
        } else {
            runFallbackConfetti();
        }
    }

    /**
     * Bộ phát confetti dự phòng thuần Canvas nếu mạng chặn CDN
     */
    function runFallbackConfetti() {
        const container = DOM.celebrationParticles;
        if (!container) return;

        const colors = ["#d4af37", "#c86d51", "#ff8da1", "#ffd166", "#06d6a0"];
        for (let i = 0; i < 40; i++) {
            const confettiPiece = document.createElement("div");
            confettiPiece.style.position = "fixed";
            confettiPiece.style.width = `${Math.random() * 8 + 6}px`;
            confettiPiece.style.height = `${Math.random() * 14 + 8}px`;
            confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confettiPiece.style.left = `${Math.random() * 100}vw`;
            confettiPiece.style.top = "-20px";
            confettiPiece.style.borderRadius = "3px";
            confettiPiece.style.zIndex = "999";
            confettiPiece.style.opacity = "0.9";
            confettiPiece.style.transform = `rotate(${Math.random() * 360}deg)`;
            confettiPiece.style.transition = `top ${Math.random() * 2.5 + 2}s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 3s ease`;

            document.body.appendChild(confettiPiece);

            requestAnimationFrame(() => {
                confettiPiece.style.top = "105vh";
                confettiPiece.style.transform = `rotate(${Math.random() * 720}deg) translateX(${Math.random() * 100 - 50}px)`;
            });

            setTimeout(() => {
                confettiPiece.remove();
            }, 4500);
        }
    }

    /**
     * Tạo hiệu ứng những trái tim bay lên từ cạnh dưới
     */
    function triggerFloatingHearts() {
        const container = DOM.celebrationParticles;
        if (!container) return;

        const heartIcons = ["💖", "✨", "🌸", "🌷", "⭐", "💕"];

        for (let i = 0; i < 16; i++) {
            setTimeout(() => {
                const heart = document.createElement("div");
                heart.className = "floating-heart";
                heart.textContent = heartIcons[Math.floor(Math.random() * heartIcons.length)];
                heart.style.left = `${Math.random() * 85 + 7}vw`;
                heart.style.animationDuration = `${Math.random() * 2 + 3}s`;
                heart.style.animationDelay = `${Math.random() * 0.4}s`;
                heart.style.fontSize = `${Math.random() * 1.2 + 1.2}rem`;

                container.appendChild(heart);

                setTimeout(() => {
                    heart.remove();
                }, 5000);
            }, i * 180);
        }
    }

    // ----------------------------------------------------------------------
    // 5. AUDIO & MUSIC CONTROLLER (HTML5 + Web Audio Fallback)
    // ----------------------------------------------------------------------
    function initializeMusic() {
        if (!DOM.musicToggleBtn) return;

        DOM.musicToggleBtn.addEventListener("click", toggleMusic);

        // Thiết lập nguồn MP3
        if (DOM.bgAudio && config.music && config.music.src) {
            DOM.bgAudio.src = config.music.src;
            DOM.bgAudio.addEventListener("error", handleAudioFileError);
        }
    }

    function startMusicOnUserGesture() {
        if (!config.music || !config.music.enabled) return;

        // Chỉ tự động phát nếu người dùng không tắt hoặc config cho phép
        if (!state.isPlayingMusic) {
            playMusic();
        }
    }

    function toggleMusic() {
        if (state.isPlayingMusic) {
            pauseMusic();
        } else {
            playMusic();
        }
    }

    function playMusic() {
        state.isPlayingMusic = true;
        updateMusicButtonUI(true);

        // Thử phát từ thẻ audio HTML5 trước
        if (DOM.bgAudio && DOM.bgAudio.src && !state.musicSynthActive) {
            const playPromise = DOM.bgAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Trình duyệt chặn hoặc file lỗi -> Chuyển sang Web Audio Synth
                    startWebAudioMusicBox();
                });
            }
        } else {
            startWebAudioMusicBox();
        }
    }

    function pauseMusic() {
        state.isPlayingMusic = false;
        updateMusicButtonUI(false);

        if (DOM.bgAudio) {
            DOM.bgAudio.pause();
        }

        stopWebAudioMusicBox();
    }

    function handleAudioFileError() {
        // Khi file audio không tồn tại (404) -> Fallback sang Web Audio Synthesizer
        state.musicSynthActive = true;
        if (state.isPlayingMusic) {
            startWebAudioMusicBox();
        }
    }

    function updateMusicButtonUI(isPlaying) {
        if (!DOM.musicToggleBtn) return;
        DOM.musicToggleBtn.classList.toggle("playing", isPlaying);
        if (DOM.musicIcon) {
            DOM.musicIcon.textContent = isPlaying ? "🎵" : "🔇";
        }
        DOM.musicToggleBtn.title = isPlaying ? "Tắt âm nhạc" : "Bật âm nhạc";
    }

    /**
     * Bộ tổng hợp âm thanh Music Box nhẹ nhàng bằng Web Audio API
     * Mô phỏng giai điệu hộp nhạc "Happy Birthday" ấm áp, không cần file ngoài.
     */
    function startWebAudioMusicBox() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            if (!state.audioContext) {
                state.audioContext = new AudioCtx();
            }

            if (state.audioContext.state === "suspended") {
                state.audioContext.resume();
            }

            // Giai điệu Happy Birthday (Note, Tần số Hz, Độ dài tính theo nhịp)
            // G G A G C B | G G A G D C | G G G(high) E C B A | F F E C D C
            const notes = [
                { f: 261.63, d: 0.35 }, // C4
                { f: 261.63, d: 0.35 }, // C4
                { f: 293.66, d: 0.7 },  // D4
                { f: 261.63, d: 0.7 },  // C4
                { f: 349.23, d: 0.7 },  // F4
                { f: 329.63, d: 1.2 },  // E4

                { f: 261.63, d: 0.35 }, // C4
                { f: 261.63, d: 0.35 }, // C4
                { f: 293.66, d: 0.7 },  // D4
                { f: 261.63, d: 0.7 },  // C4
                { f: 392.00, d: 0.7 },  // G4
                { f: 349.23, d: 1.2 },  // F4

                { f: 261.63, d: 0.35 }, // C4
                { f: 261.63, d: 0.35 }, // C4
                { f: 523.25, d: 0.7 },  // C5
                { f: 440.00, d: 0.7 },  // A4
                { f: 349.23, d: 0.7 },  // F4
                { f: 329.63, d: 0.7 },  // E4
                { f: 293.66, d: 1.0 },  // D4

                { f: 466.16, d: 0.35 }, // Bb4
                { f: 466.16, d: 0.35 }, // Bb4
                { f: 440.00, d: 0.7 },  // A4
                { f: 349.23, d: 0.7 },  // F4
                { f: 392.00, d: 0.7 },  // G4
                { f: 349.23, d: 1.5 }   // F4
            ];

            let noteIndex = 0;

            function playNextNote() {
                if (!state.isPlayingMusic) return;

                const current = notes[noteIndex];
                playMusicBoxChime(current.f, current.d);

                noteIndex = (noteIndex + 1) % notes.length;
                const nextDelay = current.d * 750 + (noteIndex === 0 ? 1500 : 80);
                state.synthInterval = setTimeout(playNextNote, nextDelay);
            }

            playNextNote();
        } catch (e) {
            console.warn("Web Audio Synthesizer not supported", e);
        }
    }

    function playMusicBoxChime(freq, duration) {
        if (!state.audioContext) return;

        const ctx = state.audioContext;
        const now = ctx.currentTime;

        // Oscillator chính (Sine)
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        // Hài âm thứ 2 tạo độ leng keng của hộp nhạc
        const osc2 = ctx.createOscillator();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(freq * 2, now);

        // Gain envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02); // Attack nhanh
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.5); // Decay dài dịu

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + duration * 1.5);
        osc2.stop(now + duration * 1.5);
    }

    function stopWebAudioMusicBox() {
        if (state.synthInterval) {
            clearTimeout(state.synthInterval);
            state.synthInterval = null;
        }
    }

    // ----------------------------------------------------------------------
    // 6. KEYBOARD & TOUCH NAVIGATION
    // ----------------------------------------------------------------------
    function initializeKeyboardAndTouch() {
        // Phím mũi tên
        window.addEventListener("keydown", function (e) {
            if (!state.isUnlocked) return;

            // Nếu đang focus vào input thì không lật trang
            if (document.activeElement && document.activeElement.tagName === "INPUT") return;

            if (e.key === "ArrowRight") {
                nextPage();
            } else if (e.key === "ArrowLeft") {
                previousPage();
            }
        });

        // Touch Swipe trên Mobile & Tablet
        if (DOM.bookViewport) {
            DOM.bookViewport.addEventListener("touchstart", function (e) {
                state.touchStartX = e.changedTouches[0].screenX;
                state.touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            DOM.bookViewport.addEventListener("touchend", function (e) {
                if (!state.isUnlocked) return;

                const touchEndX = e.changedTouches[0].screenX;
                const touchEndY = e.changedTouches[0].screenY;
                const diffX = touchEndX - state.touchStartX;
                const diffY = touchEndY - state.touchStartY;

                // Kiểm tra swipe ngang rõ ràng (tránh nhầm lẫn cuộn dọc)
                if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
                    if (diffX < 0) {
                        // Swipe sang trái -> Next
                        nextPage();
                    } else {
                        // Swipe sang phải -> Prev
                        previousPage();
                    }
                }
            }, { passive: true });
        }
    }

    // ----------------------------------------------------------------------
    // 7. AMBIENT PARTICLES CANVAS
    // ----------------------------------------------------------------------
    function initializeBackgroundParticles() {
        const canvas = DOM.particlesCanvas;
        if (!canvas) return;

        // Tôn trọng thiết lập giảm chuyển động
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const ctx = canvas.getContext("2d");
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener("resize", () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = [];
        const particleCount = Math.min(width > 768 ? 45 : 22, 50);

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.8 + 0.5,
                color: (Math.random() > 0.4) ? "rgba(212, 175, 55, " : "rgba(229, 179, 130, ",
                alpha: Math.random() * 0.5 + 0.2,
                vx: (Math.random() - 0.5) * 0.35,
                vy: -Math.random() * 0.4 - 0.15,
                pulse: Math.random() * Math.PI
            });
        }

        function animateParticles() {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.02;

                const currentAlpha = p.alpha + Math.sin(p.pulse) * 0.15;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color + Math.max(0.05, Math.min(0.8, currentAlpha)) + ")";
                ctx.fill();

                // Đưa hạt lặp lại khi bay ra khỏi màn hình
                if (p.y < -10) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;
            }

            requestAnimationFrame(animateParticles);
        }

        animateParticles();
    }

    // ----------------------------------------------------------------------
    // 8. SECURITY UTILITIES
    // ----------------------------------------------------------------------
    function escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ----------------------------------------------------------------------
    // BOOTSTRAP APP ON DOM LOADED
    // ----------------------------------------------------------------------
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeApp);
    } else {
        initializeApp();
    }

})();
