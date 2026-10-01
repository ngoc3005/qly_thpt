const state = {
  page: "dashboard",
  meta: null,
  editing: null,
};

const titles = {
  dashboard: ["Tổng quan", "Thống kê nhanh hệ thống"],
  teachers: ["Giáo viên", "Quản lý danh sách giáo viên"],
  classes: ["Lớp học", "Quản lý lớp và giáo viên chủ nhiệm"],
  students: ["Học sinh", "Quản lý hồ sơ học sinh"],
  subjects: ["Môn học", "Danh mục môn và số tiết"],
  grades: ["Điểm số", "Nhập và theo dõi điểm"],
  schedules: ["Thời khóa biểu", "Xếp tiết học theo lớp"],
  exams: ["Lịch thi", "Quản lý lịch thi theo khối"],
};

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
  return data;
}

function $(sel) { return document.querySelector(sel); }
function showToast(msg, isError = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("error", isError);
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2800);
}

function optionList(map, selected = "") {
  return Object.entries(map || {})
    .map(([k, v]) => `<option value="${k}" ${k === (selected || "") ? "selected" : ""}>${v}</option>`)
    .join("");
}

function openModal(title, fieldsHtml, onSubmit) {
  $("#modal-title").textContent = title;
  $("#modal-form").innerHTML = fieldsHtml;
  $("#modal").classList.remove("hidden");
  $("#modal-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    // multi-select
    const multi = e.target.querySelectorAll("select[multiple]");
    multi.forEach((sel) => {
      payload[sel.name] = Array.from(sel.selectedOptions).map((o) => Number(o.value));
    });
    try {
      await onSubmit(payload);
      closeModal();
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
  };
}

function closeModal() {
  $("#modal").classList.add("hidden");
  state.editing = null;
}

function table(headers, rows) {
  return `
    <div class="panel">
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${headers.length}">Chưa có dữ liệu.</td></tr>`}</tbody>
      </table>
    </div>`;
}

async function renderDashboard() {
  const stats = await api("/stats");
  $("#btn-add").classList.add("hidden");
  $("#view").innerHTML = `
    <div class="stats">
      ${[
        ["Giáo viên", stats.teachers],
        ["Lớp học", stats.classes],
        ["Học sinh", stats.students],
        ["Môn học", stats.subjects],
        ["Bảng điểm", stats.grades],
        ["Lịch thi", stats.exams],
      ].map(([label, value]) => `
        <div class="stat-card">
          <div class="label">${label}</div>
          <div class="value">${value}</div>
        </div>`).join("")}
    </div>
    <div class="panel" style="margin-top:1rem">
      <p>Backend REST API tại <code>/api/*</code>. Frontend SPA được phục vụ tại <code>/</code>.</p>
      <p>Khi deploy Azure, mở domain sẽ tự vào giao diện này.</p>
    </div>`;
}

async function renderSubjects() {
  const items = await api("/subjects");
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => openSubjectForm();
  const rows = items.map((x) => `
    <tr>
      <td>${x.id}</td><td>${x.name}</td><td>${x.so_tiet}</td>
      <td class="actions">
        <button class="btn small ghost" onclick='openSubjectForm(${JSON.stringify(x)})'>Sửa</button>
        <button class="btn small danger" onclick="removeItem('/subjects/${x.id}')">Xóa</button>
      </td>
    </tr>`).join("");
  $("#view").innerHTML = table(["#", "Tên môn", "Số tiết", ""], rows);
}

function openSubjectForm(item = null) {
  state.editing = item;
  openModal(item ? "Sửa môn học" : "Thêm môn học", `
    <label class="full">Tên môn<input name="name" required value="${item?.name || ""}"></label>
    <label>Số tiết<input type="number" min="1" name="so_tiet" required value="${item?.so_tiet || 2}"></label>
  `, async (payload) => {
    payload.so_tiet = Number(payload.so_tiet);
    if (item) await api(`/subjects/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/subjects", { method: "POST", body: JSON.stringify(payload) });
    showToast("Đã lưu môn học");
  });
}

async function renderTeachers() {
  const [items, subjects] = await Promise.all([api("/teachers"), api("/subjects")]);
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => openTeacherForm(null, subjects);
  const rows = items.map((x) => `
    <tr>
      <td><span class="badge">${x.teacher_code || "-"}</span></td>
      <td>${x.name}</td>
      <td>${state.meta.gender[x.gender] || "-"}</td>
      <td>${x.phone || "-"}</td>
      <td>${(x.subjects || []).join(", ") || "-"}</td>
      <td class="actions">
        <button class="btn small ghost" onclick='openTeacherForm(${JSON.stringify(x)}, null)'>Sửa</button>
        <button class="btn small danger" onclick="removeItem('/teachers/${x.id}')">Xóa</button>
      </td>
    </tr>`).join("");
  $("#view").innerHTML = table(["Mã GV", "Họ tên", "Giới tính", "SĐT", "Môn dạy", ""], rows);
  window.__subjectsCache = subjects;
}

async function openTeacherForm(item = null, subjects = null) {
  subjects = subjects || window.__subjectsCache || await api("/subjects");
  const selected = new Set(item?.subject_ids || []);
  openModal(item ? "Sửa giáo viên" : "Thêm giáo viên", `
    <label>Họ tên<input name="name" required value="${item?.name || ""}"></label>
    <label>Năm sinh<input type="number" name="birth_year" value="${item?.birth_year || ""}"></label>
    <label>Giới tính<select name="gender"><option value="">--</option>${optionList(state.meta.gender, item?.gender)}</select></label>
    <label>SĐT<input name="phone" value="${item?.phone || ""}"></label>
    <label class="full">Email<input name="email" value="${item?.email || ""}"></label>
    <label class="full">Địa chỉ<textarea name="address">${item?.address || ""}</textarea></label>
    <label class="full">Môn dạy
      <select name="subject_ids" multiple size="5">
        ${subjects.map((s) => `<option value="${s.id}" ${selected.has(s.id) ? "selected" : ""}>${s.name}</option>`).join("")}
      </select>
    </label>
  `, async (payload) => {
    if (payload.birth_year) payload.birth_year = Number(payload.birth_year);
    if (!Array.isArray(payload.subject_ids)) payload.subject_ids = [];
    if (item) await api(`/teachers/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/teachers", { method: "POST", body: JSON.stringify(payload) });
    showToast("Đã lưu giáo viên");
  });
}

async function renderClasses() {
  const [items, teachers] = await Promise.all([api("/classes"), api("/teachers")]);
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => openClassForm(null, teachers);
  const rows = items.map((x) => `
    <tr>
      <td>${x.name}</td>
      <td>${state.meta.grade[x.grade] || x.grade}</td>
      <td>${x.academic_year}</td>
      <td>${x.homeroom_teacher || "-"}</td>
      <td>${x.size}</td>
      <td class="actions">
        <button class="btn small ghost" onclick='openClassForm(${JSON.stringify(x)}, null)'>Sửa</button>
        <button class="btn small danger" onclick="removeItem('/classes/${x.id}')">Xóa</button>
      </td>
    </tr>`).join("");
  $("#view").innerHTML = table(["Tên lớp", "Khối", "Năm học", "GVCN", "Sĩ số", ""], rows);
  window.__teachersCache = teachers;
}

async function openClassForm(item = null, teachers = null) {
  teachers = teachers || window.__teachersCache || await api("/teachers");
  openModal(item ? "Sửa lớp" : "Thêm lớp", `
    <label>Tên lớp<input name="name" required value="${item?.name || ""}" placeholder="10A1"></label>
    <label>Khối<select name="grade" required>${optionList(state.meta.grade, item?.grade || "10")}</select></label>
    <label>Năm học<input name="academic_year" required value="${item?.academic_year || "2024-2025"}"></label>
    <label>GVCN
      <select name="homeroom_teacher_id">
        <option value="">--</option>
        ${teachers.map((t) => `<option value="${t.id}" ${item?.homeroom_teacher_id === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
      </select>
    </label>
  `, async (payload) => {
    if (payload.homeroom_teacher_id) payload.homeroom_teacher_id = Number(payload.homeroom_teacher_id);
    else delete payload.homeroom_teacher_id;
    if (item) await api(`/classes/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/classes", { method: "POST", body: JSON.stringify(payload) });
    showToast("Đã lưu lớp học");
  });
}

async function renderStudents() {
  const [items, classes] = await Promise.all([api("/students"), api("/classes")]);
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => openStudentForm(null, classes);
  const rows = items.map((x) => `
    <tr>
      <td><span class="badge">${x.student_code || "-"}</span></td>
      <td>${x.name}</td>
      <td>${x.class_name || "-"}</td>
      <td>${state.meta.ban_hoc[x.ban_hoc] || x.ban_hoc}</td>
      <td>${state.meta.status[x.status] || x.status}</td>
      <td>${x.average_year}</td>
      <td class="actions">
        <button class="btn small ghost" onclick='openStudentForm(${JSON.stringify(x)}, null)'>Sửa</button>
        <button class="btn small danger" onclick="removeItem('/students/${x.id}')">Xóa</button>
      </td>
    </tr>`).join("");
  $("#view").innerHTML = table(["Mã HS", "Họ tên", "Lớp", "Ban", "Trạng thái", "TB năm", ""], rows);
  window.__classesCache = classes;
}

async function openStudentForm(item = null, classes = null) {
  classes = classes || window.__classesCache || await api("/classes");
  openModal(item ? "Sửa học sinh" : "Thêm học sinh", `
    <label>Họ tên<input name="name" required value="${item?.name || ""}"></label>
    <label>Ngày sinh<input type="date" name="birth_date" value="${item?.birth_date || ""}"></label>
    <label>Giới tính<select name="gender"><option value="">--</option>${optionList({ male: "Nam", female: "Nữ" }, item?.gender)}</select></label>
    <label>Lớp
      <select name="class_id">
        <option value="">--</option>
        ${classes.map((c) => `<option value="${c.id}" ${item?.class_id === c.id ? "selected" : ""}>${c.name} (${c.academic_year})</option>`).join("")}
      </select>
    </label>
    <label>Ban học<select name="ban_hoc">${optionList(state.meta.ban_hoc, item?.ban_hoc || "tu_nhien")}</select></label>
    <label>SĐT<input name="phone" value="${item?.phone || ""}"></label>
    <label>Hạnh kiểm<select name="conduct"><option value="">--</option>${optionList(state.meta.conduct, item?.conduct)}</select></label>
    <label>Trạng thái<select name="status">${optionList(state.meta.status, item?.status || "studying")}</select></label>
    <label class="full">Địa chỉ<textarea name="address">${item?.address || ""}</textarea></label>
  `, async (payload) => {
    if (payload.class_id) payload.class_id = Number(payload.class_id);
    else delete payload.class_id;
    if (item) await api(`/students/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/students", { method: "POST", body: JSON.stringify(payload) });
    showToast("Đã lưu học sinh");
  });
}

async function renderGrades() {
  const [items, students, subjects] = await Promise.all([
    api("/grades"), api("/students"), api("/subjects"),
  ]);
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => openGradeForm(null, students, subjects);
  const rows = items.map((x) => `
    <tr>
      <td>${x.student_name} <small>(${x.student_code})</small></td>
      <td>${x.subject_name}</td>
      <td>${x.year}</td>
      <td>${x.semester_1_score ?? "-"}</td>
      <td>${x.semester_2_score ?? "-"}</td>
      <td><strong>${x.average_score}</strong></td>
      <td class="actions">
        <button class="btn small ghost" onclick='openGradeForm(${JSON.stringify(x)}, null, null)'>Sửa</button>
        <button class="btn small danger" onclick="removeItem('/grades/${x.id}')">Xóa</button>
      </td>
    </tr>`).join("");
  $("#view").innerHTML = table(["Học sinh", "Môn", "Năm học", "HK1", "HK2", "TB", ""], rows);
  window.__studentsCache = students;
  window.__subjectsCache = subjects;
}

async function openGradeForm(item = null, students = null, subjects = null) {
  students = students || window.__studentsCache || await api("/students");
  subjects = subjects || window.__subjectsCache || await api("/subjects");
  openModal(item ? "Sửa điểm" : "Nhập điểm", `
    <label class="full">Học sinh
      <select name="student_id" required>
        ${students.map((s) => `<option value="${s.id}" ${item?.student_id === s.id ? "selected" : ""}>${s.name} (${s.student_code})</option>`).join("")}
      </select>
    </label>
    <label>Môn học
      <select name="subject_id" required>
        ${subjects.map((s) => `<option value="${s.id}" ${item?.subject_id === s.id ? "selected" : ""}>${s.name}</option>`).join("")}
      </select>
    </label>
    <label>Năm học<input name="year" required value="${item?.year || "2024-2025"}"></label>
    <label>HK1<input type="number" step="0.01" min="0" max="10" name="semester_1_score" value="${item?.semester_1_score ?? ""}"></label>
    <label>HK2<input type="number" step="0.01" min="0" max="10" name="semester_2_score" value="${item?.semester_2_score ?? ""}"></label>
  `, async (payload) => {
    payload.student_id = Number(payload.student_id);
    payload.subject_id = Number(payload.subject_id);
    if (item) await api(`/grades/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/grades", { method: "POST", body: JSON.stringify(payload) });
    showToast("Đã lưu điểm");
  });
}

async function renderSchedules() {
  const [items, classes, subjects, teachers] = await Promise.all([
    api("/schedules"), api("/classes"), api("/subjects"), api("/teachers"),
  ]);
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => openScheduleForm(classes, subjects, teachers);
  const rows = items.map((x) => `
    <tr>
      <td>${x.class_name}</td>
      <td>${state.meta.day[x.day_of_week] || x.day_of_week}</td>
      <td>Tiết ${x.period}</td>
      <td>${x.subject_name}</td>
      <td>${x.teacher_name}</td>
      <td class="actions">
        <button class="btn small danger" onclick="removeItem('/schedules/${x.id}')">Xóa</button>
      </td>
    </tr>`).join("");
  $("#view").innerHTML = table(["Lớp", "Ngày", "Tiết", "Môn", "GV", ""], rows);
}

function openScheduleForm(classes, subjects, teachers) {
  openModal("Thêm tiết học", `
    <label>Lớp<select name="class_id" required>${classes.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select></label>
    <label>Môn<select name="subject_id" required>${subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select></label>
    <label>Giáo viên<select name="teacher_id" required>${teachers.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}</select></label>
    <label>Ngày<select name="day_of_week" required>${optionList(state.meta.day, "monday")}</select></label>
    <label>Tiết
      <select name="period" required>
        ${[1, 2, 3, 4, 5].map((p) => `<option value="${p}">Tiết ${p}</option>`).join("")}
      </select>
    </label>
  `, async (payload) => {
    payload.class_id = Number(payload.class_id);
    payload.subject_id = Number(payload.subject_id);
    payload.teacher_id = Number(payload.teacher_id);
    await api("/schedules", { method: "POST", body: JSON.stringify(payload) });
    showToast("Đã thêm tiết học");
  });
}

async function renderExams() {
  const [items, subjects] = await Promise.all([api("/exams"), api("/subjects")]);
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => openExamForm(null, subjects);
  const rows = items.map((x) => `
    <tr>
      <td>${x.name}</td>
      <td>${x.subject_name}</td>
      <td>${state.meta.grade[x.grade] || x.grade}</td>
      <td>${state.meta.ban_thi[x.ban_thi] || x.ban_thi}</td>
      <td>${x.exam_date || "-"}</td>
      <td>${x.start_time} - ${x.end_time}</td>
      <td class="actions">
        <button class="btn small ghost" onclick='openExamForm(${JSON.stringify(x)}, null)'>Sửa</button>
        <button class="btn small danger" onclick="removeItem('/exams/${x.id}')">Xóa</button>
      </td>
    </tr>`).join("");
  $("#view").innerHTML = table(["Tên", "Môn", "Khối", "Ban", "Ngày", "Giờ", ""], rows);
  window.__subjectsCache = subjects;
}

async function openExamForm(item = null, subjects = null) {
  subjects = subjects || window.__subjectsCache || await api("/subjects");
  openModal(item ? "Sửa lịch thi" : "Thêm lịch thi", `
    <label class="full">Tên lịch thi<input name="name" required value="${item?.name || ""}"></label>
    <label>Môn<select name="subject_id" required>${subjects.map((s) => `<option value="${s.id}" ${item?.subject_id === s.id ? "selected" : ""}>${s.name}</option>`).join("")}</select></label>
    <label>Khối<select name="grade">${optionList(state.meta.grade, item?.grade || "12")}</select></label>
    <label>Ban thi<select name="ban_thi">${optionList(state.meta.ban_thi, item?.ban_thi || "bat_buoc")}</select></label>
    <label>Ngày thi<input type="date" name="exam_date" required value="${item?.exam_date || ""}"></label>
    <label>Bắt đầu<input type="time" name="start_time" required value="${item?.start_time || "07:30"}"></label>
    <label>Kết thúc<input type="time" name="end_time" required value="${item?.end_time || "09:00"}"></label>
  `, async (payload) => {
    payload.subject_id = Number(payload.subject_id);
    if (item) await api(`/exams/${item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/exams", { method: "POST", body: JSON.stringify(payload) });
    showToast("Đã lưu lịch thi");
  });
}

async function removeItem(path) {
  if (!confirm("Bạn chắc chắn muốn xóa?")) return;
  try {
    await api(path, { method: "DELETE" });
    showToast("Đã xóa");
    await render();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function render() {
  const [title, desc] = titles[state.page];
  $("#page-title").textContent = title;
  $("#page-desc").textContent = desc;
  const map = {
    dashboard: renderDashboard,
    teachers: renderTeachers,
    classes: renderClasses,
    students: renderStudents,
    subjects: renderSubjects,
    grades: renderGrades,
    schedules: renderSchedules,
    exams: renderExams,
  };
  try {
    await map[state.page]();
  } catch (err) {
    $("#view").innerHTML = `<div class="panel">Lỗi tải dữ liệu: ${err.message}</div>`;
  }
}

async function init() {
  state.meta = await api("/meta");
  document.querySelectorAll("#nav button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll("#nav button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.page = btn.dataset.page;
      await render();
    });
  });
  $("#modal-close").onclick = closeModal;
  $("#modal-cancel").onclick = closeModal;
  window.openSubjectForm = openSubjectForm;
  window.openTeacherForm = openTeacherForm;
  window.openClassForm = openClassForm;
  window.openStudentForm = openStudentForm;
  window.openGradeForm = openGradeForm;
  window.openExamForm = openExamForm;
  window.removeItem = removeItem;
  await render();
}

init();
