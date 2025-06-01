// staff.js

// --- 1. Khai báo biến toàn cục ---
let staffList = []; // mảng lưu trữ đối tượng { name, position }

// Tham chiếu đến các phần tử DOM
const nameInput = document.getElementById("name");
const positionInput = document.getElementById("position");
const addBtn = document.getElementById("addBtn");
const staffTable = document.getElementById("staffList");
const searchInput = document.getElementById("search");
const positionFilter = document.getElementById("positionFilter");

// --- 2. Hàm hỗ trợ lưu / load localStorage ---
function saveToLocalStorage() {
  localStorage.setItem("staffData", JSON.stringify(staffList));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem("staffData");
  if (data) {
    staffList = JSON.parse(data);
  }
}

// --- 3. Hàm dựng dropdown “Chức vụ” dựa trên dữ liệu hiện có ---
function populatePositionFilter() {
  // Lấy danh sách unique chức vụ từ staffList
  const positions = Array.from(new Set(staffList.map((s) => s.position))).sort();
  // Xóa hết option cũ (trừ option mặc định vị trí 0)
  positionFilter.innerHTML = '<option value="">— Chọn chức vụ —</option>';
  positions.forEach((pos) => {
    const opt = document.createElement("option");
    opt.value = pos;
    opt.textContent = pos;
    positionFilter.appendChild(opt);
  });
}

// --- 4. Hàm render lại bảng nhân viên theo mảng data truyền vào ---
function renderTable(data) {
  staffTable.innerHTML = "";
  data.forEach((staff, index) => {
    const row = document.createElement("tr");

    // Cột STT
    const tdIndex = document.createElement("td");
    tdIndex.textContent = index + 1;
    row.appendChild(tdIndex);

    // Cột Họ tên + Chức vụ (với trường hợp edit mode)
    const tdName = document.createElement("td");
    tdName.textContent = staff.name;
    tdName.setAttribute("data-label", "name");
    row.appendChild(tdName);

    const tdPosition = document.createElement("td");
    tdPosition.textContent = staff.position;
    tdPosition.setAttribute("data-label", "position");
    row.appendChild(tdPosition);

    // Cột Hành động: Edit / Delete
    const tdActions = document.createElement("td");

    // Nút Edit
    const editBtn = document.createElement("button");
    editBtn.textContent = "Sửa";
    editBtn.classList.add("action-btn", "btn-edit");
    editBtn.addEventListener("click", () => enterEditMode(row, index));
    tdActions.appendChild(editBtn);

    // Nút Delete
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Xóa";
    deleteBtn.classList.add("action-btn", "btn-delete");
    deleteBtn.addEventListener("click", () => deleteStaff(index));
    tdActions.appendChild(deleteBtn);

    row.appendChild(tdActions);
    staffTable.appendChild(row);
  });
}

// --- 5. Hàm thêm nhân viên mới ---
addBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const position = positionInput.value.trim();
  if (!name || !position) {
    alert("Vui lòng nhập cả Họ tên và Chức vụ.");
    return;
  }

  staffList.push({ name, position });
  nameInput.value = "";
  positionInput.value = "";

  saveToLocalStorage();
  populatePositionFilter();
  applyFiltersAndRender();
});

// --- 6. Hàm xóa nhân viên ---
function deleteStaff(index) {
  if (confirm(`Bạn có chắc muốn xóa nhân viên "${staffList[index].name}"?`)) {
    staffList.splice(index, 1);
    saveToLocalStorage();
    populatePositionFilter();
    applyFiltersAndRender();
  }
}

// --- 7. Hàm chuyển hàng sang “chế độ chỉnh sửa” (Edit Mode) ---
function enterEditMode(row, idx) {
  const staff = staffList[idx];
  row.innerHTML = "";

  // Cột STT
  const tdIndex = document.createElement("td");
  tdIndex.textContent = idx + 1;
  row.appendChild(tdIndex);

  // Cột Họ tên (input)
  const tdNameEdit = document.createElement("td");
  const inputNameEdit = document.createElement("input");
  inputNameEdit.type = "text";
  inputNameEdit.value = staff.name;
  tdNameEdit.appendChild(inputNameEdit);
  row.appendChild(tdNameEdit);

  // Cột Chức vụ (input)
  const tdPositionEdit = document.createElement("td");
  const inputPositionEdit = document.createElement("input");
  inputPositionEdit.type = "text";
  inputPositionEdit.value = staff.position;
  tdPositionEdit.appendChild(inputPositionEdit);
  row.appendChild(tdPositionEdit);

  // Cột Hành động: Save / Cancel
  const tdActionsEdit = document.createElement("td");

  // Nút Save
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Lưu";
  saveBtn.classList.add("action-btn", "btn-save");
  saveBtn.addEventListener("click", () => {
    const newName = inputNameEdit.value.trim();
    const newPosition = inputPositionEdit.value.trim();
    if (!newName || !newPosition) {
      alert("Họ tên và Chức vụ không được để trống.");
      return;
    }
    staffList[idx] = { name: newName, position: newPosition };
    saveToLocalStorage();
    populatePositionFilter();
    applyFiltersAndRender();
  });
  tdActionsEdit.appendChild(saveBtn);

  // Nút Cancel
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Hủy";
  cancelBtn.classList.add("action-btn", "btn-cancel");
  cancelBtn.addEventListener("click", () => applyFiltersAndRender());
  tdActionsEdit.appendChild(cancelBtn);

  row.appendChild(tdActionsEdit);
}

// --- 8. Hàm tìm kiếm & lọc ---
function applyFiltersAndRender() {
  const keyword = searchInput.value.trim().toLowerCase();
  const positionSelected = positionFilter.value;

  // Lọc theo tên
  let filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(keyword)
  );
  // Nếu có chọn chức vụ thì tiếp tục lọc
  if (positionSelected) {
    filtered = filtered.filter((s) => s.position === positionSelected);
  }
  renderTable(filtered);
}

// Bắt sự kiện search
searchInput.addEventListener("input", applyFiltersAndRender);

// Bắt sự kiện chọn chức vụ
positionFilter.addEventListener("change", applyFiltersAndRender);

// --- 9. Khởi tạo khi load trang ---
(function init() {
  loadFromLocalStorage();
  populatePositionFilter();
  renderTable(staffList);
})();
