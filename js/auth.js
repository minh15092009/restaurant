const inpEmail = document.querySelector("#login-email");
const inpPwd   = document.querySelector("#login-password");
const loginForm = document.querySelector("#login-form");

// Email admin cố định
const ADMIN_EMAIL = "phamducminh29hp@gmail.com";

// Kiểm tra session cũ (nếu cần)
// const existingSession = JSON.parse(localStorage.getItem("user_session") || "{}");
// if (existingSession.expiry && Date.now() < existingSession.expiry) {
//   return window.location.href = existingSession.email === ADMIN_EMAIL
//     ? "./admin.html"
//     : "./dashboard.html";
// }

async function handleLogin(event) {
  event.preventDefault();

  const email    = inpEmail.value.trim();
  const password = inpPwd.value.trim();

  if (!email || !password) {
    alert("⚠️ Vui lòng điền đầy đủ email và mật khẩu.");
    return;
  }

  try {
    // 1. Đăng nhập với Firebase Auth
    const { user } = await firebase.auth()
      .signInWithEmailAndPassword(email, password);

    alert("✅ Đăng nhập thành công!");

    // 2. Tạo session và lưu localStorage
    const userSession = {
      uid:    user.uid,
      email:  user.email,
      role:   (user.email === ADMIN_EMAIL ? "admin" : "user"),
      expiry: Date.now() + 2 * 60 * 60 * 1000  // 2 giờ
    };
    localStorage.setItem("user_session", JSON.stringify(userSession));

    // 3. Điều hướng theo phân quyền
    if (user.email === ADMIN_EMAIL) {
      window.location.href = "./dashboard.html";
    } else {
      window.location.href = "./index.html";
    }

  } catch (error) {
    console.error("Đăng nhập lỗi:", error);
    // Xử lý thông báo lỗi
    if (error.code === "auth/user-not-found") {
      alert("❌ Không tìm thấy tài khoản!");
    } else if (error.code === "auth/wrong-password") {
      alert("❌ Mật khẩu không đúng!");
    } else if (error.code === "auth/invalid-email") {
      alert("❌ Email không hợp lệ!");
    } else {
      alert("❌ Đăng nhập thất bại. Vui lòng thử lại.");
    }
  }
}

loginForm.addEventListener("submit", handleLogin);

