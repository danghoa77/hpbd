/**
 * ==========================================================================
 * INTERACTIVE BIRTHDAY BOOK — CORE APPLICATION
 * ==========================================================================
 * Quản lý toàn bộ tương tác của ứng dụng thiệp sinh nhật:
 * - Xác thực mật khẩu & giao diện màn hình khóa (Lock Screen)
 * - Khởi tạo giao diện và các trang sách 3D từ cấu hình tập trung (config.js)
 * - Hiệu ứng mở sách 3D và lật trang (Spread trên desktop, Single page trên mobile)
 * - Cơ chế phân tầng 3D z-index và translateZ chuẩn xác, chống đè trang và lộ mặt sau
 * - Phát nhạc nền (HTML5 Audio + Web Audio API Synthesizer dự phòng)
 * - Hiệu ứng Confetti, pháo hoa giấy và Floating Hearts khi đến trang chúc mừng
 * - Canvas hạt lấp lánh nền (Ambient background particles)
 * ==========================================================================
 */

(function () {
    "use strict";

    // ----------------------------------------------------------------------
    // GLOBAL APP STATE
    // ----------------------------------------------------------------------
    const state = {
        isUnlocked: false,
        currentPage: 0,        // Desktop: 0..5 (Spread), Mobile: 0..9 (Single Page)
        totalSpreads: 5,       // Tổng số lượt lật trên desktop (0: Bìa, 1: Trang 1, 2: Trang 2-3, 3: Trang 4-5, 4: Trang 6-Kết, 5: Bìa sau)
        totalMobilePages: 10,  // Tổng số trang hiển thị trên mobile (0: Bìa ngoài .. 9: Bìa sau)
        isMobile: false,
        isFlipping: false,
        isPlayingMusic: false,
        musicSynthActive: false,
        audioContext: null,
        synthInterval: null,
        touchStartX: 0,
        touchStartY: 0
    };

    // Truy cập cấu hình an toàn từ window.birthdayConfig
    const config = window.birthdayConfig || {};

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
        lockHintText: document.getElementById("lock-hint-text"),

        // Navigation Controls
        prevBtn: document.getElementById("prev-btn"),
        nextBtn: document.getElementById("next-btn"),
        prevBtnLabel: document.getElementById("prev-btn-label"),
        nextBtnLabel: document.getElementById("next-btn-label"),
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
        particlesCanvas: document.getElementById("particles-canvas"),

        // Lightbox Image Preview Modal
        imageLightbox: document.getElementById("image-lightbox"),
        lightboxImg: document.getElementById("lightbox-img"),
        lightboxCaption: document.getElementById("lightbox-caption"),
        lightboxCloseBtn: document.getElementById("lightbox-close-btn")
    };

    // ----------------------------------------------------------------------
    // 1. TEXT TEMPLATE & SECURITY HELPERS
    // ----------------------------------------------------------------------
    /**
     * Thay thế các biến {recipient} và {sender} bằng thông tin cấu hình
     */
    function formatText(str) {
        if (!str) return "";
        const recipientName = (config.recipient && config.recipient.name) || "Người đặc biệt";
        const senderName = (config.sender && config.sender.name) || "Someone who cares";
        return String(str)
            .replace(/\{recipient\}/g, recipientName)
            .replace(/\{sender\}/g, senderName);
    }

    /**
     * Escape ký tự đặc biệt để an toàn khi chèn vào HTML
     */
    function escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Kết hợp thay thế placeholder và escape HTML
     */
    function t(str) {
        return escapeHTML(formatText(str));
    }

    // ----------------------------------------------------------------------
    // 2. INITIALIZATION ENTRY POINT
    // ----------------------------------------------------------------------
    function initializeApp() {
        checkViewportMode();
        window.addEventListener("resize", handleWindowResize);

        // Áp dụng các cấu hình text lên giao diện chính
        applyConfigToUI();

        // Khởi tạo các module
        initializeBackgroundParticles();
        initializePasswordScreen();
        initializeBook();
        initializeMusic();
        initializeLightbox();
        initializeKeyboardAndTouch();
        setupUserInteractionAudioTrigger();

        // Kiểm tra xem đã mở thiệp trước đó trong session chưa
        const remember = (config.auth && typeof config.auth.rememberUnlock === "boolean")
            ? config.auth.rememberUnlock
            : (typeof config.rememberUnlock === "boolean" ? config.rememberUnlock : true);

        if (remember && sessionStorage.getItem("birthdayUnlocked") === "true") {
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
            // Khi xoay màn hình hoặc đổi breakpoint, căn chỉnh lại trang và dots
            renderIndicatorDots();
            turnToSpread(state.currentPage, false);
            updateBookSpreadDisplay();
        }
    }

    /**
     * Đọc toàn bộ các trường cấu hình từ config.js và gán vào UI
     */
    function applyConfigToUI() {
        const recipientName = (config.recipient && config.recipient.name) || "Người đặc biệt";

        // Tiêu đề trang & Header top bar
        const pageTitle = (config.header && config.header.pageTitle)
            ? formatText(config.header.pageTitle)
            : `Happy Birthday, ${recipientName}! 🎂`;
        document.title = pageTitle;

        if (DOM.topTitle) {
            const brand = (config.header && config.header.brandText)
                ? formatText(config.header.brandText)
                : `Happy Birthday • ${recipientName}`;
            DOM.topTitle.textContent = brand;
        }

        if (DOM.musicToggleBtn && config.header && config.header.musicTooltip) {
            DOM.musicToggleBtn.title = config.header.musicTooltip;
        }
        if (DOM.lockToggleBtn && config.header && config.header.lockTooltip) {
            DOM.lockToggleBtn.title = config.header.lockTooltip;
        }

        // Màn hình khóa (Lock Screen)
        if (config.lockScreen) {
            if (DOM.lockTitle) {
                DOM.lockTitle.textContent = formatText(config.lockScreen.title || recipientName);
            }
            if (DOM.lockSubtitle && config.lockScreen.subtitle) {
                DOM.lockSubtitle.textContent = formatText(config.lockScreen.subtitle);
            }
            if (DOM.lockBadgeText && config.lockScreen.badge) {
                DOM.lockBadgeText.textContent = formatText(config.lockScreen.badge);
            }
            if (DOM.unlockBtnText && config.lockScreen.buttonText) {
                DOM.unlockBtnText.textContent = formatText(config.lockScreen.buttonText);
            }
            if (DOM.passwordInput && config.lockScreen.inputPlaceholder) {
                DOM.passwordInput.placeholder = config.lockScreen.inputPlaceholder;
            }
            if (DOM.errorText && config.lockScreen.errorMessage) {
                DOM.errorText.textContent = formatText(config.lockScreen.errorMessage);
            }
            // Gợi ý mật khẩu
            if (DOM.lockHint && DOM.lockHintText) {
                if (config.lockScreen.showHint && config.lockScreen.hintText) {
                    DOM.lockHintText.textContent = formatText(config.lockScreen.hintText);
                    DOM.lockHint.style.display = "block";
                } else {
                    DOM.lockHint.style.display = "none";
                }
            }
        }

        // Nút điều hướng
        if (DOM.prevBtnLabel && config.navigation && config.navigation.prevButtonText) {
            DOM.prevBtnLabel.textContent = config.navigation.prevButtonText;
        }
        if (DOM.nextBtnLabel && config.navigation && config.navigation.nextButtonText) {
            DOM.nextBtnLabel.textContent = config.navigation.nextButtonText;
        }
    }

    // ----------------------------------------------------------------------
    // 3. PASSWORD SCREEN MODULE
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

        // Nút khóa ở thanh điều khiển trên cùng
        if (DOM.lockToggleBtn) {
            DOM.lockToggleBtn.addEventListener("click", function () {
                sessionStorage.removeItem("birthdayUnlocked");
                lockBook();
            });
        }
    }

    function handlePasswordSubmit() {
        const enteredPassword = DOM.passwordInput.value.trim();
        const expectedPassword = (
            (config.auth && config.auth.password) ||
            config.password ||
            "16092003"
        ).trim();

        if (enteredPassword === expectedPassword) {
            handlePasswordSuccess();
        } else {
            handlePasswordError();
        }
    }

    function handlePasswordSuccess() {
        DOM.lockErrorMsg.classList.remove("visible");

        const remember = (config.auth && typeof config.auth.rememberUnlock === "boolean")
            ? config.auth.rememberUnlock
            : (typeof config.rememberUnlock === "boolean" ? config.rememberUnlock : true);

        if (remember) {
            sessionStorage.setItem("birthdayUnlocked", "true");
        }

        state.isUnlocked = true;

        // Bắt đầu nhạc nền nếu được bật
        startMusicOnUserGesture();

        // Chuyển cảnh từ màn hình khóa sang sách
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
            ? formatText(config.lockScreen.errorMessage)
            : "Hmm... mật khẩu chưa đúng 💭 Thử lại hé!";

        DOM.errorText.textContent = errorMsg;
        DOM.lockErrorMsg.classList.add("visible");

        // Rung nhẹ thẻ
        const card = DOM.lockScreen.querySelector(".lock-card");
        if (card) {
            card.classList.remove("shake-card");
            void card.offsetWidth; // Trigger reflow
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
        // Mở sách thẳng vào trang đầu tiên
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
    // 4. DYNAMIC 3D BOOK RENDERING (FROM CONFIG.JS)
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
     * Render toàn bộ 5 sheets (Bìa ngoài, Bìa trong, 6 trang nội dung, Lời chúc kết, Bìa sau)
     * Hoàn toàn tự động từ config.js mà không cần sửa code!
     */
    function renderBookSheets() {
        const coverFront = (config.cover && config.cover.front) || config.cover || {};
        const coverInside = (config.cover && config.cover.inside) || {};
        const pages = config.pages || [];
        const closing = config.closing || {};
        const backCover = config.backCover || {};

        const p1 = pages[0] || {};
        const p2 = pages[1] || {};
        const p3 = pages[2] || {};
        const p4 = pages[3] || {};
        const p5 = pages[4] || {};
        const p6 = pages[5] || {};

        const recipientName = (config.recipient && config.recipient.name) || "Người đặc biệt";
        const senderName = (config.sender && config.sender.name) || "Someone who cares";
        const birthDate = (config.birthday && (config.birthday.formattedDate || config.birthday.date)) || "16/09/2003";

        DOM.bookSheetsContainer.innerHTML = `
            <!-- ========================================================= -->
            <!-- SHEET 0: FRONT COVER & INSIDE COVER                       -->
            <!-- ========================================================= -->
            <div class="book-sheet" data-sheet-index="0" id="sheet-0">
                <!-- Front: Bìa sách ngoài -->
                <div class="sheet-face sheet-front sheet-cover-front">
                    <div class="cover-emboss-frame"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <span class="corner-ornament corner-br"></span>
                    
                    <div class="cover-content">
                        <div class="cover-seal" aria-hidden="true">${t(coverFront.sealIcon || "🎂")}</div>
                        <span class="cover-badge">${t(coverFront.badge || "Special Edition")}</span>
                        <h2 class="cover-main-title">${t(coverFront.title || "Happy Birthday")}</h2>
                        <div class="cover-recipient">${escapeHTML(recipientName)}</div>
                        <div class="cover-divider">
                            <span></span>
                            <i>✨</i>
                            <span></span>
                        </div>
                        <p class="cover-subtitle">${t(coverFront.subtitle || "A little book made just for you")}</p>
                        <div class="cover-instruction">
                            <span>📖</span>
                            <span>${t(coverFront.instruction || "Nhấn để mở quà")}</span>
                        </div>
                    </div>
                </div>

                <!-- Back: Bìa trong (Inside Cover - Trang ngỏ bên trái) -->
                <div class="sheet-face sheet-back">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header">
                            <span class="page-tag">${t(coverInside.tag || "Dành tặng bạn")}</span>
                            <h3 class="page-title">${t(coverInside.title || "Một món quà nhỏ gửi tặng em")}</h3>
                            <div class="flourish-divider">${t(coverInside.divider || "✨ 🌸 ✨")}</div>
                        </div>
                        <div class="opening-body" style="text-align: center; justify-content: center;">
                            <p style="font-size: 1.05rem; line-height: 1.8;">
                                ${t(coverInside.message || "Quyển sách nhỏ này được tạo nên từ những tình cảm chân thành nhất, lưu giữ những lời chúc và kỷ niệm đẹp đẽ nhân ngày sinh nhật của bạn.")}
                            </p>
                            <div class="opening-quote" style="border-left: none; border-top: 2px solid var(--color-accent-gold); border-bottom: 2px solid var(--color-accent-gold); border-radius: 0; padding: 1rem;">
                                ${t(coverInside.quote || "“Chúc cho hành trình tuổi mới luôn tràn ngập nụ cười và ánh nắng rực rỡ.”")}
                            </div>
                            <p style="font-size: 0.88rem; color: var(--text-muted);">
                                ${t(coverInside.hint || "Hãy lật sang trang tiếp theo để cùng khám phá nhé! 👉")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ========================================================= -->
            <!-- SHEET 1: PAGE 1 (OPENING) & PAGE 2 (MEMORY PHOTO)         -->
            <!-- ========================================================= -->
            <div class="book-sheet" data-sheet-index="1" id="sheet-1">
                <!-- Front: Trang 1 (Opening) -->
                <div class="sheet-face sheet-front">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-br"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header">
                            <span class="page-tag">${t(p1.chapter || "Chương I")}</span>
                            <h3 class="page-title">${t(p1.title || "Hôm Nay Là Một Ngày Đặc Biệt")}</h3>
                            <p class="page-subtitle">${t(p1.subtitle || "Chào tuổi mới rạng rỡ")}</p>
                            <div class="flourish-divider">${t(p1.decor || "🌸")}</div>
                        </div>
                        <div class="opening-body">
                            <p class="opening-dropcap">
                                ${t(p1.content || "Có một ngày trong năm mà cả vũ trụ dường như trở nên ấm áp và lấp lánh hơn, bởi đó chính là ngày bạn xuất hiện trên thế giới này.")}
                            </p>
                            <div class="opening-quote">
                                ${t(p1.quote || "“Mong rằng mỗi ngày thức dậy, bạn đều tìm thấy một lý do thật ngọt ngào để mỉm cười.”")}
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
                            <span class="page-tag">${t(p2.chapter || "Chương II")}</span>
                            <h3 class="page-title">${t(p2.title || "Những Khoảnh Khắc Đẹp")}</h3>
                            <p class="page-subtitle">${t(p2.subtitle || "Lưu giữ kỷ niệm")}</p>
                            <div class="flourish-divider">${t(p2.decor || "📷")}</div>
                        </div>
                        <div class="memory-body">
                            <div class="memory-frame" data-photo-src="${escapeHTML(p2.image || 'assets/images/photo-1.jpg')}" data-photo-caption="${escapeHTML(p2.caption || 'Kỷ niệm đáng nhớ')}">
                                ${renderSafeImage(p2.image || "assets/images/photo-1.jpg", "Kỷ niệm đẹp", "memory-photo", "Khoảnh khắc đáng nhớ")}
                            </div>
                            <span class="memory-date-tag">${t(p2.dateTag || "✨ Kỷ niệm đáng nhớ")}</span>
                            <p class="memory-caption">${t(p2.caption || "Một kỷ niệm thật đẹp trên chặng đường chúng ta cùng đi qua.")}</p>
                        </div>
                    </div>
                    <span class="page-num">2</span>
                </div>
            </div>

            <!-- ========================================================= -->
            <!-- SHEET 2: PAGE 3 (GALLERY) & PAGE 4 (PHOTOS / WISHES)      -->
            <!-- ========================================================= -->
            <div class="book-sheet" data-sheet-index="2" id="sheet-2">
                <!-- Front: Trang 3 (Gallery Scrapbook / Duo Photos) -->
                <div class="sheet-face sheet-front">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-br"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header" style="margin-bottom: 0.75rem;">
                            <span class="page-tag">${t(p3.chapter || "Chương III")}</span>
                            <h3 class="page-title">${t(p3.title || "Góc Kỷ Niệm Yêu Thương")}</h3>
                            <p class="page-subtitle">${t(p3.subtitle || "Những nụ cười đong đầy niềm vui")}</p>
                            ${p3.decor ? `<div class="flourish-divider">${t(p3.decor)}</div>` : ""}
                        </div>
                        ${renderPhotosContent(p3)}
                    </div>
                    <span class="page-num">3</span>
                </div>

                <!-- Back: Trang 4 (Mục ảnh kỷ niệm / Wishes Cards) -->
                <div class="sheet-face sheet-back">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tl"></span>
                    <span class="corner-ornament corner-bl"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header" style="margin-bottom: 0.75rem;">
                            <span class="page-tag">${t(p4.chapter || "Chương IV")}</span>
                            <h3 class="page-title">${t(p4.title || "Những Khoảnh Khắc Ngọt Ngào")}</h3>
                            <p class="page-subtitle">${t(p4.subtitle || "Từng nụ cười đong đầy niềm vui")}</p>
                            ${p4.decor ? `<div class="flourish-divider">${t(p4.decor)}</div>` : ""}
                        </div>
                        ${(p4.type === "photos" || p4.photos) ? renderPhotosContent(p4) : `
                            <div class="wishes-grid">
                                ${renderWishCards(p4.cards)}
                            </div>
                        `}
                    </div>
                    <span class="page-num">4</span>
                </div>
            </div>

            <!-- ========================================================= -->
            <!-- SHEET 3: PAGE 5 (PHOTOS / LETTER) & PAGE 6 (FINAL)        -->
            <!-- ========================================================= -->
            <div class="book-sheet" data-sheet-index="3" id="sheet-3">
                <!-- Front: Trang 5 (Mục ảnh yêu thương / Handwritten Letter) -->
                <div class="sheet-face sheet-front">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-br"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header" style="margin-bottom: 0.6rem;">
                            <span class="page-tag">${t(p5.chapter || "Chương V")}</span>
                            <h3 class="page-title">${t(p5.title || "Mảnh Ghép Yêu Thương")}</h3>
                            <p class="page-subtitle">${t(p5.subtitle || "Lưu giữ những điều tuyệt vời nhất")}</p>
                            ${p5.decor ? `<div class="flourish-divider">${t(p5.decor)}</div>` : ""}
                        </div>
                        ${(p5.type === "photos" || p5.photos) ? renderPhotosContent(p5) : `
                            <div class="letter-body">
                                <div class="letter-greeting">${t(p5.greeting || `Gửi ${recipientName},`)}</div>
                                <p class="letter-text">${t(p5.content || "Cảm ơn em vì đã luôn là một người thật tuyệt vời. Chúc em tuổi mới luôn rực rỡ và hạnh phúc!")}</p>
                                <div class="letter-footer">
                                    <div class="letter-wax-seal" aria-hidden="true">🎂</div>
                                    <div class="letter-signature">${t(p5.signature || `From ${senderName}`)}</div>
                                </div>
                            </div>
                        `}
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
                            <div class="cake-container" id="final-cake-icon" title="${t(p6.cakeHint || "Nhấn để bắn thêm pháo hoa!")}">${t(p6.cakeIcon || "🎂")}</div>
                            <span class="final-badge">${t(p6.badge || "Happy Birthday")}</span>
                            <h3 class="final-title">${t(p6.title || "HAPPY BIRTHDAY!")}</h3>
                            <div class="final-recipient">${t(p6.recipientName || `${recipientName} 🎂`)}</div>
                            <p class="final-wishes">${t(p6.wishText || "Chúc bạn có một tuổi mới thật nhiều niềm vui, nhiều may mắn và thật nhiều điều đẹp đẽ.")}</p>
                            <span class="final-closing">${t(p6.closing || "With love,")}</span>
                            <span class="final-sender">${t(p6.senderName || senderName)}</span>
                            
                            <button type="button" class="btn replay-btn" id="final-replay-btn">
                                <span>${t(p6.replayButtonText || "↻ Xem lại từ đầu")}</span>
                            </button>
                        </div>
                    </div>
                    <span class="page-num">6</span>
                </div>
            </div>

            <!-- ========================================================= -->
            <!-- SHEET 4: CLOSING SPREAD & BACK COVER                      -->
            <!-- ========================================================= -->
            <div class="book-sheet" data-sheet-index="4" id="sheet-4">
                <!-- Front: Trang lời chúc cuối bên trong -->
                <div class="sheet-face sheet-front">
                    <div class="page-inner-border"></div>
                    <span class="corner-ornament corner-tr"></span>
                    <span class="corner-ornament corner-br"></span>
                    <div class="page-content-wrapper">
                        <div class="page-header">
                            <span class="page-tag">${t(closing.tag || "Lời Chúc Cuối")}</span>
                            <h3 class="page-title">${t(closing.title || "Một Ngày Trọn Vẹn")}</h3>
                            <div class="flourish-divider">${t(closing.divider || "✨ 💖 ✨")}</div>
                        </div>
                        <div class="opening-body" style="text-align: center; justify-content: center; gap: 1.25rem;">
                            <div style="font-size: 3.2rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15));" aria-hidden="true">${t(closing.icon || "🎁")}</div>
                            <div class="opening-quote" style="border-left: none; border-top: 2px solid var(--color-accent-gold); border-bottom: 2px solid var(--color-accent-gold); border-radius: 0; padding: 1.1rem; background: rgba(229, 179, 130, 0.12);">
                                ${t(closing.quote || "“Cảm ơn vì đã luôn là chính bạn — một đóa hoa dịu dàng và rực rỡ nhất.”")}
                            </div>
                            <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">
                                ${t(closing.message || "Chúc bạn một tuổi mới bình an, tự tin và ngập tràn những phép màu tuyệt đẹp!")}
                            </p>
                            <button type="button" class="btn replay-btn" id="closing-replay-btn" style="align-self: center; margin-top: 0.5rem;">
                                <span>${t(closing.replayButtonText || "↻ Xem lại từ đầu")}</span>
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
                        <div class="cover-seal" aria-hidden="true">${t(backCover.sealIcon || "💖")}</div>
                        <h3 style="font-family: var(--font-heading); font-size: 1.8rem; color: #fff;">${t(backCover.title || "Happy Birthday")}</h3>
                        <p style="font-family: var(--font-handwriting); font-size: 1.6rem; color: var(--color-secondary);">
                            ${t(backCover.subtitle || `Made with love for ${recipientName}`)}
                        </p>
                        <div class="cover-divider">
                            <span></span>
                            <i>✨</i>
                            <span></span>
                        </div>
                        <small style="color: rgba(255, 255, 255, 0.6);">${t(backCover.date || birthDate)}</small>
                    </div>
                </div>
            </div>
        `;

        // Gắn sự kiện click vào các sheet để lật trang
        const allSheets = DOM.bookSheetsContainer.querySelectorAll(".book-sheet");
        allSheets.forEach((sheet) => {
            sheet.addEventListener("click", function (e) {
                // Không lật khi click vào button, link hoặc ảnh
                if (e.target.closest("button") || e.target.closest("a") || e.target.closest(".duo-photo-card") || e.target.closest(".polaroid-card") || e.target.closest(".memory-frame")) return;

                if (state.isMobile) {
                    nextPage();
                } else {
                    if (sheet.classList.contains("flipped")) {
                        previousPage();
                    } else {
                        nextPage();
                    }
                }
            });
        });

        // Gắn sự kiện cho các nút "Xem lại từ đầu" và bánh kem
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
     * Helper render ảnh có sẵn fallback an toàn khi link ảnh lỗi
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
     * Helper render ảnh Polaroid scrapbook
     */
    function renderGalleryPhotos(photos) {
        const defaultPhotos = [
            { image: "assets/images/photo-2.jpg", caption: "Nụ cười tỏa nắng ✨" },
            { image: "assets/images/photo-3.jpg", caption: "Bình yên dịu dàng 🌷" },
            { image: "assets/images/photo-4.jpg", caption: "Khoảnh khắc đáng yêu 💖" }
        ];

        const list = (photos && photos.length) ? photos : defaultPhotos;
        return list.slice(0, 3).map((item, idx) => `
            <div class="polaroid-card" data-polaroid-idx="${idx}" data-photo-src="${escapeHTML(item.image)}" data-photo-caption="${escapeHTML(item.caption || '')}">
                <div class="polaroid-tape" aria-hidden="true"></div>
                <div class="polaroid-img-box">
                    ${renderSafeImage(item.image, item.caption, "polaroid-img", item.caption)}
                </div>
                <div class="polaroid-caption">${t(item.caption)}</div>
            </div>
        `).join("");
    }

    /**
     * Helper render các mục ảnh linh hoạt:
     * - 2 ảnh: Duo photos (layout 2 ảnh polaroid song song nghệ thuật kèm washi tape)
     * - 3 ảnh trở lên: Scrapbook polaroid
     * - 1 ảnh: Khung ảnh lớn
     * Kèm theo trích dẫn (quote) ý nghĩa nếu có
     */
    function renderPhotosContent(pageData) {
        if (!pageData) return "";
        const photos = pageData.photos || [];
        const quoteHtml = pageData.quote
            ? `<div class="photo-page-quote">${t(pageData.quote)}</div>`
            : "";

        if (photos.length === 2) {
            return `
                <div class="duo-photos-container">
                    ${photos.map((item, idx) => `
                        <div class="duo-photo-card" data-photo-src="${escapeHTML(item.image)}" data-photo-caption="${escapeHTML(item.caption || '')}">
                            <div class="polaroid-tape" aria-hidden="true"></div>
                            <div class="duo-img-box">
                                ${renderSafeImage(item.image, item.caption || "Kỷ niệm", "duo-img", item.caption || "Ảnh")}
                            </div>
                            <div class="duo-caption">${t(item.caption || "")}</div>
                        </div>
                    `).join("")}
                </div>
                ${quoteHtml}
            `;
        }

        if (photos.length === 1) {
            const p = photos[0];
            return `
                <div class="memory-body">
                    <div class="memory-frame" data-photo-src="${escapeHTML(p.image)}" data-photo-caption="${escapeHTML(p.caption || '')}">
                        ${renderSafeImage(p.image, p.caption || "Kỷ niệm", "memory-photo", p.caption || "Ảnh")}
                    </div>
                    ${p.caption ? `<p class="memory-caption">${t(p.caption)}</p>` : ""}
                    ${quoteHtml}
                </div>
            `;
        }

        return `
            <div class="gallery-scrapbook">
                ${renderGalleryPhotos(photos)}
            </div>
            ${quoteHtml}
        `;
    }

    /**
     * Helper render các thẻ lời chúc
     */
    function renderWishCards(cards) {
        const defaultCards = [
            { icon: "✨", title: "Bình An & Rạng Rỡ", text: "Mong bạn luôn giữ được sự an nhiên trong tâm hồn và nụ cười tươi tắn như ánh mai sớm." },
            { icon: "🌷", title: "Vạn Sự Như Ý", text: "Mong mọi ước mơ, dự định bạn ấp ủ sẽ đều đơm hoa kết trái thật ngọt ngào và rực rỡ." },
            { icon: "🎂", title: "Ngập Tràn Niềm Vui", text: "Chúc bạn một tuổi mới nhiều sức khỏe, luôn may mắn và gặp gỡ những điều tuyệt vời." },
            { icon: "💖", title: "Mãi Được Yêu Thương", text: "Hy vọng mỗi ngày trôi qua, bạn luôn được chở che, thấu hiểu và yêu thương trọn vẹn." }
        ];

        const list = (cards && cards.length) ? cards : defaultCards;
        return list.slice(0, 4).map(card => `
            <div class="wish-card">
                <div class="wish-header">
                    <span class="wish-icon" aria-hidden="true">${t(card.icon || "✨")}</span>
                    <h4 class="wish-title">${t(card.title)}</h4>
                </div>
                <p class="wish-text">${t(card.text)}</p>
            </div>
        `).join("");
    }

    /**
     * Module Lightbox Modal: Xem ảnh phóng to khi bấm vào ảnh
     */
    function initializeLightbox() {
        if (!DOM.imageLightbox) return;

        // Bắt sự kiện click vào ảnh trong sách
        DOM.bookSheetsContainer.addEventListener("click", function (e) {
            const photoCard = e.target.closest(".duo-photo-card, .polaroid-card, .memory-frame");
            if (!photoCard) return;

            const img = photoCard.querySelector("img");
            const src = photoCard.getAttribute("data-photo-src") || (img && img.src);
            const caption = photoCard.getAttribute("data-photo-caption") || (img && img.alt) || "";

            if (src) {
                openLightbox(src, caption);
            }
        });

        if (DOM.lightboxCloseBtn) {
            DOM.lightboxCloseBtn.addEventListener("click", closeLightbox);
        }

        DOM.imageLightbox.addEventListener("click", function (e) {
            if (e.target === DOM.imageLightbox || e.target.classList.contains("lightbox-backdrop")) {
                closeLightbox();
            }
        });

        window.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && DOM.imageLightbox.classList.contains("active")) {
                closeLightbox();
            }
        });
    }

    function openLightbox(src, caption) {
        if (!DOM.imageLightbox || !DOM.lightboxImg) return;
        DOM.lightboxImg.src = src;
        if (DOM.lightboxCaption) {
            DOM.lightboxCaption.textContent = caption || "";
        }
        DOM.imageLightbox.classList.add("active");
        DOM.imageLightbox.setAttribute("aria-hidden", "false");
    }

    function closeLightbox() {
        if (!DOM.imageLightbox) return;
        DOM.imageLightbox.classList.remove("active");
        DOM.imageLightbox.setAttribute("aria-hidden", "true");
    }

    /**
     * Hiệu ứng mở sách ban đầu sau khi nhập đúng mật khẩu
     */
    function openBookAnimation() {
        DOM.bookWrapper.classList.add("book-entering");
        state.currentPage = 0;
        updateBookSpreadDisplay();

        // Sau khi sách hiển thị cân đối, tự động mở bìa sang trang 1
        setTimeout(() => {
            DOM.bookWrapper.classList.remove("book-entering");
            turnToSpread(1, true);
        }, 900);
    }

    // ----------------------------------------------------------------------
    // 5. CORE 3D PAGE TURNING MECHANICS (ROBUST Z-INDEX & NO-OVERLAP)
    // ----------------------------------------------------------------------
    function nextPage() {
        if (state.isFlipping) return;
        const maxPages = state.isMobile ? state.totalMobilePages - 1 : state.totalSpreads;
        if (state.currentPage < maxPages) {
            turnToSpread(state.currentPage + 1, true);
        }
    }

    function previousPage() {
        if (state.isFlipping) return;
        if (state.currentPage > 0) {
            turnToSpread(state.currentPage - 1, true);
        }
    }

    /**
     * Chuyển đến trang chỉ định:
     * - Desktop: Điều khiển 5 spread, phân tầng z-index và translateZ mượt mà
     * - Mobile: Điều khiển 10 trang độc lập, lật trực diện 3D không bị khuất
     */
    function turnToSpread(targetPage, animate = true) {
        if (state.isFlipping && animate) return;
        state.isFlipping = true;

        const prevPage = state.currentPage;
        state.currentPage = targetPage;

        if (state.isMobile) {
            turnMobilePage(targetPage, prevPage, animate);
        } else {
            turnDesktopSpread(targetPage, prevPage, animate);
        }

        // Cập nhật nhãn trang, indicator dots và trạng thái các nút
        updateBookSpreadDisplay();

        // Kích hoạt pháo hoa khi đến trang chúc mừng
        const isCelebrationPage = (!state.isMobile && state.currentPage === 4) || (state.isMobile && state.currentPage === 7);
        if (isCelebrationPage) {
            triggerFinalCelebration();
        }
    }

    /**
     * Settle trạng thái resting chuẩn xác cho toàn bộ các sheet trên Desktop
     * Ngăn chặn hoàn toàn lỗi "trang này đè trang kia" và "lộ mặt sau"
     */
    function settleDesktopStack(targetSpread) {
        const allSheets = DOM.bookSheetsContainer.querySelectorAll(".book-sheet");
        const totalSheets = allSheets.length;

        allSheets.forEach((sheet, sheetIndex) => {
            sheet.classList.remove("flipping");
            sheet.style.display = "block";

            if (sheetIndex < targetSpread) {
                // Sheet nằm trên stack bên TRÁI (đã lật sang trái -180deg)
                sheet.classList.add("flipped");
                sheet.style.zIndex = sheetIndex + 1;
                // Dưới góc xoay -180deg, vector -Z của sheet hướng về phía người xem.
                // Sheet lật sau (sheetIndex lớn hơn) sẽ có World Z lớn hơn, nằm trên sheet lật trước.
                sheet.style.transform = `rotateY(-180deg) translateZ(-${(sheetIndex + 1) * 0.5}px)`;
            } else {
                // Sheet nằm trên stack bên PHẢI (chưa lật 0deg)
                sheet.classList.remove("flipped");
                sheet.style.zIndex = totalSheets - sheetIndex;
                // Dưới góc xoay 0deg, vector +Z của sheet hướng về phía người xem.
                // Sheet phía trước (sheetIndex nhỏ hơn) sẽ có World Z lớn hơn để nằm trên sheet bên dưới.
                sheet.style.transform = `rotateY(0deg) translateZ(${(totalSheets - sheetIndex) * 0.5}px)`;
            }
        });
    }

    /**
     * Xử lý chuyển trang trên Desktop (Two-page spread)
     */
    function turnDesktopSpread(targetSpread, prevSpread, animate = true) {
        const allSheets = DOM.bookSheetsContainer.querySelectorAll(".book-sheet");
        const totalSheets = allSheets.length;

        // Nếu không animate hoặc nhảy nhiều trang cùng lúc, settle ngay lập tức
        if (!animate || Math.abs(targetSpread - prevSpread) !== 1) {
            settleDesktopStack(targetSpread);
            state.isFlipping = false;
            return;
        }

        // Lật TIẾN: prevSpread -> targetSpread
        if (targetSpread > prevSpread) {
            const flippingSheetIndex = prevSpread;
            const flippingSheet = allSheets[flippingSheetIndex];

            if (flippingSheet) {
                // Đảm bảo các sheet khác giữ resting z-index
                allSheets.forEach((sheet, idx) => {
                    if (idx < prevSpread) {
                        sheet.style.zIndex = idx + 1;
                    } else if (idx > prevSpread) {
                        sheet.style.zIndex = totalSheets - idx;
                    }
                });

                // Nâng z-index của sheet đang bay để lướt mượt trên cả 2 stack
                flippingSheet.classList.add("flipping");
                flippingSheet.style.zIndex = 50;
                flippingSheet.classList.add("flipped");
                flippingSheet.style.transform = `rotateY(-180deg) translateZ(-${(flippingSheetIndex + 1) * 0.5}px)`;
            }
        } 
        // Lật LÙI: prevSpread -> targetSpread
        else {
            const flippingSheetIndex = targetSpread;
            const flippingSheet = allSheets[flippingSheetIndex];

            if (flippingSheet) {
                allSheets.forEach((sheet, idx) => {
                    if (idx < targetSpread) {
                        sheet.style.zIndex = idx + 1;
                    } else if (idx > targetSpread) {
                        sheet.style.zIndex = totalSheets - idx;
                    }
                });

                // Nâng z-index của sheet đang bay ngược lại
                flippingSheet.classList.add("flipping");
                flippingSheet.style.zIndex = 50;
                flippingSheet.classList.remove("flipped");
                flippingSheet.style.transform = `rotateY(0deg) translateZ(${(totalSheets - flippingSheetIndex) * 0.5}px)`;
            }
        }

        // Kết thúc animation: Khóa chắc chắn vị trí và phân tầng của tất cả sheets
        setTimeout(() => {
            settleDesktopStack(targetSpread);
            state.isFlipping = false;
        }, 850);
    }

    /**
     * Xử lý chuyển trang trên Mobile (Single page view)
     */
    function turnMobilePage(targetPage, prevPage, animate = true) {
        const allSheets = DOM.bookSheetsContainer.querySelectorAll(".book-sheet");
        const targetSheetIdx = Math.floor(targetPage / 2);
        const isBackFace = (targetPage % 2 === 1);

        allSheets.forEach((sheet, idx) => {
            if (idx === targetSheetIdx) {
                sheet.style.display = "block";
                sheet.style.zIndex = 10;
                if (isBackFace) {
                    sheet.classList.add("flipped");
                    sheet.style.transform = "rotateY(-180deg)";
                } else {
                    sheet.classList.remove("flipped");
                    sheet.style.transform = "rotateY(0deg)";
                }
            } else {
                sheet.style.display = "none";
                sheet.style.zIndex = 1;
            }
        });

        setTimeout(() => {
            state.isFlipping = false;
        }, animate ? 650 : 50);
    }

    /**
     * Cập nhật hiển thị chỉ số trang, indicator dots và trạng thái Next/Prev
     */
    function updateBookSpreadDisplay() {
        const maxPages = state.isMobile ? state.totalMobilePages - 1 : state.totalSpreads;

        // Vị trí bìa sách cân đối khi đóng trên Desktop
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

        // Trạng thái disabled của nút điều hướng
        if (DOM.prevBtn) DOM.prevBtn.disabled = (state.currentPage <= 0);
        if (DOM.nextBtn) DOM.nextBtn.disabled = (state.currentPage >= maxPages);

        // Text hiển thị trang theo cấu hình
        const nav = config.navigation || {};
        if (DOM.pageIndicator) {
            if (state.isMobile) {
                if (state.currentPage === 0) {
                    DOM.pageIndicator.textContent = nav.coverLabel || "Bìa sách 📖";
                } else if (state.currentPage === state.totalMobilePages - 1) {
                    DOM.pageIndicator.textContent = nav.backCoverLabel || "Bìa sau 💖";
                } else {
                    const pattern = nav.pagePattern || "Trang {page} / {total}";
                    DOM.pageIndicator.textContent = pattern
                        .replace("{page}", state.currentPage)
                        .replace("{total}", state.totalMobilePages - 2);
                }
            } else {
                if (state.currentPage === 0) {
                    DOM.pageIndicator.textContent = nav.coverLabel || "Bìa sách 📖";
                } else if (state.currentPage === 1) {
                    DOM.pageIndicator.textContent = "Trang 1 / 6";
                } else if (state.currentPage === 2) {
                    DOM.pageIndicator.textContent = "Trang 2 - 3 / 6";
                } else if (state.currentPage === 3) {
                    DOM.pageIndicator.textContent = "Trang 4 - 5 / 6";
                } else if (state.currentPage === 4) {
                    const pattern = nav.celebrationPattern || "Trang {total} / {total} • Kết thúc 🎂";
                    DOM.pageIndicator.textContent = pattern.replace("{total}", "6");
                } else if (state.currentPage >= 5) {
                    DOM.pageIndicator.textContent = nav.backCoverLabel || "Bìa sau 💖";
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
     * Render các chấm tròn chỉ số trang
     */
    function renderIndicatorDots() {
        if (!DOM.indicatorDots) return;
        DOM.indicatorDots.innerHTML = "";
        const count = state.isMobile ? state.totalMobilePages : state.totalSpreads + 1;

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
     * Đưa sách quay lại trang bìa
     */
    function resetBookToCover() {
        turnToSpread(0, true);
    }

    // ----------------------------------------------------------------------
    // 6. CONFETTI & FINAL CELEBRATION
    // ----------------------------------------------------------------------
    function triggerFinalCelebration() {
        triggerConfettiExplosion();
        triggerFloatingHearts();
    }

    function triggerConfettiExplosion() {
        if (typeof window.confetti === "function") {
            try {
                // Vụ nổ chính giữa
                window.confetti({
                    particleCount: 85,
                    spread: 75,
                    origin: { y: 0.6 },
                    colors: ["#d4af37", "#f3d078", "#c86d51", "#ff8da1", "#ffffff"]
                });

                // Pháo hoa từ góc trái
                setTimeout(() => {
                    window.confetti({
                        particleCount: 55,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0.1, y: 0.8 },
                        colors: ["#d4af37", "#c86d51", "#ffccd5"]
                    });
                }, 250);

                // Pháo hoa từ góc phải
                setTimeout(() => {
                    window.confetti({
                        particleCount: 55,
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
    // 7. AUDIO & MUSIC CONTROLLER (HTML5 + Web Audio Fallback)
    // ----------------------------------------------------------------------
    function initializeMusic() {
        if (!DOM.musicToggleBtn) return;

        DOM.musicToggleBtn.addEventListener("click", toggleMusic);

        if (DOM.bgAudio && config.music && config.music.src) {
            DOM.bgAudio.src = encodeURI(config.music.src);
            DOM.bgAudio.volume = 0.75;
            DOM.bgAudio.addEventListener("error", handleAudioFileError);
            DOM.bgAudio.addEventListener("canplaythrough", function () {
                state.musicSynthActive = false;
            });
        }
    }

    function setupUserInteractionAudioTrigger() {
        if (!config.music || config.music.enabled === false) return;
        const trigger = () => {
            if (state.isUnlocked && !state.isPlayingMusic) {
                playMusic();
            }
        };
        window.addEventListener("click", trigger, { once: true });
        window.addEventListener("keydown", trigger, { once: true });
        window.addEventListener("touchstart", trigger, { once: true });
    }

    function startMusicOnUserGesture() {
        if (!config.music || config.music.enabled === false) return;
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

        if (DOM.bgAudio && DOM.bgAudio.src && !state.musicSynthActive) {
            const playPromise = DOM.bgAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    stopWebAudioMusicBox();
                }).catch((err) => {
                    console.warn("HTML5 audio playback prevented or error:", err);
                    if (DOM.bgAudio.error) {
                        state.musicSynthActive = true;
                        startWebAudioMusicBox();
                    }
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

    function handleAudioFileError(err) {
        console.warn("Audio file error, falling back to Web Audio Music Box:", err);
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
    }

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

            // Giai điệu Happy Birthday nhẹ nhàng dạng Music Box
            const notes = [
                { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.35 }, { f: 293.66, d: 0.7 },
                { f: 261.63, d: 0.7 }, { f: 349.23, d: 0.7 }, { f: 329.63, d: 1.2 },
                { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.35 }, { f: 293.66, d: 0.7 },
                { f: 261.63, d: 0.7 }, { f: 392.00, d: 0.7 }, { f: 349.23, d: 1.2 },
                { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.35 }, { f: 523.25, d: 0.7 },
                { f: 440.00, d: 0.7 }, { f: 349.23, d: 0.7 }, { f: 329.63, d: 0.7 },
                { f: 293.66, d: 1.0 }, { f: 466.16, d: 0.35 }, { f: 466.16, d: 0.35 },
                { f: 440.00, d: 0.7 }, { f: 349.23, d: 0.7 }, { f: 392.00, d: 0.7 },
                { f: 349.23, d: 1.5 }
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

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        const osc2 = ctx.createOscillator();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(freq * 2, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.5);

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
    // 8. KEYBOARD & TOUCH NAVIGATION
    // ----------------------------------------------------------------------
    function initializeKeyboardAndTouch() {
        window.addEventListener("keydown", function (e) {
            if (!state.isUnlocked) return;
            if (document.activeElement && document.activeElement.tagName === "INPUT") return;

            if (e.key === "ArrowRight") {
                nextPage();
            } else if (e.key === "ArrowLeft") {
                previousPage();
            }
        });

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

                if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
                    if (diffX < 0) {
                        nextPage();
                    } else {
                        previousPage();
                    }
                }
            }, { passive: true });
        }
    }

    // ----------------------------------------------------------------------
    // 9. AMBIENT BACKGROUND PARTICLES CANVAS
    // ----------------------------------------------------------------------
    function initializeBackgroundParticles() {
        const canvas = DOM.particlesCanvas;
        if (!canvas) return;

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
    // BOOTSTRAP APP ON DOM LOADED
    // ----------------------------------------------------------------------
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeApp);
    } else {
        initializeApp();
    }

})();
