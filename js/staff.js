
const staffCollection = db.collection("staff");

// --- 2. Biến DOM ---
const nameInput = document.getElementById("name");
const positionInput = document.getElementById("position");
const addBtn = document.getElementById("addBtn");
const staffTable = document.getElementById("staffList");
const searchInput = document.getElementById("search1");
const positionFilter = document.getElementById("positionFilter");

let staffList = []; // Danh sách nhân viên từ Firestore

// --- 3. Load dữ liệu từ Firestore ---
function loadStaffFromFirestore() {
  staffCollection.get()
    .then((querySnapshot) => {
      staffList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        staffList.push({ ...data, id: doc.id });
      });
      populatePositionFilter();
      applyFiltersAndRender();
    })
    .catch((error) => console.error("Lỗi khi load nhân viên:", error));
}

// --- 4. Thêm nhân viên ---
addBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const position = positionInput.value.trim();
  if (!name || !position) {
    alert("Vui lòng nhập cả Họ tên và Chức vụ.");
    return;
  }

  staffCollection.add({ name, position })
    .then(() => {
      nameInput.value = "";
      positionInput.value = "";
      loadStaffFromFirestore();
    })
    .catch((error) => {
      console.error("Lỗi khi thêm nhân viên:", error);
      alert("Không thể thêm nhân viên. Vui lòng thử lại.");
    });
});

// --- 5. Hiển thị dữ liệu ra bảng ---
function renderTable(data) {
  staffTable.innerHTML = "";
  data.forEach((staff, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td data-label="name">${staff.name}</td>
      <td data-label="position">${staff.position}</td>
      <td>
        <button class="action-btn btn-edit">Sửa</button>
        <button class="action-btn btn-delete">Xóa</button>
      </td>
    `;

    const editBtn = row.querySelector(".btn-edit");
    const deleteBtn = row.querySelector(".btn-delete");

    editBtn.addEventListener("click", () => enterEditMode(row, staff));
    deleteBtn.addEventListener("click", () => deleteStaff(staff));

    staffTable.appendChild(row);
  });
}

// --- 6. Xóa nhân viên ---
function deleteStaff(staff) {
  if (confirm(`Bạn có chắc muốn xóa nhân viên "${staff.name}"?`)) {
    staffCollection.doc(staff.id).delete()
      .then(() => loadStaffFromFirestore())
      .catch((error) => console.error("Lỗi khi xóa:", error));
  }
}

// --- 7. Sửa nhân viên ---
function enterEditMode(row, staff) {
  row.innerHTML = "";

  const tdIndex = document.createElement("td");
  tdIndex.textContent = "-";
  row.appendChild(tdIndex);

  const tdNameEdit = document.createElement("td");
  const inputName = document.createElement("input");
  inputName.type = "text";
  inputName.value = staff.name;
  tdNameEdit.appendChild(inputName);
  row.appendChild(tdNameEdit);

  const tdPositionEdit = document.createElement("td");
  const inputPosition = document.createElement("input");
  inputPosition.type = "text";
  inputPosition.value = staff.position;
  tdPositionEdit.appendChild(inputPosition);
  row.appendChild(tdPositionEdit);

  const tdActions = document.createElement("td");

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Lưu";
  saveBtn.className = "action-btn btn-save";
  saveBtn.addEventListener("click", () => {
    const newName = inputName.value.trim();
    const newPosition = inputPosition.value.trim();
    if (!newName || !newPosition) {
      alert("Không được để trống thông tin.");
      return;
    }

    staffCollection.doc(staff.id).update({ name: newName, position: newPosition })
      .then(() => loadStaffFromFirestore())
      .catch((error) => console.error("Lỗi khi cập nhật:", error));
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Hủy";
  cancelBtn.className = "action-btn btn-cancel";
  cancelBtn.addEventListener("click", () => loadStaffFromFirestore());

  tdActions.appendChild(saveBtn);
  tdActions.appendChild(cancelBtn);
  row.appendChild(tdActions);
}

// --- 8. Lọc và tìm kiếm ---
function applyFiltersAndRender() {
  const keyword = searchInput.value.trim().toLowerCase();
  const positionSelected = positionFilter.value;

  let filtered = staffList.filter((s) => s.name.toLowerCase().includes(keyword));
  if (positionSelected) {
    filtered = filtered.filter((s) => s.position === positionSelected);
  }
  renderTable(filtered);
}

searchInput.addEventListener("input", applyFiltersAndRender);
positionFilter.addEventListener("change", applyFiltersAndRender);

// --- 9. Tạo dropdown chức vụ ---
function populatePositionFilter() {
  const positions = Array.from(new Set(staffList.map((s) => s.position))).sort();
  positionFilter.innerHTML = '<option value="">— Chọn chức vụ —</option>';
  positions.forEach((pos) => {
    const opt = document.createElement("option");
    opt.value = pos;
    opt.textContent = pos;
    positionFilter.appendChild(opt);
  });
}

// --- 10. Khởi tạo ---
(function init() {
  loadStaffFromFirestore();
})();
