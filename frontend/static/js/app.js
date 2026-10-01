const state = { user: null, meta: null, page: "dashboard" };

const PAGES = {
  dashboard: ["Tổng quan", "Thống kê nhà trường"],
  teachers: ["Giáo viên", "Quản lý hồ sơ giáo viên"],
  classes: ["Lớp học", "Quản lý lớp và GVCN"],
  students: ["Học sinh", "Hồ sơ học sinh"],
  subjects: ["Môn học", "Danh mục môn học"],
  semesters: ["Học kỳ", "Quản lý học kỳ / năm học"],
  grades: ["Điểm thi", "Nhập và tra cứu điểm"],
  transfers: ["Chuyển lớp", "Lịch sử chuyển lớp"],
  users: ["Tài khoản", "Quản lý tài khoản hệ thống"],
  parent_grades: ["Bảng điểm con", "Phụ huynh tra cứu điểm"],
};

function $(s) { return document.querySelector(s); }

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
  return data;
}

function toast(msg, isError = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("error", isError);
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2800);
}

function opts(map, selected = "") {
  return Object.entries(map || {})
    .map(([k, v]) => `<option value="${k}" ${String(k) === String(selected || "") ? "selected" : ""}>${v}</option>`)
    .join("");
}

function table(headers, rowsHtml) {
  return `<div class="panel"><table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rowsHtml || `<tr><td colspan="${headers.length}">Chưa có dữ liệu.</td></tr>`}</tbody>
  </table></div>`;
}

function closeModal() { $("#modal").classList.add("hidden"); }

function openModal(title, fields, onSubmit) {
  $("#modal-title").textContent = title;
  $("#modal-form").innerHTML = fields;
  $("#modal").classList.remove("hidden");
  $("#modal-form").onsubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    try {
      await onSubmit(payload);
      closeModal();
      await render();
    } catch (err) {
      toast(err.message, true);
    }
  };
}

function navForRole(role) {
  if (role === "parent") return [["parent_grades", "Bảng điểm"]];
  if (role === "teacher") {
    return [
      ["dashboard", "Tổng quan"],
      ["students", "Học sinh"],
      ["grades", "Điểm thi"],
      ["semesters", "Học kỳ"],
      ["classes", "Lớp học"],
    ];
  }
  return [
    ["dashboard", "Tổng quan"],
    ["teachers", "Giáo viên"],
    ["classes", "Lớp học"],
    ["students", "Học sinh"],
    ["subjects", "Môn học"],
    ["semesters", "Học kỳ"],
    ["grades", "Điểm thi"],
    ["transfers", "Chuyển lớp"],
    ["users", "Tài khoản"],
  ];
}

function buildNav() {
  const nav = $("#nav");
  nav.innerHTML = navForRole(state.user.role)
    .map(([id, label]) => `<button data-page="${id}" class="${state.page === id ? "active" : ""}">${label}</button>`)
    .join("");
  nav.querySelectorAll("button").forEach((btn) => {
    btn.onclick = async () => {
      state.page = btn.dataset.page;
      buildNav();
      await render();
    };
  });
}

async function showApp() {
  $("#login-view").classList.add("hidden");
  $("#app-view").classList.remove("hidden");
  $("#user-name").textContent = state.user.full_name;
  $("#user-role").textContent = state.user.role_label;
  state.meta = await api("/meta");
  if (state.user.role === "parent") state.page = "parent_grades";
  buildNav();
  await render();
}

