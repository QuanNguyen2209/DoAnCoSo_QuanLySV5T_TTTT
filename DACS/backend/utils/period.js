// Kiểm tra kỳ xét duyệt có đang nhận hồ sơ hay không (theo trạng thái + ngày, giờ Việt Nam)

// 'YYYY-MM-DD' của hôm nay theo giờ Việt Nam
function todayVN() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

const fmt = (d) => (d ? d.split('-').reverse().join('/') : '');

// ignoreDates: dùng khi SV nộp lại hồ sơ bị yêu cầu bổ sung (chỉ cần kỳ còn 'active')
function periodStatus(ky, { ignoreDates = false } = {}) {
  if (!ky) return { open: false, reason: 'Kỳ xét duyệt không tồn tại' };
  if (ky.trang_thai !== 'active') return { open: false, reason: 'Kỳ xét duyệt này hiện không mở nhận hồ sơ' };
  if (ignoreDates) return { open: true };

  const today = todayVN();
  const start = String(ky.ngay_bat_dau || '').slice(0, 10);
  const end = String(ky.ngay_ket_thuc || '').slice(0, 10);
  if (start && today < start) {
    return { open: false, reason: `Kỳ xét duyệt bắt đầu nhận hồ sơ từ ngày ${fmt(start)}` };
  }
  if (end && today > end) {
    return { open: false, reason: `Kỳ xét duyệt đã hết hạn nộp hồ sơ (hạn chót ${fmt(end)})` };
  }
  return { open: true };
}

module.exports = { todayVN, periodStatus };
