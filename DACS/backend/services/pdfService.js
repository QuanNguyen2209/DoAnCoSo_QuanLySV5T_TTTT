const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const FONTS_DIR = path.join(__dirname, '..', 'fonts');
const FONT_REGULAR = path.join(FONTS_DIR, 'Times-Regular.ttf');
const FONT_BOLD = path.join(FONTS_DIR, 'Times-Bold.ttf');
const FONT_ITALIC = path.join(FONTS_DIR, 'Times-Italic.ttf');

// Logo path (ảnh cụm logo đã căn chỉnh sẵn)
const IMGS_DIR = path.join(__dirname, '..', '..', 'imgs');
const LOGO_COMBINED = path.join(IMGS_DIR, 'cụm logo.png');
// ──────────────────────────────────────────────────
// Tạo PDFDocument mới với font Times New Roman
// ──────────────────────────────────────────────────
function createDocument() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 60, right: 60 },
    bufferPages: true,
    info: {
      Title: 'Bản Giới Thiệu Thành Tích - Sinh Viên 5 Tốt',
      Author: 'Hệ thống SV5T - HUTECH',
    },
  });

  // Đăng ký font
  doc.registerFont('Times', FONT_REGULAR);
  doc.registerFont('Times-Bold', FONT_BOLD);
  doc.registerFont('Times-Italic', FONT_ITALIC);

  return doc;
}

// ──────────────────────────────────────────────────
// Helper: format ngày dd/MM/yyyy
// ──────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '...............';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '...............';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ──────────────────────────────────────────────────
// Helper: Vẽ dòng label: value (2 cột trên 1 dòng)
// ──────────────────────────────────────────────────
function drawLabelValue(doc, x, y, label, value, options = {}) {
  const { labelWidth = 160, fontSize = 12 } = options;
  doc.font('Times-Italic').fontSize(fontSize).text(label, x, y, { continued: true, width: labelWidth });
  doc.font('Times-Bold').text(` ${value || '...............'}`, { continued: false });
}

// ──────────────────────────────────────────────────
// Helper: Vẽ 2 cặp label-value trên 1 dòng
// ──────────────────────────────────────────────────
function drawTwoColumns(doc, y, label1, value1, label2, value2) {
  const leftX = doc.page.margins.left;
  const midX = 320;

  doc.font('Times-Italic').fontSize(12);
  doc.text(label1, leftX, y);
  doc.font('Times-Bold').text(value1 || '...............', leftX + measureLabel(label1), y);

  doc.font('Times-Italic').text(label2, midX, y);
  doc.font('Times-Bold').text(value2 || '...............', midX + measureLabel(label2), y);
}

function measureLabel(text) {
  // Ước tính chiều rộng label (approximate)
  return Math.max(text.length * 6.5 + 10, 80);
}

// ──────────────────────────────────────────────────
// HEADER: Bản giới thiệu thành tích (với logo)
// ──────────────────────────────────────────────────
function addHeader(doc, namHoc, kyXetDuyet) {
  const centerX = doc.page.width / 2;
  const leftMargin = doc.page.margins.left;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const now = new Date();
  const year = namHoc || now.getFullYear().toString();

  // ── CỤM LOGO (ảnh đã căn chỉnh sẵn, căn giữa trang) ──
  const logoY = 25;
  const logoWidth = 350;  // Chiều rộng hiển thị cụm logo
  const logoX = (doc.page.width - logoWidth) / 2;

  if (fs.existsSync(LOGO_COMBINED)) {
    doc.image(LOGO_COMBINED, logoX, logoY, { width: logoWidth });
  }

  // Di chuyển xuống sau logo (ảnh gốc ~1456x816, ratio ≈ 1.78)
  const logoH = logoWidth / 1.78;
  doc.y = logoY + logoH * 0.55;  // Cắt bớt whitespace phía dưới ảnh

  // Dấu gạch ngang trang trí
  const lineY = doc.y;
  const lineWidth = 80;
  doc.moveTo(centerX - lineWidth / 2, lineY).lineTo(centerX + lineWidth / 2, lineY).lineWidth(1).stroke('#333');

  doc.moveDown(0.8);

  // Tiêu đề chính
  doc.font('Times-Bold').fontSize(18);
  doc.text('BẢN GIỚI THIỆU THÀNH TÍCH', leftMargin, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.2);

  // Phụ đề
  doc.font('Times-Bold').fontSize(13);
  doc.text(`ĐỀ CỬ GIẢI THƯỞNG "SINH VIÊN 5 TỐT ${year}"`, leftMargin, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.2);

  doc.font('Times').fontSize(12);
  doc.text(`TP. HỒ CHÍ MINH - NĂM ${now.getFullYear()}`, leftMargin, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.8);

  // Ngày tháng năm (bên phải)
  doc.font('Times-Italic').fontSize(11);
  const dateText = `TP. Hồ Chí Minh, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`;
  doc.text(dateText, leftMargin, doc.y, { align: 'right', width: pageWidth });

  doc.moveDown(1);
}

