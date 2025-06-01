// js/register.js

// Email admin cố định
const ADMIN_EMAIL = "phamducminh29hp@gmail.com";

// DOM elements
const registerForm = document.querySelector("#register-form");
const inpName      = document.querySelector("#register-name");
const inpEmail     = document.querySelector("#register-email");
const inpPassword  = document.querySelector("#register-password");
const inpConfirm   = document.querySelector("#confirm-password");

if (registerForm) {
  registerForm.addEventListener("submit", handleRegister);
}

async function handleRegister(event) {
  event.preventDefault();

  const name    = inpName.value.trim();
  const email   = inpEmail.value.trim();
  const pwd     = inpPassword.value;
  const confirm = inpConfirm.value;

  // 1. Validate
  if (!name || !email || !pwd || !confirm) {
    return alert("⚠️ Vui lòng điền đầy đủ thông tin.");
  }
  if (pwd.length < 6) {
    return alert("⚠️ Mật khẩu phải ít nhất 6 ký tự.");
  }
  if (pwd !== confirm) {
    return alert("❌ Mật khẩu và xác nhận không khớp!");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return alert("❌ Email không hợp lệ.");
  }

  try {
    // 2. Tạo tài khoản
    const { user } = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, pwd);

    // 3. Phân quyền
    const role = (user.email === ADMIN_EMAIL ? "admin" : "user");

    // 4. Lưu thông tin bổ sung
    await firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .set({
        uid:       user.uid,
        name:      name,
        email:     user.email,
        role:      role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    // 5. Hoàn tất
    alert("✅ Đăng ký thành công! Vui lòng đăng nhập.");
    window.location.href = "./login.html";

  } catch (err) {
    console.error("Đăng ký lỗi:", err);
    if (err.code === "auth/email-already-in-use") {
      alert("❌ Email này đã được sử dụng.");
    } else if (err.code === "auth/invalid-email") {
      alert("❌ Email không hợp lệ.");
    } else if (err.code === "auth/weak-password") {
      alert("❌ Mật khẩu quá yếu.");
    } else {
      alert("❌ Đăng ký thất bại. Vui lòng thử lại.");
    }
  }
}
