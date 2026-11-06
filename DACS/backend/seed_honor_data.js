require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/db');

async function seedHonorData() {
  console.log('🚀 Bắt đầu tạo dữ liệu mẫu cho Không Gian 3D Vinh Danh...');

  // 1. Tạo các lớp học mẫu nếu chưa có
  console.log('1️⃣ Kiểm tra / Tạo lớp học...');
  let lopQTKD = null;
  let lopNNA = null;

  const { data: existingLop } = await supabase.from('lop_hoc').select('*');
  const lopMap = new Map((existingLop || []).map(l => [l.ma_lop, l]));

  if (!lopMap.has('QTKD01')) {
    const { data: newLop, error } = await supabase.from('lop_hoc').insert({
      ma_lop: 'QTKD01',
      ten_lop: 'QTKD K22B',
      khoa_id: 3, // Quản trị Kinh doanh
      nien_khoa: '2022-2026',
    }).select().single();
    if (error) console.error('Lỗi tạo lớp QTKD01:', error);
    else lopQTKD = newLop;
  } else {
    lopQTKD = lopMap.get('QTKD01');
  }

  if (!lopMap.has('NNA01')) {
    const { data: newLop, error } = await supabase.from('lop_hoc').insert({
      ma_lop: 'NNA01',
      ten_lop: 'NNA K23A',
      khoa_id: 7, // Tiếng Anh
      nien_khoa: '2023-2027',
    }).select().single();
    if (error) console.error('Lỗi tạo lớp NNA01:', error);
    else lopNNA = newLop;
  } else {
    lopNNA = lopMap.get('NNA01');
  }

  const lopCNTT = lopMap.get('CNTT01') || (existingLop && existingLop[0]);
  const lop23DTHE4 = lopMap.get('23DTHE4') || lopCNTT;

  console.log('✓ Lớp học sẵn sàng:', {
    CNTT: lopCNTT?.id,
    QTKD: lopQTKD?.id,
    NNA: lopNNA?.id,
  });

  // 2. Lấy danh sách kỳ xét duyệt
  console.log('2️⃣ Lấy kỳ xét duyệt...');
  const { data: kyList } = await supabase.from('ky_xet_duyet').select('*');
  if (!kyList || kyList.length === 0) {
    throw new Error('Chưa có kỳ xét duyệt nào trong database!');
  }
  const kyHK1 = kyList.find(k => k.ten_ky.includes('Học kỳ 1')) || kyList[0];
  const kyHK2 = kyList.find(k => k.ten_ky.includes('Học kỳ 2')) || kyList[1] || kyList[0];
  const kyActive = kyList.find(k => k.trang_thai === 'active' || k.ten_ky.includes('SV5T')) || kyList[0];

  // 3. Lấy danh sách tiêu chí mẫu
  console.log('3️⃣ Lấy tiêu chí...');
  const { data: tieuChiList } = await supabase.from('tieu_chi').select('id, ten_tieu_chi');
  const tcDaoDuc = tieuChiList?.find(t => t.ten_tieu_chi.includes('Đạo đức'))?.id || 1;
  const tcHocTap = tieuChiList?.find(t => t.ten_tieu_chi.includes('Học tập'))?.id || 2;
  const tcTheLuc = tieuChiList?.find(t => t.ten_tieu_chi.includes('Thể lực'))?.id || 3;
  const tcTinhNguyen = tieuChiList?.find(t => t.ten_tieu_chi.includes('Tình nguyện'))?.id || 4;
  const tcHoiNhap = tieuChiList?.find(t => t.ten_tieu_chi.includes('Hội nhập'))?.id || 5;

  // 4. Danh sách sinh viên tiêu biểu
  console.log('4️⃣ Tạo / Cập nhật sinh viên mẫu...');
  const passwordHash = await bcrypt.hash('Test1234@', 10);

  const sampleStudents = [
    {
      email: 'nguyenlebaoquan1404@gmail.com',
      ho_ten: 'Nguyễn Lê Nguyên Quân',
      ma_sv: '2380601830',
      lop_id: lopCNTT?.id,
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      twoAwards: true,
    },
    {
      email: 'maianh.tran@sv5t.edu.vn',
      ho_ten: 'Trần Thị Mai Anh',
      ma_sv: '2280601122',
      lop_id: lopQTKD?.id || lopCNTT?.id,
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      twoAwards: true,
    },
    {
      email: 'sinhvien@test.edu.vn',
      ho_ten: 'Sinh Vien Test',
      ma_sv: 'SV_TEST_01',
      lop_id: lopCNTT?.id,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      twoAwards: false,
    },
    {
      email: 'hoangnam.le@sv5t.edu.vn',
      ho_ten: 'Lê Hoàng Nam',
      ma_sv: '2280603344',
      lop_id: lopCNTT?.id,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      twoAwards: false,
    },
    {
      email: 'quynhnga.pham@sv5t.edu.vn',
      ho_ten: 'Phạm Quỳnh Nga',
      ma_sv: '2380605566',
      lop_id: lopNNA?.id || lopCNTT?.id,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      twoAwards: false,
    },
    {
      email: 'minhtri.vo@sv5t.edu.vn',
      ho_ten: 'Võ Minh Trí',
      ma_sv: '2280607788',
      lop_id: lop23DTHE4?.id || lopCNTT?.id,
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      twoAwards: false,
    },
    {
      email: 'thuha.dang@sv5t.edu.vn',
      ho_ten: 'Đặng Thu Hà',
      ma_sv: '2380609900',
      lop_id: lopQTKD?.id || lopCNTT?.id,
      avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      twoAwards: false,
    },
  ];

  const studentUserIds = [];

  for (const s of sampleStudents) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', s.email)
      .maybeSingle();

    let userId = existingUser?.id;

    if (!userId) {
      const { data: newUser, error } = await supabase.from('users').insert({
        email: s.email,
        ho_ten: s.ho_ten,
        ma_sv: s.ma_sv,
        lop_id: s.lop_id,
        avatar_url: s.avatar_url,
        role: 'sinh_vien',
        password_hash: passwordHash,
      }).select().single();

      if (error) {
        console.error('Lỗi tạo user:', s.email, error);
        continue;
      }
      userId = newUser.id;
      console.log(`  + Đã tạo user mới: ${s.ho_ten} (${s.email})`);
    } else {
      await supabase.from('users').update({
        ho_ten: s.ho_ten,
        ma_sv: s.ma_sv,
        lop_id: s.lop_id,
        avatar_url: s.avatar_url,
      }).eq('id', userId);
      console.log(`  ~ Đã cập nhật user: ${s.ho_ten} (${s.email})`);
    }

    studentUserIds.push({ ...s, id: userId });
  }

  // 5. Xoá hồ sơ cũ nếu có để tránh trùng lặp
  console.log('5️⃣ Chuẩn bị hồ sơ xét duyệt vinh danh...');
  const userIds = studentUserIds.map(u => u.id);
  await supabase.from('ho_so').delete().in('sinh_vien_id', userIds);

  // 6. Tạo hồ sơ Approved và Minh chứng mẫu cho từng sinh viên
  console.log('6️⃣ Tạo hồ sơ đạt danh hiệu (Approved) & Minh chứng...');
  let totalHoSo = 0;
  let totalMinhChung = 0;

  for (const stu of studentUserIds) {
    // Nếu có 2 danh hiệu -> tạo 2 hồ sơ ở 2 kỳ khác nhau
    const periodsToAssign = stu.twoAwards ? [kyHK1, kyHK2] : [kyActive || kyHK1];

    for (let i = 0; i < periodsToAssign.length; i++) {
      const ky = periodsToAssign[i];
      const maHoSo = `HS-VD-${stu.ma_sv}-${ky.id}`;
      const approvalDate = new Date(Date.now() - (i === 0 ? 10 : 180) * 86400000).toISOString();

      const { data: hs, error: hsErr } = await supabase.from('ho_so').insert({
        ma_ho_so: maHoSo,
        sinh_vien_id: stu.id,
        ky_xet_duyet_id: ky.id,
        loai_doi_tuong: 'individual',
        trang_thai: 'approved',
        cap_xet_duyet: i === 0 ? 'truong' : 'khoa',
        ngay_nop: new Date(Date.now() - 30 * 86400000).toISOString(),
        ngay_duyet: approvalDate,
        ghi_chu_sv: `Hồ sơ đăng ký danh hiệu Sinh viên 5 Tốt ${ky.ten_ky}`,
      }).select().single();

      if (hsErr) {
        console.error('Lỗi tạo hồ sơ:', maHoSo, hsErr);
        continue;
      }
      totalHoSo++;

      // Tạo minh chứng cho hồ sơ này
      const mcData = [
        {
          ho_so_id: hs.id,
          tieu_chi_id: tcHocTap,
          ten_thanh_tich: 'Điểm GPA 3.82/4.0 - Xếp loại Xuất sắc',
          mo_ta: 'Kết quả học tập xuất sắc toàn khóa, top 5% sinh viên tiêu biểu.',
          cap_thanh_tich: 'truong',
          ngay_ghi_nhan: '2025-06-20',
        },
        {
          ho_so_id: hs.id,
          tieu_chi_id: tcDaoDuc,
          ten_thanh_tich: 'Điểm rèn luyện 96/100 & Đoàn viên Ưu tú',
          mo_ta: 'Gương mẫu trong mọi phong trào rèn luyện đạo đức và kỷ luật trường lớp.',
          cap_thanh_tich: 'khoa',
          ngay_ghi_nhan: '2025-06-25',
        },
        {
          ho_so_id: hs.id,
          tieu_chi_id: tcTheLuc,
          ten_thanh_tich: 'Huy chương Bạc Giải Điền kinh Sinh viên',
          mo_ta: 'Đạt chuẩn thể lực loại Tốt, tham gia tích cực ngày hội thể thao.',
          cap_thanh_tich: 'truong',
          ngay_ghi_nhan: '2025-05-15',
        },
        {
          ho_so_id: hs.id,
          tieu_chi_id: tcTinhNguyen,
          ten_thanh_tich: 'Chiến sĩ Chiến dịch Mùa Hè Xanh',
          mo_ta: 'Hoàn thành xuất sắc 21 ngày tình nguyện xây dựng nông thôn mới.',
          cap_thanh_tich: 'truong',
          ngay_ghi_nhan: '2025-08-10',
        },
        {
          ho_so_id: hs.id,
          tieu_chi_id: tcHoiNhap,
          ten_thanh_tich: 'Chứng chỉ IELTS 7.5 & Hoạt động Giao lưu Quốc tế',
          mo_ta: 'Kỹ năng hội nhập toàn cầu xuất sắc, tham gia hội nghị sinh viên ASEAN.',
          cap_thanh_tich: 'khac',
          ngay_ghi_nhan: '2025-09-05',
        },
      ];

      const { error: mcErr } = await supabase.from('minh_chung').insert(mcData);
      if (mcErr) console.error('Lỗi tạo minh chứng:', mcErr);
      else totalMinhChung += mcData.length;
    }
  }

  // 7. Đảm bảo trạng thái đã được công bố trong config
  console.log('7️⃣ Đảm bảo công bố bảng vinh danh...');
  const config = { published: true, updated_at: new Date().toISOString() };
  await supabase.storage.from('app-config').upload('vinh_danh_config.json', Buffer.from(JSON.stringify(config)), {
    upsert: true,
    contentType: 'application/json',
  });

  console.log(`\n🎉 HOÀN THÀNH TẠO DỮ LIỆU MẪU!`);
  console.log(`- Tổng sinh viên tiêu biểu: ${studentUserIds.length}`);
  console.log(`- Tổng hồ sơ Approved: ${totalHoSo}`);
  console.log(`- Tổng minh chứng đạt chuẩn: ${totalMinhChung}`);
  console.log(`- Trạng thái công bố: ĐÃ CÔNG BỐ (published = true)`);
}

seedHonorData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Lỗi chạy seed:', err);
    process.exit(1);
  });
