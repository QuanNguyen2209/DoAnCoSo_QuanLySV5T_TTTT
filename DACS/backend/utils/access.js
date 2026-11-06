// Kiểm tra quyền truy cập dữ liệu theo vai trò + quyền sở hữu
const supabase = require('../config/db');
const { HttpError, requireId } = require('./http');

const STAFF_ROLES = ['admin', 'can_bo'];
const EDITABLE_STATES = ['draft', 'rejected']; // Hồ sơ còn được sửa / nộp lại

const isAdmin = (user) => user?.role === 'admin';
const isStaff = (user) => STAFF_ROLES.includes(user?.role);

// Danh sách lớp được phân công cho cán bộ
async function getAssignedLopIds(reviewerId) {
  const { data, error } = await supabase
    .from('reviewer_assignments')
    .select('lop_id')
    .eq('reviewer_id', reviewerId);
  if (error) throw error;
  return (data || []).map((a) => a.lop_id);
}

// Cán bộ có được phân công lớp của sinh viên này không?
async function isReviewerOfStudent(reviewerId, studentId) {
  const { data: stu, error } = await supabase
    .from('users')
    .select('lop_id')
    .eq('id', studentId)
    .maybeSingle();
  if (error) throw error;
  if (!stu?.lop_id) return false;

  const { data: asg, error: aErr } = await supabase
    .from('reviewer_assignments')
    .select('id')
    .eq('reviewer_id', reviewerId)
    .eq('lop_id', stu.lop_id)
    .maybeSingle();
  if (aErr) throw aErr;
  return !!asg;
}

// Quyền xem dữ liệu (hồ sơ, PDF...) của 1 sinh viên:
// chính chủ, admin, hoặc cán bộ được phân công lớp của SV đó
async function canViewStudentData(user, studentId) {
  if (!user || !studentId) return false;
  if (Number(studentId) === Number(user.id)) return true;
  if (isAdmin(user)) return true;
  if (user.role === 'can_bo') return isReviewerOfStudent(user.id, studentId);
  return false;
}

async function assertCanViewStudentData(user, studentId) {
  const ok = await canViewStudentData(user, studentId);
  if (!ok) throw new HttpError(403, 'Bạn không có quyền truy cập hồ sơ này');
}

// Lấy hồ sơ và đảm bảo người dùng là chủ sở hữu (hoặc admin).
// editable=true: hồ sơ phải còn ở trạng thái draft / rejected.
async function loadOwnHoSo(hoSoId, user, { editable = false, select } = {}) {
  const id = requireId(hoSoId, 'Mã hồ sơ');
  const { data: hoSo, error } = await supabase
    .from('ho_so')
    .select(select || 'id, sinh_vien_id, trang_thai, loai_doi_tuong, ky_xet_duyet_id')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!hoSo) throw new HttpError(404, 'Hồ sơ không tồn tại');

  if (hoSo.sinh_vien_id !== user.id && !isAdmin(user)) {
    throw new HttpError(403, 'Bạn không có quyền thao tác trên hồ sơ này');
  }
  if (editable && !EDITABLE_STATES.includes(hoSo.trang_thai)) {
    throw new HttpError(400, 'Hồ sơ đã nộp hoặc đã được xét duyệt, không thể chỉnh sửa');
  }
  return hoSo;
}

module.exports = {
  STAFF_ROLES,
  EDITABLE_STATES,
  isAdmin,
  isStaff,
  getAssignedLopIds,
  isReviewerOfStudent,
  canViewStudentData,
  assertCanViewStudentData,
  loadOwnHoSo,
};