async function renderDashboard() {
  $("#btn-add").classList.add("hidden");
  const s = await api("/stats");
  $("#view").innerHTML = `<div class="stats">${[
    ["Giáo viên", s.teachers], ["Học sinh", s.students], ["Lớp học", s.classes],
    ["Môn học", s.subjects], ["Học kỳ", s.semesters], ["Điểm", s.grades],
    ["Chuyển lớp", s.transfers], ["Tài khoản", s.users],
  ].map(([l, v]) => `<div class="stat-card"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("")}</div>`;
}

async function renderTeachers() {
  const items = await api("/teachers");
  const canEdit = state.user.role === "admin";
  $("#btn-add").classList.toggle("hidden", !canEdit);
  $("#btn-add").onclick = () => formTeacher();
  const rows = items.map((x) => `<tr>
    <td><span class="badge">${x.code || "-"}</span></td><td>${x.name}</td>
    <td>${state.meta.gender[x.gender] || "-"}</td><td>${x.subject_name || "-"}</td>
    <td>${x.phone || "-"}</td>
    <td class="actions">${canEdit ? `
      <button class="btn small ghost" onclick='formTeacher(${JSON.stringify(x)})'>Sửa</button>
      <button class="btn small danger" onclick="removeItem('/teachers/${x.id}')">Xóa</button>` : ""}</td>
  </tr>`).join("");
  $("#view").innerHTML = table(["Mã", "Họ tên", "GT", "Bộ môn", "SĐT", ""], rows);
}

function formTeacher(item = null) {
  openModal(item ? "Sửa giáo viên" : "Thêm giáo viên", `
    <label>Họ tên<input name="name" required value="${item?.name || ""}"></label>
    <label>Giới tính<select name="gender"><option value="">--</option>${opts(state.meta.gender, item?.gender)}</select></label>
    <label>Bộ môn<input name="subject_name" value="${item?.subject_name || ""}"></label>
    <label>SĐT<input name="phone" value="${item?.phone || ""}"></label>
    <label class="full">Email<input name="email" value="${item?.email || ""}"></label>
  `, async (p) => {
    if (item) await api(`/teachers/${item.id}`, { method: "PUT", body: JSON.stringify(p) });
    else await api("/teachers", { method: "POST", body: JSON.stringify(p) });
    toast("Đã lưu giáo viên");
  });
}

async function renderClasses() {
  const [items, teachers] = await Promise.all([api("/classes"), api("/teachers").catch(() => [])]);
  const canEdit = state.user.role === "admin";
  $("#btn-add").classList.toggle("hidden", !canEdit);
  $("#btn-add").onclick = () => formClass(null, teachers);
  window.__teachers = teachers;
  const rows = items.map((x) => `<tr>
    <td>${x.name}</td><td>${state.meta.grade_level[x.grade_level] || x.grade_level}</td>
    <td>${x.academic_year}</td><td>${x.homeroom_teacher || "-"}</td><td>${x.size}</td>
    <td class="actions">${canEdit ? `
      <button class="btn small ghost" onclick='formClass(${JSON.stringify(x)})'>Sửa</button>
      <button class="btn small danger" onclick="removeItem('/classes/${x.id}')">Xóa</button>` : ""}</td>
  </tr>`).join("");
  $("#view").innerHTML = table(["Lớp", "Khối", "Năm học", "GVCN", "Sĩ số", ""], rows);
}

async function formClass(item = null, teachers = null) {
  teachers = teachers || window.__teachers || await api("/teachers");
  openModal(item ? "Sửa lớp" : "Thêm lớp", `
    <label>Tên lớp<input name="name" required value="${item?.name || ""}"></label>
    <label>Khối<select name="grade_level">${opts(state.meta.grade_level, item?.grade_level || "10")}</select></label>
    <label>Năm học<input name="academic_year" required value="${item?.academic_year || "2025-2026"}"></label>
    <label>GVCN<select name="homeroom_teacher_id"><option value="">--</option>
      ${teachers.map((t) => `<option value="${t.id}" ${item?.homeroom_teacher_id === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
    </select></label>
  `, async (p) => {
    if (p.homeroom_teacher_id) p.homeroom_teacher_id = Number(p.homeroom_teacher_id);
    else delete p.homeroom_teacher_id;
    if (item) await api(`/classes/${item.id}`, { method: "PUT", body: JSON.stringify(p) });
    else await api("/classes", { method: "POST", body: JSON.stringify(p) });
    toast("Đã lưu lớp");
  });
}

