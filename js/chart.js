// js/order-report.js

async function drawOrderChart() {
  try {
    const ordersSnap = await db.collection('orders').get();

    const orderCounts = {};

    ordersSnap.forEach(doc => {
      const data = doc.data();
      let date;

      // Chuẩn hóa ngày từ trường "time"
      if (data.time?.toDate) {
        date = data.time.toDate(); // Firestore Timestamp
      } else if (typeof data.time === 'string') {
        date = new Date(data.time); // ISO string
      } else if (typeof data.time === 'number') {
        date = new Date(data.time); // epoch
      }

      if (!date || isNaN(date)) return;

      const dayStr = date.toISOString().slice(0, 10); // yyyy-mm-dd
      orderCounts[dayStr] = (orderCounts[dayStr] || 0) + 1;
    });

    const sortedDates = Object.keys(orderCounts).sort();
    const labels = sortedDates;
    const values = sortedDates.map(date => orderCounts[date]);

    const ctx = document.getElementById('orderChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Số đơn hàng mỗi ngày',
          data: values,
          fill: false,
          borderColor: '#3498db',
          tension: 0.2,
          pointRadius: 4,
          pointBackgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Ngày'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Số đơn'
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Lỗi khi tạo biểu đồ:", err);
    document.getElementById("orderChart").outerHTML = "<p>❌ Không thể tạo biểu đồ đơn hàng.</p>";
  }
}

drawOrderChart();
