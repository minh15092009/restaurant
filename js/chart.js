
async function drawOrderChart() {
  try {
    const db = firebase.firestore();
    const ordersSnap = await db.collection('orders')
      .where('paid', '==', true)
      .get();

    const orderCounts = {};

    ordersSnap.forEach(doc => {
      const data = doc.data();
      let date;

      // Lấy ngày từ trường "paidDate"
      if (data.paidDate?.toDate) {
        date = data.paidDate.toDate(); // Firestore Timestamp
      } else if (typeof data.paidDate === 'string') {
        date = new Date(data.paidDate);
      } else if (typeof data.paidDate === 'number') {
        date = new Date(data.paidDate);
      }

      if (!date || isNaN(date)) return;

      const dayStr = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
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
          label: 'Số đơn đã thanh toán mỗi ngày',
          data: values,
          fill: false,
          borderColor: '#2ecc71',
          backgroundColor: '#2ecc71',
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#2ecc71'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Ngày'
            },
            ticks: {
              maxRotation: 60,
              minRotation: 30
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Số đơn'
            },
            precision: 0
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
