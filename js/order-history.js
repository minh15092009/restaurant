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
      // Lấy đơn hàng đã thanh toán của user, order by paidDate
      const snapshot = await db.collection("orders")
        .where("user", "==", user.email)
        .where("paid", "==", true)
        .orderBy("paidDate", "desc")
        .get();

      if (snapshot.empty) {
        orderList.innerHTML = "<p>Bạn chưa có đơn hàng nào đã thanh toán.</p>";
        return;
      }

      // Gom nhóm đơn theo foodId
      const groups = {};
      snapshot.docs.forEach(doc => {
        const o = doc.data();
        if (!groups[o.foodId]) {
          groups[o.foodId] = {
            ids: [],
            quantity: 0,
            paidDate: o.paidDate,
            firstTime: o.time
          };
        }
        groups[o.foodId].ids.push(doc.id);
        groups[o.foodId].quantity += (o.quantity || 1);
      });
      debugger
      const htmlArr = await Promise.all(
        Object.entries(groups).map(async ([foodId, grp]) => {
          let food = null;
          try {
            const foodDoc = await db.collection("foods").doc(foodId).get();
            if (foodDoc.exists) food = foodDoc.data();
          } catch (err) {
            console.warn("Không thể tải món ăn id=", foodId, err);
          }

          const timeStr = grp.paidDate?.toDate
            ? new Date(grp.paidDate.toDate()).toLocaleString("vi-VN")
            : "Không xác định";

          if (!food) {
            return `
              <div class="order-card" id="order-group-${foodId}">
                <p>⚠️ Món đã bị xóa khỏi hệ thống</p>
              </div>
            `;
          }

          const totalPrice = grp.quantity * (food.price || 0);

          return `
            <div class="order-card d-flex border p-3 mb-3" id="order-group-${foodId}">
              <div class="order-card-left" style="margin-right: 15px;">
                <img src="${food.image}" alt="${food.name}" style="width:80px; height:80px; object-fit:cover;" />
              </div>
              <div class="order-card-right">
                <h3>${food.name}</h3>
                <p>Số lượng: <strong>${grp.quantity}</strong></p>
                <p>Giá mỗi món: <strong>${food.price.toLocaleString("vi-VN")}₫</strong></p>
                <p>Tổng tiền: <strong>${totalPrice.toLocaleString("vi-VN")}₫</strong></p>
                <p><small>🕒 Thanh toán ngày: ${timeStr}</small></p>
              </div>
            </div>
          `;
        })
      );

      orderList.innerHTML = htmlArr.join("");

    } catch (error) {
      console.error("Lỗi tải lịch sử đơn hàng:", error);
      orderList.innerHTML = "<p>⚠️ Có lỗi khi tải lịch sử đơn hàng. Vui lòng thử lại sau.</p>";

      if (error.message.includes("requires an index")) {
        console.warn("⚠️ Firestore yêu cầu composite index, hãy tạo theo link trong Console.");
      }
    }
  });
});