// ──────────────────────────────────────────────────
// PHẦN I: LÝ LỊCH TRÍCH NGANG
// ──────────────────────────────────────────────────
function addLyLichTrichNgang(doc, user, profile) {
  const leftMargin = doc.page.margins.left;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const indent = leftMargin + 20;
  const col2X = leftMargin + pageWidth / 2 + 20;

  // Tiêu đề phần I
  doc.font('Times-Bold').fontSize(14);
  doc.text('I. LÝ LỊCH TRÍCH NGANG', leftMargin, doc.y);
  doc.moveDown(0.6);

  const startY = doc.y;
  const lineHeight = 26;
  let row = 0;

  // Hàng 1: Họ tên + Nam/Nữ
  const y1 = startY + lineHeight * row++;
  doc.font('Times-Italic').fontSize(12).text('Họ tên: ', indent, y1, { continued: true });
  doc.font('Times-Bold').text(user?.ho_ten || '...............', { continued: false });
  doc.font('Times-Italic').text('Nam/Nữ: ', col2X, y1, { continued: true });
  doc.font('Times-Bold').text(profile?.gioi_tinh || '...............', { continued: false });

  // Hàng 2: Ngày sinh + Dân tộc
  const y2 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Ngày tháng năm sinh: ', indent, y2, { continued: true });
  doc.font('Times-Bold').text(formatDate(profile?.ngay_sinh), { continued: false });
  doc.font('Times-Italic').text('Dân tộc: ', col2X, y2, { continued: true });
  doc.font('Times-Bold').text(profile?.dan_toc || '...............', { continued: false });

  // Hàng 3: Tôn giáo
  const y3 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Tôn giáo: ', indent, y3, { continued: true });
  doc.font('Times-Bold').text(profile?.ton_giao || 'Không', { continued: false });

  // Hàng 4: Địa chỉ thường trú
  const y4 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Địa chỉ thường trú: ', indent, y4, { continued: true });
  doc.font('Times-Bold').text(profile?.dia_chi_thuong_tru || '...............', { continued: false });

  // Hàng 5: Đơn vị công tác
  const y5 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Đơn vị công tác: ', indent, y5, { continued: true });
  doc.font('Times-Bold').text('HUTECH', { continued: false });

  // Hàng 6: Điện thoại + Email (trên 1 dòng)
  const y6 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Điện thoại liên lạc: ', indent, y6, { continued: true });
  doc.font('Times-Bold').text(profile?.so_dien_thoai || '...............', { continued: false });

  // Hàng 7: Email
  const y7 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Email: ', indent, y7, { continued: true });
  doc.font('Times-Bold').text(user?.email || '...............', { continued: false });

  // Hàng 8: Tên trường
  const y8 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Tên Trường: ', indent, y8, { continued: true });
  doc.font('Times-Bold').text('HUTECH', { continued: false });

  // Hàng 9: Đơn vị Đoàn trực thuộc
  const y9 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Đơn vị Đoàn trực thuộc: ', indent, y9, { continued: true });
  doc.font('Times-Bold').text(profile?.don_vi_doan_truc_thuoc || '...............', { continued: false });

  // Hàng 10: Kết nạp Đoàn + Đảng viên
  const y10 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Kết nạp Đoàn ngày: ', indent, y10, { continued: true });
  doc.font('Times-Bold').text(formatDate(profile?.ngay_ket_nap_doan), { continued: false });
  doc.font('Times-Italic').text('Đảng viên: ', col2X, y10, { continued: true });
  doc.font('Times-Bold').text(profile?.thong_tin_chinh_tri || '...............', { continued: false });

  // Hàng 11: Chức vụ Đoàn - Hội
  const y11 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Chức vụ Đoàn - Hội: ', indent, y11, { continued: true });
  doc.font('Times-Bold').text(profile?.chuc_vu_doan_hoi || '...............', { continued: false });

  // Hàng 12: Trình độ học vấn
  const y12 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Trình độ học vấn: ', indent, y12, { continued: true });
  doc.font('Times-Bold').text(
    profile?.trinh_do_dao_tao ? `${profile.trinh_do_dao_tao} HUTECH` : 'Đại học HUTECH',
    { continued: false }
  );

  // Hàng 13: Điểm tích lũy + Điểm rèn luyện
  const y13 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Điểm tích lũy (GPA): ', indent, y13, { continued: true });
  doc.font('Times-Bold').text(profile?.diem_tich_luy ? String(profile.diem_tich_luy) : '...............', { continued: false });
  doc.font('Times-Italic').text('Điểm rèn luyện: ', col2X, y13, { continued: true });
  doc.font('Times-Bold').text(profile?.diem_ren_luyen ? String(profile.diem_ren_luyen) : '...............', { continued: false });

  // Hàng 14: Ngoại ngữ + Tin học
  const y14 = startY + lineHeight * row++;
  doc.font('Times-Italic').text('Ngoại ngữ: ', indent, y14, { continued: true });
  doc.font('Times-Bold').text(profile?.ngoai_ngu || '...............', { continued: false });
  doc.font('Times-Italic').text('Tin học: ', col2X, y14, { continued: true });
  doc.font('Times-Bold').text(profile?.tin_hoc || '...............', { continued: false });

  doc.y = startY + lineHeight * row + 10;
  doc.moveDown(1);
}

