// js/admin.js


// Mảng chứa {id, name} nguyên liệu
let ingredientsData = [];

// 1. Khi auth state thay đổi
firebase.auth().onAuthStateChanged(async user => {
  if (!user) {
    window.location = 'login.html';
    return;
  }
  // Chỉ cho admin email
  const adminEmails = ['phamducminh29hp@gmail.com'];
  if (!adminEmails.includes(user.email)) {
    alert('Bạn không có quyền truy cập trang admin!');
    window.location = 'index.html';
    return;
  }

  // Load nguyên liệu và món ăn
  await loadIngredientsData();
  loadAdminFoods();

  // Gắn sự kiện cho nút “+ Thêm nguyên liệu”
  document.getElementById('addIngredientRow')
    .addEventListener('click', () => addIngredientRow());
  // Gắn logout nếu cần xử lý JS
  document.getElementById('btn-logout')
    .addEventListener('click', signOut);
});


// 2. Đọc toàn bộ collection 'ingredients'
async function loadIngredientsData() {
  const snap = await db.collection('ingredients').get();
  ingredientsData = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
}


// 3. Hiển thị/ẩn form thêm món (được gọi inline)
function toggleAddForm() {
  const form = document.getElementById('add-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'block') clearForm();
}


// 4. Thêm 1 dòng gán nguyên liệu (được gọi inline và qua JS)
function addIngredientRow(data = {}) {
  const container = document.getElementById('ingredient-assign-list');
  const row = document.createElement('div');
  row.className = 'ing-row';
  row.innerHTML = `
    <select class="ing-select">
      <option value="">— Chọn nguyên liệu —</option>
      ${ingredientsData.map(i =>
        `<option value="${i.id}" ${i.id===data.id?'selected':''}>${i.name}</option>`
      ).join('')}
    </select>
    <input type="number" class="ing-amt" placeholder="Số lượng" 
           value="${data.amount||''}" min="0" step="any"/>
    <button type="button" title="Xóa" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(row);
}


// 5. Lưu món ăn (được gọi inline)
async function addFood() {
  const name        = document.getElementById('food-name').value.trim();
  const description = document.getElementById('food-description').value.trim();
  const rawPrice    = document.getElementById('food-price').value;
  const price       = parseInt(rawPrice.replace(/\D/g,''),10);
  const fileElem    = document.getElementById('food-image-file');
  const file        = fileElem.files[0];

  if (!name || isNaN(price) || !file) {
    alert('Vui lòng nhập đủ: tên, giá hợp lệ và chọn ảnh.');
    return;
  }

  // Thu thập nguyên liệu
  const ingredients = Array.from(
    document.querySelectorAll('.ing-row')
  ).map(r => {
    const id  = r.querySelector('.ing-select').value;
    const amt = parseFloat(r.querySelector('.ing-amt').value);
    return (id && !isNaN(amt)) ? { id, amount: amt } : null;
  }).filter(x => x);

  try {
    // Upload ảnh lên Cloudinary
    const imageUrl = await uploadToCloudinary(file);
    // Thêm document mới
    await db.collection('foods').add({
      name,
      description,
      price,
      image: imageUrl,
      ingredients,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('✅ Đã thêm món ăn thành công!');
    toggleAddForm();
    loadAdminFoods();
  } catch (err) {
    console.error('Lỗi khi thêm món:', err);
    alert('❌ Thêm món thất bại: ' + err.message);
  }
}


// 6. Load & hiển thị danh sách món ăn
async function loadAdminFoods() {
  const snap = await db.collection('foods')
    .orderBy('createdAt','desc').get();
  const container = document.getElementById('admin-food-list');
  container.innerHTML = '';

  snap.forEach(doc => {
    const f = doc.data();
    const ingHTML = (Array.isArray(f.ingredients) && f.ingredients.length)
      ? '<ul>' + f.ingredients.map(i => {
          const info = ingredientsData.find(x=>x.id===i.id);
          return `<li>${info?info.name:'??'}: ${i.amount}</li>`;
        }).join('') + '</ul>'
      : '<em>Chưa gán nguyên liệu</em>';

    const card = document.createElement('div');
    card.className = 'food-card';
    card.innerHTML = `
      <img src="${f.image}" alt="${f.name}" />
      <h3>${f.name}</h3>
      <p>${f.description}</p>
      <strong>${f.price.toLocaleString()} VNĐ</strong>
      <h4>Nguyên liệu:</h4>
      ${ingHTML}
      <button onclick="deleteFood('${doc.id}')">❌ Xóa món</button>
    `;
    container.appendChild(card);
  });
}


// 7. Xóa món ăn (được gọi inline)
async function deleteFood(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa món ăn này không?')) return;
  try {
    await db.collection('foods').doc(id).delete();
    alert('✅ Đã xóa món ăn.');
    loadAdminFoods();
  } catch (err) {
    console.error(err);
    alert('❌ Lỗi khi xóa món ăn!');
  }
}


// 8. Upload ảnh lên Cloudinary
function uploadToCloudinary(file) {
  const url = 'https://api.cloudinary.com/v1_1/dsreddou4/image/upload';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'minh minh');
  return fetch(url, { method:'POST', body: formData })
    .then(res => res.json())
    .then(data => data.secure_url);
}


// 9. Đăng xuất (được gọi inline)
function signOut() {
  firebase.auth().signOut()
    .then(() => {
      alert('✅ Đã đăng xuất!');
      window.location = 'login.html';
    })
    .catch(err => {
      console.error(err);
      alert('❌ Lỗi khi đăng xuất!');
    });
}
