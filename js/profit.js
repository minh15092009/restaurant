// js/profit.js

firebase.auth().onAuthStateChanged(user => {
  if (!user) return window.location = 'login.html';
  calculateProfit();
});

async function calculateProfit() {
  const db = firebase.firestore();
  try {
    // Đồng thời lấy 3 collection
    const [ordersSnap, foodsSnap, ingSnap] = await Promise.all([
      db.collection('orders').get(),
      db.collection('foods').get(),
      db.collection('ingredients').get()
    ]);

    // Build map
    const foodMap = {};
    foodsSnap.forEach(d => foodMap[d.id] = d.data());

    const ingMap = {};
    ingSnap.forEach(d => ingMap[d.id] = d.data());

    let totalRevenue = 0, totalCost = 0;

    ordersSnap.forEach(d => {
      const o = d.data();
      const f = foodMap[o.foodId];
      if (!f) return;

      const qty   = Number(o.quantity) || 1;
      const price = Number(f.price)    || 0;
      totalRevenue += price * qty;

      (f.ingredients || []).forEach(ing => {
        const info = ingMap[ing.id];
        // debug:
        console.log('Calc', f.name, 'uses', ing, 'info=', info);
        // fallback unitPrice or quantity
        const unitCost = Number(info?.unitPrice ?? info?.quantity) || 0;
        totalCost += unitCost * (Number(ing.amount) || 0) * qty;
      });
    });

    renderResult(totalRevenue, totalCost, totalRevenue - totalCost);
  } catch (err) {
    console.error('Lỗi tính lãi/lỗ:', err);
    document.getElementById('profit-result').innerText = '⚠️ Lỗi tính toán.';
  }
}

function renderResult(rev, cost, profit) {
  const div = document.getElementById('profit-result');
  const cls = profit>=0 ? 'profit-positive' : 'profit-negative';
  const label = profit>=0 ? 'Lợi nhuận' : 'Lỗ';
  div.innerHTML = `
    <p><strong>Doanh thu:</strong> ${rev.toLocaleString()} VNĐ</p>
    <p><strong>Chi phí NL:</strong> ${cost.toLocaleString()} VNĐ</p>
    <p><strong>${label}:</strong>
       <span class="${cls}">${profit.toLocaleString()} VNĐ</span>
    </p>
  `;
}
