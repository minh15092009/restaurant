function loadFoods() {
  db.collection("foods").get().then(snapshot => {
    let html = "";
    snapshot.forEach(doc => {
      const food = doc.data();
      const foodId = doc.id;
      html += `
        <div class="food-card" id="food-${foodId}">
          <img src="${food.image}" alt="${food.name}" />
          <h3>${food.name}</h3>
          <p>${food.description}</p>
          <strong>${food.price} VNĐ</strong><br/>
          <button onclick="showOrderForm('${foodId}')">🛒 Mua món</button>

          <div id="order-form-${foodId}" class="order-form" style="display:none; margin-top:10px;">
            <label for="qty-${foodId}">Số lượng:</label>
            <input type="number" id="qty-${foodId}" value="1" min="1" style="width: 60px;" />
            <button onclick="confirmOrder('${foodId}')">✅ Xác nhận</button>
            <button onclick="hideOrderForm('${foodId}')">❌ Hủy</button>
          </div>

          <p id="order-status-${foodId}" style="color: green;"></p>
        </div>
      `;
    });
    document.getElementById("food-list").innerHTML = html;
  });
}

function showOrderForm(foodId) {
  document.getElementById(`order-form-${foodId}`).style.display = "block";
  document.getElementById(`order-status-${foodId}`).innerText = "";
}

function hideOrderForm(foodId) {
  document.getElementById(`order-form-${foodId}`).style.display = "none";
}

async function confirmOrder(foodId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Bạn cần đăng nhập!");
    return window.location.href = "login.html";
  }

  const quantity = parseInt(document.getElementById(`qty-${foodId}`).value);
  if (isNaN(quantity) || quantity <= 0) {
    return alert("Vui lòng nhập số lượng hợp lệ.");
  }

  try {
    await db.collection("orders").add({
      user: user.email,
      foodId: foodId,
      quantity: quantity,
      paid: false,
      time: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById(`order-status-${foodId}`).innerText = "✅ Đặt món thành công!";
    hideOrderForm(foodId);

  } catch (error) {
    console.error("Lỗi khi đặt món:", error);
    alert("❌ Đặt món thất bại. Vui lòng thử lại.");
  }
}

function searchFoods() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const cards = document.querySelectorAll(".food-card");
  cards.forEach(card => {
    const name = card.querySelector("h3").innerText.toLowerCase();
    card.style.display = name.includes(keyword) ? "block" : "none";
  });
}

firebase.auth().onAuthStateChanged(user => {
  if (user) loadFoods();
  else window.location.href = "login.html";
});

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      firebase.auth().signOut()
        .then(() => {
          localStorage.removeItem("user_session");
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

// script.js
const items = document.querySelectorAll('.carousel-item');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
let current = 0;

function showSlide(index) {
  items.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
}

function nextSlide() {
  current = (current + 1) % items.length;
  showSlide(current);
}

function prevSlide() {
  current = (current - 1 + items.length) % items.length;
  showSlide(current);
}

nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// Auto slide
setInterval(nextSlide, 5000);