async function renderStudents() {
  const [items, classes] = await Promise.all([api("/students"), api("/classes")]);
  const canEdit = state.user.role === "admin";
  $("#btn-add").classList.toggle("hidden", !canEdit);
  $("#btn-add").onclick = () => formStudent(null, classes);
  window.__classes = classes;
  const rows = items.map((x) => `<tr>
    <td><span class="badge">${x.code || "-"}</span></td><td>${x.name}</td>
    <td>${x.class_name || "-"}</td><td>${state.meta.ban_hoc[x.ban_hoc] || x.ban_hoc}</td>
    <td>${state.meta.status[x.status] || x.status}</td><td>${x.parent_name || "-"}</td>
    <td class="actions">${canEdit ? `
      <button class="btn small ghost" onclick='formStudent(${JSON.stringify(x)})'>Sửa</button>
      <button class="btn small danger" onclick="removeItem('/students/${x.id}')">Xóa</button>` : ""}</td>
  </tr>`).join("");
  $("#view").innerHTML = table(["Mã", "Họ tên", "Lớp", "Ban", "TT", "PH", ""], rows);
}

async function formStudent(item = null, classes = null) {
  classes = classes || window.__classes || await api("/classes");
  openModal(item ? "Sửa học sinh" : "Thêm học sinh", `
    <label>Họ tên<input name="name" required value="${item?.name || ""}"></label>
    <label>Ngày sinh<input type="date" name="birth_date" value="${item?.birth_date || ""}"></label>
    <label>Giới tính<select name="gender"><option value="">--</option>${opts(state.meta.gender, item?.gender)}</select></label>
    <label>Lớp<select name="class_id"><option value="">--</option>
      ${classes.map((c) => `<option value="${c.id}" ${item?.class_id === c.id ? "selected" : ""}>${c.name}</option>`).join("")}
    </select></label>
    <label>Ban<select name="ban_hoc">${opts(state.meta.ban_hoc, item?.ban_hoc || "tu_nhien")}</select></label>
    <label>Trạng thái<select name="status">${opts(state.meta.status, item?.status || "studying")}</select></label>
    <label>Hạnh kiểm<select name="conduct">${opts(state.meta.conduct, item?.conduct || "tot")}</select></label>
    <label>Phụ huynh<input name="parent_name" value="${item?.parent_name || ""}"></label>
    <label class="full">Địa chỉ<textarea name="address">${item?.address || ""}</textarea></label>
  `, async (p) => {
    if (p.class_id) p.class_id = Number(p.class_id); else delete p.class_id;
    if (item) await api(`/students/${item.id}`, { method: "PUT", body: JSON.stringify(p) });
    else await api("/students", { method: "POST", body: JSON.stringify(p) });
    toast("Đã lưu học sinh");
  });
}

async function renderSubjects() {
  const items = await api("/subjects");
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => formSubject();
  const rows = items.map((x) => `<tr>
    <td>${x.name}</td><td>${x.periods}</td>
    <td class="actions">
      <button class="btn small ghost" onclick='formSubject(${JSON.stringify(x)})'>Sửa</button>
      <button class="btn small danger" onclick="removeItem('/subjects/${x.id}')">Xóa</button>
    </td></tr>`).join("");
  $("#view").innerHTML = table(["Môn", "Số tiết", ""], rows);
}

function formSubject(item = null) {
  openModal(item ? "Sửa môn" : "Thêm môn", `
    <label class="full">Tên môn<input name="name" required value="${item?.name || ""}"></label>
    <label>Số tiết<input type="number" name="periods" min="1" value="${item?.periods || 2}"></label>
  `, async (p) => {
    p.periods = Number(p.periods);
    if (item) await api(`/subjects/${item.id}`, { method: "PUT", body: JSON.stringify(p) });
    else await api("/subjects", { method: "POST", body: JSON.stringify(p) });
    toast("Đã lưu môn học");
  });
}

async function renderSemesters() {
  const items = await api("/semesters");
  const canEdit = state.user.role === "admin";
  $("#btn-add").classList.toggle("hidden", !canEdit);
  $("#btn-add").onclick = () => formSemester();
  const rows = items.map((x) => `<tr>
    <td>${x.name}</td><td>${x.academic_year}</td>
    <td>${x.is_current ? '<span class="badge">Đang áp dụng</span>' : "-"}</td>
    <td class="actions">${canEdit ? `
      <button class="btn small ghost" onclick='formSemester(${JSON.stringify(x)})'>Sửa</button>
      <button class="btn small danger" onclick="removeItem('/semesters/${x.id}')">Xóa</button>` : ""}</td>
  </tr>`).join("");
  $("#view").innerHTML = table(["Học kỳ", "Năm học", "Trạng thái", ""], rows);
}

