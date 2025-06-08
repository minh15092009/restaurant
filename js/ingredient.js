// js/ingredient.js

// Sử dụng db đã khởi tạo trong firebase-config.js
const ingredientCollection = db.collection("ingredients");

const nameInput       = document.getElementById("ingredientName");
const unitInput       = document.getElementById("ingredientUnit");
const unitPriceInput  = document.getElementById("ingredientUnitPrice");
const addBtn          = document.getElementById("addIngredientBtn");
const ingredientTable = document.getElementById("ingredientList");

let ingredientList = [];

// Load nguyên liệu từ Firestore
function loadIngredients() {
  ingredientCollection.get()
    .then(snapshot => {
      ingredientList = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        ingredientList.push({ ...data, id: doc.id });
      });
      renderIngredientTable(ingredientList);
    })
    .catch(err => console.error("Lỗi khi load nguyên liệu:", err));
}

// Thêm nguyên liệu mới
addBtn.addEventListener("click", () => {
  const name      = nameInput.value.trim();
  const unit      = unitInput.value.trim();
  const unitPrice = parseFloat(unitPriceInput.value);

  if (!name || !unit || isNaN(unitPrice)) {
    alert("Vui lòng nhập đầy đủ: tên, đơn vị và giá nhập hợp lệ.");
    return;
  }

  ingredientCollection.add({ name, unit, unitPrice })
    .then(() => {
      nameInput.value = "";
      unitInput.value = "";
      unitPriceInput.value = "";
      loadIngredients();
    })
    .catch(err => console.error("Lỗi khi thêm nguyên liệu:", err));
});

// Hiển thị danh sách nguyên liệu
function renderIngredientTable(data) {
  ingredientTable.innerHTML = "";
  data.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.unit}</td>
      <td>${Number(item.unitPrice).toLocaleString()} VNĐ</td>
      <td>
        <button class="btn-edit"   onclick="editIngredient('${item.id}')">Sửa</button>
        <button class="btn-delete" onclick="deleteIngredient('${item.id}')">Xóa</button>
      </td>
    `;
    ingredientTable.appendChild(row);
  });
}

// Xóa nguyên liệu
function deleteIngredient(id) {
  if (confirm("Bạn có chắc chắn muốn xóa nguyên liệu này?")) {
    ingredientCollection.doc(id).delete()
      .then(() => loadIngredients())
      .catch(err => console.error("Lỗi khi xóa:", err));
  }
}

// Sửa nguyên liệu
function editIngredient(id) {
  const ing = ingredientList.find(item => item.id === id);
  if (!ing) return;

  const newName      = prompt("Tên nguyên liệu:", ing.name);
  const newUnit      = prompt("Đơn vị:", ing.unit);
  const newUnitPrice = parseFloat(prompt("Giá nhập (VNĐ):", ing.unitPrice));

  if (!newName || !newUnit || isNaN(newUnitPrice)) {
    alert("Thông tin không hợp lệ.");
    return;
  }

  ingredientCollection.doc(id).update({
    name: newName,
    unit: newUnit,
    unitPrice: newUnitPrice
  })
    .then(() => loadIngredients())
    .catch(err => console.error("Lỗi khi cập nhật:", err));
}

// Khởi tạo
loadIngredients();
