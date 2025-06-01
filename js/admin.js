
function toggleAddForm() {
  const form = document.getElementById("add-form");
  form.style.display = form.style.display === "none" ? "block" : "none";
}

// Thêm món ăn (upload ảnh lên Storage trước)
function addFood() {
  const name = document.getElementById("food-name").value.trim();
  const description = document.getElementById("food-description").value.trim();
  const price = parseInt(document.getElementById("food-price").value);
  const file = document.getElementById("food-image-file").files[0];
if (file) {
  uploadToCloudinary(file)
    .then((imageUrl) => {
      return db.collection("foods").add({
        name,
        description,
        price,
        image: imageUrl, // Link ảnh từ Cloudinary
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      alert('✅ Đã thêm món ăn thành công!');
      clearForm();
      loadAdminFoods();
      toggleAddForm();
    })
    .catch((error) => {
      console.error("Lỗi khi upload ảnh:", error);
      alert('❌ Có lỗi khi upload ảnh!' + error);
    });
} else {
  alert('❗ Vui lòng chọn ảnh!');
}

}

// Xóa món ăn
function deleteFood(foodId) {
  if (confirm("Bạn có chắc chắn muốn xóa món ăn này không?")) {
    db.collection("foods").doc(foodId).delete()
      .then(() => {
        alert("✅ Đã xóa món ăn.");
        loadAdminFoods();
      })
      .catch(error => {
        console.error(error);
        alert("❌ Lỗi khi xóa món ăn!");
      });
  }
}

// Load danh sách món ăn
function loadAdminFoods() {
  db.collection("foods").orderBy("createdAt", "desc").get()
    .then(snapshot => {
      let html = "";
      snapshot.forEach(doc => {
        const food = doc.data();
        html += `
          <div class="food-card">
            <img src="${food.image}" alt="${food.name}" />
            <h3>${food.name}</h3>
            <p>${food.description}</p>
            <strong>${food.price.toLocaleString()} VNĐ</strong><br/>
            <button onclick="deleteFood('${doc.id}')">❌ Xóa món</button>
          </div>
        `;
      });
      document.getElementById("admin-food-list").innerHTML = html;
    });
}

// Clear form
function clearForm() {
  document.getElementById("food-name").value = "";
  document.getElementById("food-description").value = "";
  document.getElementById("food-price").value = "";
  document.getElementById("food-image-file").value = "";
}
function uploadToCloudinary(file) {
  
  const url = `https://api.cloudinary.com/v1_1/dsreddou4/image/upload`; 
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'minh minh');

  return fetch(url, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    return response.json()
  })
  .then(data => data.secure_url); // Link ảnh chuẩn HTTPS
}


// Check đăng nhập
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // Giả sử tài khoản admin đã xác định theo email
    const adminEmails = ["phamducminh29hp@gmail.com"]; // thêm email admin tại đây
    if (adminEmails.includes(user.email)) {
      loadAdminFoods();
    } else {
      alert("Bạn không có quyền truy cập trang admin!");
      window.location.href = "index.html";
    }
  } else {
    window.location.href = "login.html";
  }
});

// Đăng xuất người dùng
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      firebase.auth().signOut()
        .then(() => {
          localStorage.removeItem("user_session"); // nếu bạn lưu session
          alert("✅ Đã đăng xuất!");
          window.location.href = "login.html";
        })
        .catch(err => {
          console.error("Lỗi khi đăng xuất:", err);
          alert("❌ Không thể đăng xuất.");
        });
    });
  }
});