function formSemester(item = null) {
  openModal(item ? "Sửa học kỳ" : "Thêm học kỳ", `
    <label>Tên<select name="name">
      <option ${item?.name === "Học kỳ 1" ? "selected" : ""}>Học kỳ 1</option>
      <option ${item?.name === "Học kỳ 2" ? "selected" : ""}>Học kỳ 2</option>
    </select></label>
    <label>Năm học<input name="academic_year" required value="${item?.academic_year || "2025-2026"}"></label>
    <label class="full"><span>Đặt làm học kỳ hiện tại</span>
      <select name="is_current"><option value="false">Không</option>
      <option value="true" ${item?.is_current ? "selected" : ""}>Có</option></select>
    </label>
  `, async (p) => {
    p.is_current = p.is_current === "true";
    if (item) await api(`/semesters/${item.id}`, { method: "PUT", body: JSON.stringify(p) });
    else await api("/semesters", { method: "POST", body: JSON.stringify(p) });
    toast("Đã lưu học kỳ");
  });
}

async function renderGrades() {
  const [items, students, subjects, semesters] = await Promise.all([
    api("/grades"), api("/students"), api("/subjects"), api("/semesters"),
  ]);
  const canEdit = ["admin", "teacher"].includes(state.user.role);
  $("#btn-add").classList.toggle("hidden", !canEdit);
  $("#btn-add").onclick = () => formGrade(null, students, subjects, semesters);
  window.__gradeRefs = { students, subjects, semesters };
  const rows = items.map((x) => `<tr>
    <td>${x.student_name}<br><small>${x.student_code || ""}</small></td>
    <td>${x.subject_name}</td><td>${x.semester_name}</td>
    <td>${x.score_mieng ?? "-"}</td><td>${x.score_15p ?? "-"}</td>
    <td>${x.score_1tiet ?? "-"}</td><td>${x.score_thi ?? "-"}</td>
    <td><strong>${x.average ?? "-"}</strong></td>
    <td class="actions">${canEdit ? `
      <button class="btn small ghost" onclick='formGrade(${JSON.stringify(x)})'>Sửa</button>
      <button class="btn small danger" onclick="removeItem('/grades/${x.id}')">Xóa</button>` : ""}</td>
  </tr>`).join("");
  $("#view").innerHTML = table(["HS", "Môn", "HK", "Miệng", "15p", "1 tiết", "Thi", "TB", ""], rows);
}

async function formGrade(item = null, students = null, subjects = null, semesters = null) {
  const refs = window.__gradeRefs || {};
  students = students || refs.students || await api("/students");
  subjects = subjects || refs.subjects || await api("/subjects");
  semesters = semesters || refs.semesters || await api("/semesters");
  openModal(item ? "Sửa điểm" : "Nhập điểm", `
    <label class="full">Học sinh<select name="student_id">${students.map((s) =>
      `<option value="${s.id}" ${item?.student_id === s.id ? "selected" : ""}>${s.name} (${s.code})</option>`).join("")}</select></label>
    <label>Môn<select name="subject_id">${subjects.map((s) =>
      `<option value="${s.id}" ${item?.subject_id === s.id ? "selected" : ""}>${s.name}</option>`).join("")}</select></label>
    <label>Học kỳ<select name="semester_id">${semesters.map((s) =>
      `<option value="${s.id}" ${item?.semester_id === s.id ? "selected" : ""}>${s.name} (${s.academic_year})</option>`).join("")}</select></label>
    <label>Miệng<input type="number" step="0.1" min="0" max="10" name="score_mieng" value="${item?.score_mieng ?? ""}"></label>
    <label>15 phút<input type="number" step="0.1" min="0" max="10" name="score_15p" value="${item?.score_15p ?? ""}"></label>
    <label>1 tiết<input type="number" step="0.1" min="0" max="10" name="score_1tiet" value="${item?.score_1tiet ?? ""}"></label>
    <label>Thi HK<input type="number" step="0.1" min="0" max="10" name="score_thi" value="${item?.score_thi ?? ""}"></label>
  `, async (p) => {
    ["student_id", "subject_id", "semester_id"].forEach((k) => { p[k] = Number(p[k]); });
    if (item) await api(`/grades/${item.id}`, { method: "PUT", body: JSON.stringify(p) });
    else await api("/grades", { method: "POST", body: JSON.stringify(p) });
    toast("Đã lưu điểm");
  });
}