// ──────────────────────────────────────────────────
// PHẦN II: THÀNH TÍCH TIÊU BIỂU
// ──────────────────────────────────────────────────
function addThanhTichTieuBieu(doc, criteriaTree, minhChungList) {
  const leftMargin = doc.page.margins.left;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const indent1 = leftMargin + 10;   // Tiêu chí cha
  const indent2 = leftMargin + 25;   // Tiêu chí con
  const indent3 = leftMargin + 40;   // Mô tả minh chứng

  // Tiêu đề phần II
  doc.font('Times-Bold').fontSize(14);
  doc.text('II. THÀNH TÍCH TIÊU BIỂU', leftMargin, doc.y);
  doc.moveDown(0.6);

  // Tạo map minh chứng theo tieu_chi_id
  const mcMap = {};
  (minhChungList || []).forEach(mc => {
    mcMap[mc.tieu_chi_id] = mc;
  });

  criteriaTree.forEach((parent, pIdx) => {
    // Kiểm tra trang mới nếu quá gần cuối
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }

    const parentNum = pIdx + 1;
    const namHocSuffix = new Date().getFullYear();

    // Tiêu chí cha: "1. HỌC TẬP TỐT 2025"
    doc.moveDown(0.3);
    doc.font('Times-Bold').fontSize(12);
    doc.text(`${parentNum}. ${parent.ten_tieu_chi.toUpperCase()} ${namHocSuffix}`, indent1, doc.y, { width: pageWidth - 30 });
    doc.moveDown(0.3);

    // Tiêu chí con
    const children = parent.children || [];
    children.forEach((child, cIdx) => {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      const childNum = `${parentNum}.${cIdx + 1}`;
      const mc = mcMap[child.id];

      // Tiêu chí con: "1.1. Đề tài tham gia NCKH"
      doc.font('Times-Bold').fontSize(11);
      doc.text(`${childNum}. ${child.ten_tieu_chi.toUpperCase()}`, indent2, doc.y, { width: pageWidth - 50 });

      // Nếu có minh chứng cho tiêu chí này
      if (mc) {
        // Mô tả minh chứng
        if (mc.mo_ta) {
          doc.moveDown(0.15);
          doc.font('Times-Italic').fontSize(11);
          doc.text('Mô tả minh chứng', indent3, doc.y);
          doc.font('Times').fontSize(11);
          doc.text(mc.mo_ta, indent3, doc.y, { width: pageWidth - 80 });
        }

        // File minh chứng
        const files = mc.minh_chung_files || [];
        if (files.length > 0) {
          doc.moveDown(0.15);
          doc.font('Times-Italic').fontSize(11);
          doc.text('minh chứng', indent3, doc.y);
          files.forEach(f => {
            doc.font('Times').fontSize(10);
            doc.text(`• ${f.file_name || 'file đính kèm'}`, indent3 + 10, doc.y, { width: pageWidth - 100 });
          });
        }
      }

      doc.moveDown(0.3);
    });
  });
}

// ──────────────────────────────────────────────────
// FOOTER: Số trang
// ──────────────────────────────────────────────────
function addPageNumbers(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const pageWidth = doc.page.width;
    doc.font('Times').fontSize(9);
    doc.text(
      `Trang ${i + 1} / ${range.count}`,
      0,
      doc.page.height - 35,
      { align: 'center', width: pageWidth }
    );
  }
}

module.exports = {
  createDocument,
  addHeader,
  addLyLichTrichNgang,
  addThanhTichTieuBieu,
  addPageNumbers,
  formatDate,
};
