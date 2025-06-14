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
      // Lấy đơn hàng đã thanh toán của user, sắp xếp theo thời gian mới nhất
      const snapshot = await db.collection("orders")
        .where("user", "==", user.email)
        .where("paid", "==", true)
        .orderBy("paidDate", "desc")
        .get();

      if (snapshot.empty) {
        orderList.innerHTML = "<p>Bạn chưa có đơn hàng nào đã thanh toán.</p>";
        return;
      }

      // Gom nhóm đơn theo foodId + thời gian (tách theo từng giờ)
      const groups = {};
      snapshot.docs.forEach(doc => {
        const o = doc.data();
        const paidTime = o.paidDate?.toDate?.();
        if (!paidTime) return;

        const hourKey = `${paidTime.getFullYear()}-${paidTime.getMonth() + 1}-${paidTime.getDate()} ${paidTime.getHours()}:00`;
        const groupKey = `${o.foodId}_${hourKey}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            foodId: o.foodId,
            ids: [],
            quantity: 0,
            paidDate: paidTime,
          };
        }

        groups[groupKey].ids.push(doc.id);
        groups[groupKey].quantity += (o.quantity || 1);
      });

      const htmlArr = await Promise.all(
        Object.entries(groups).map(async ([groupKey, grp]) => {
          let food = null;
          try {
            const foodDoc = await db.collection("foods").doc(grp.foodId).get();
            if (foodDoc.exists) food = foodDoc.data();
          } catch (err) {
            console.warn("Không thể tải món ăn id=", grp.foodId, err);
          }

          const timeStr = grp.paidDate
            ? new Date(grp.paidDate).toLocaleString("vi-VN")
            : "Không xác định";

          if (!food) {
            return `
              <div class="order-card" id="order-group-${groupKey}">
                <p>⚠️ Món đã bị xóa khỏi hệ thống</p>
              </div>
            `;
          }

          const totalPrice = grp.quantity * (food.price || 0);

          return `
            <div class="order-card d-flex border p-3 mb-3" id="order-group-${groupKey}">
              <div class="order-card-left" style="margin-right: 15px;">
                <img src="${food.image}" alt="${food.name}" style="width:80px; height:80px; object-fit:cover;" />
              </div>
              <div class="order-card-right">
                <h3>${food.name}</h3>
                <p>Số lượng: <strong>${grp.quantity}</strong></p>
                <p>Giá mỗi món: <strong>${food.price.toLocaleString("vi-VN")}₫</strong></p>
                <p>Tổng tiền: <strong>${totalPrice.toLocaleString("vi-VN")}₫</strong></p>
                <p><small>🕒 Thanh toán lúc: ${timeStr}</small></p>
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