async function renderParentGrades() {
  $("#btn-add").classList.add("hidden");
  const [students, grades] = await Promise.all([api("/students"), api("/grades")]);
  const s = students[0];
  if (!s) {
    $("#view").innerHTML = `<div class="panel">Chưa liên kết học sinh với tài khoản phụ huynh.</div>`;
    return;
  }
  const rows = grades.map((x) => `<tr>
    <td>${x.subject_name}</td><td>${x.semester_name}</td>
    <td>${x.score_mieng ?? "-"}</td><td>${x.score_15p ?? "-"}</td>
    <td>${x.score_1tiet ?? "-"}</td><td>${x.score_thi ?? "-"}</td>
    <td><strong>${x.average ?? "-"}</strong></td>
  </tr>`).join("");
  $("#view").innerHTML = `
    <div class="panel" style="margin-bottom:1rem">
      <strong>${s.name}</strong> · ${s.code || ""} · Lớp ${s.class_name || "-"} · PH: ${s.parent_name || "-"}
    </div>
    ${table(["Môn", "Học kỳ", "Miệng", "15p", "1 tiết", "Thi", "TB"], rows)}`;
}

async function renderTransfers() {
  const [items, students, classes] = await Promise.all([
    api("/transfers"), api("/students"), api("/classes"),
  ]);
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => {
    openModal("Chuyển lớp", `
      <label class="full">Học sinh<select name="student_id">${students.map((s) =>
        `<option value="${s.id}">${s.name} (${s.class_name || "chưa lớp"})</option>`).join("")}</select></label>
      <label>Lớp mới<select name="to_class_id">${classes.map((c) =>
        `<option value="${c.id}">${c.name} - ${c.academic_year}</option>`).join("")}</select></label>
      <label>Ngày<input type="date" name="transfer_date" value="${new Date().toISOString().slice(0, 10)}"></label>
      <label class="full">Lý do<input name="reason" placeholder="Điều chỉnh sĩ số..."></label>
    `, async (p) => {
      p.student_id = Number(p.student_id);
      p.to_class_id = Number(p.to_class_id);
      await api("/transfers", { method: "POST", body: JSON.stringify(p) });
      toast("Đã chuyển lớp");
    });
  };
  const rows = items.map((x) => `<tr>
    <td>${x.student_name}</td><td>${x.from_class || "-"}</td><td>${x.to_class}</td>
    <td>${x.transfer_date || "-"}</td><td>${x.reason || "-"}</td>
  </tr>`).join("");
  $("#view").innerHTML = table(["Học sinh", "Từ lớp", "Sang lớp", "Ngày", "Lý do"], rows);
}

async function renderUsers() {
  const [items, teachers, students] = await Promise.all([
    api("/users"), api("/teachers"), api("/students"),
  ]);
  $("#btn-add").classList.remove("hidden");
  $("#btn-add").onclick = () => formUser(null, teachers, students);
  window.__userRefs = { teachers, students };
  const rows = items.map((x) => `<tr>
    <td>${x.username}</td><td>${x.full_name}</td>
    <td><span class="badge">${x.role_label}</span></td>
    <td>${x.is_active ? "Hoạt động" : "Khóa"}</td>
    <td class="actions">
      <button class="btn small ghost" onclick='formUser(${JSON.stringify(x)})'>Sửa</button>
      <button class="btn small danger" onclick="removeItem('/users/${x.id}')">Xóa</button>
    </td>
  </tr>`).join("");
  $("#view").innerHTML = table(["Username", "Họ tên", "Vai trò", "TT", ""], rows);
}

