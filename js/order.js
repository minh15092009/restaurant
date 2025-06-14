document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const db = firebase.firestore();
    const orderList = document.getElementById("order-list");
    if (!orderList) {
      console.error("Không tìm thấy phần tử 'order-list'.");
      return;
    }

    try {
      const snapshot = await db.collection("orders")
        .where("user", "==", user.email)
        .where("paid", "==", false)
        .orderBy("time", "desc")
        .get();

      if (snapshot.empty) {
        orderList.innerHTML = "<p>Chưa có đơn hàng nào.</p>";
        return;
      }

      const groups = {};
      snapshot.docs.forEach(doc => {
        const o = doc.data();
        if (!groups[o.foodId]) {
          groups[o.foodId] = {
            ids: [],
            quantity: 0,
            paid: true,
            firstTime: o.time
          };
        }
        groups[o.foodId].ids.push(doc.id);
        groups[o.foodId].quantity += (o.quantity || 1);
        if (o.paid === false) {
          groups[o.foodId].paid = false;
        }
      });

      const htmlArr = await Promise.all(
        Object.entries(groups).map(async ([foodId, grp]) => {
          let food = null;
          try {
            const foodDoc = await db.collection("foods").doc(foodId).get();
            if (foodDoc.exists) food = foodDoc.data();
          } catch (err) {
            console.warn("Không thể tải món ăn id=", foodId, err);
          }

          const statusText = grp.paid ? "✅ Đã thanh toán" : "❌ Chưa thanh toán";
          const timeStr = grp.firstTime?.toDate
            ? new Date(grp.firstTime.toDate()).toLocaleString("vi-VN")
            : "Không xác định";

          if (!food) {
            return `
              <div class="order-card" id="order-group-${foodId}">
                <p>⚠️ Món đã bị xóa khỏi hệ thống</p>
                <button onclick="deleteOrderGroup('${foodId}')">🗑️ Xóa đơn</button>
              </div>
            `;
          }

          const totalPrice = grp.quantity * (food.price || 0);

          return `
            <div class="order-card" id="order-group-${foodId}">
              <div class="order-card-left">
                <img src="${food.image}" alt="${food.name}" />
              </div>
              <div class="order-card-right">
                <h3>${food.name}</h3>
                <p>Số lượng: <strong>${grp.quantity}</strong></p>
                <p>Giá mỗi món: <strong>${food.price.toLocaleString("vi-VN")}₫</strong></p>
                <p>Tổng tiền: <strong>${totalPrice.toLocaleString("vi-VN")}₫</strong></p>
                <p>Trạng thái: <strong>${statusText}</strong></p>
                <p><small>🕒 ${timeStr}</small></p>
                <button onclick="deleteOrderGroup('${foodId}')">🗑️ Xóa đơn</button>
              </div>
            </div>
          `;
        })
      );

      orderList.innerHTML = htmlArr.join("");

    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      orderList.innerHTML = "<p>⚠️ Có lỗi khi tải đơn hàng. Vui lòng thử lại sau.</p>";

      if (error.message.includes("requires an index")) {
        console.warn("⚠️ Firestore yêu cầu composite index, hãy tạo theo link trong Console.");
      }
    }
  });
});

async function deleteOrderGroup(foodId) {
  if (!confirm("Bạn có chắc muốn xóa tất cả đơn hàng của món này không?")) return;
  const user = firebase.auth().currentUser;
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const db = firebase.firestore();
  try {
    const snap = await db.collection("orders")
      .where("user", "==", user.email)
      .where("foodId", "==", foodId)
      .get();

    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    const el = document.getElementById(`order-group-${foodId}`);
    if (el) el.remove();
  } catch (err) {
    console.error("Xóa order lỗi:", err);
    alert("Không thể xóa đơn hàng. Vui lòng thử lại.");
  }
}

async function payment() {
  const user = firebase.auth().currentUser;
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const db = firebase.firestore();
  const orderList = document.getElementById("order-list");
  if (!orderList) {
    alert("Không thể tìm thấy danh sách đơn hàng.");
    return;
  }

  try {
    const snapshot = await db.collection("orders")
      .where("user", "==", user.email)
      .where("paid", "==", false)
      .orderBy("time", "desc")
      .get();

    if (snapshot.empty) {
      orderList.innerHTML = "<p>Chưa có đơn hàng nào.</p>";
      return;
    }

    const updatePromises = snapshot.docs.map(doc => {
      return db.collection("orders").doc(doc.id).update({
        paid: true,
        paidDate: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await Promise.all(updatePromises);

    alert("Thanh toán thành công!");
    window.location.reload();
  } catch (error) {
    console.error("Lỗi khi cập nhật đơn hàng: ", error);
    alert("Có lỗi xảy ra khi thanh toán, vui lòng thử lại.");
  }
}