async function formUser(item = null, teachers = null, students = null) {
  const refs = window.__userRefs || {};
  teachers = teachers || refs.teachers || await api("/teachers");
  students = students || refs.students || await api("/students");
  openModal(item ? "Sửa tài khoản" : "Tạo tài khoản", `
    <label>Username<input name="username" ${item ? "readonly" : "required"} value="${item?.username || ""}"></label>
    <label>Họ tên<input name="full_name" required value="${item?.full_name || ""}"></label>
    <label>Vai trò<select name="role">${opts(state.meta.roles, item?.role || "teacher")}</select></label>
    <label>Mật khẩu<input name="password" type="password" ${item ? "" : "required"} placeholder="${item ? "Để trống nếu giữ nguyên" : ""}"></label>
    <label>Liên kết GV<select name="teacher_id"><option value="">--</option>
      ${teachers.map((t) => `<option value="${t.id}" ${item?.teacher_id === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
    </select></label>
    <label>Liên kết HS (PH)<select name="student_id"><option value="">--</option>
      ${students.map((s) => `<option value="${s.id}" ${item?.student_id === s.id ? "selected" : ""}>${s.name}</option>`).join("")}
    </select></label>
    <label class="full">Trạng thái<select name="is_active">
      <option value="true" ${item?.is_active !== false ? "selected" : ""}>Hoạt động</option>
      <option value="false" ${item?.is_active === false ? "selected" : ""}>Khóa</option>
    </select></label>
  `, async (p) => {
    p.is_active = p.is_active === "true";
    if (p.teacher_id) p.teacher_id = Number(p.teacher_id); else delete p.teacher_id;
    if (p.student_id) p.student_id = Number(p.student_id); else delete p.student_id;
    if (!p.password) delete p.password;
    if (item) await api(`/users/${item.id}`, { method: "PUT", body: JSON.stringify(p) });
    else await api("/users", { method: "POST", body: JSON.stringify(p) });
    toast("Đã lưu tài khoản");
  });
}

async function removeItem(path) {
  if (!confirm("Xác nhận xóa?")) return;
  try {
    await api(path, { method: "DELETE" });
    toast("Đã xóa");
    await render();
  } catch (err) {
    toast(err.message, true);
  }
}

async function render() {
  const [title, desc] = PAGES[state.page] || ["", ""];
  $("#page-title").textContent = title;
  $("#page-desc").textContent = desc;
  const map = {
    dashboard: renderDashboard,
    teachers: renderTeachers,
    classes: renderClasses,
    students: renderStudents,
    subjects: renderSubjects,
    semesters: renderSemesters,
    grades: renderGrades,
    transfers: renderTransfers,
    users: renderUsers,
    parent_grades: renderParentGrades,
  };
  try {
    await map[state.page]();
  } catch (err) {
    $("#view").innerHTML = `<div class="panel">Lỗi: ${err.message}</div>`;
  }
}

async function init() {
  window.formTeacher = formTeacher;
  window.formClass = formClass;
  window.formStudent = formStudent;
  window.formSubject = formSubject;
  window.formSemester = formSemester;
  window.formGrade = formGrade;
  window.formUser = formUser;
  window.removeItem = removeItem;

  $("#modal-close").onclick = closeModal;
  $("#modal-cancel").onclick = closeModal;
  $("#btn-logout").onclick = async () => {
    await api("/auth/logout", { method: "POST" });
    location.reload();
  };

  $("#login-form").onsubmit = async (e) => {
    e.preventDefault();
    $("#login-error").classList.add("hidden");
    try {
      state.user = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: $("#username").value.trim(),
          password: $("#password").value,
        }),
      });
      await showApp();
    } catch (err) {
      $("#login-error").textContent = err.message;
      $("#login-error").classList.remove("hidden");
    }
  };

  const me = await api("/auth/me");
  if (me.user) {
    state.user = me.user;
    await showApp();
  }
}

init();
