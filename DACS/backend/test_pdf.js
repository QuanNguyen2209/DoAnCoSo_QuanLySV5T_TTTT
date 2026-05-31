const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

function fetchJSON(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function fetchBinary(endpoint, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          contentDisposition: res.headers['content-disposition'],
          size: buf.length,
          buffer: buf,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testPDF() {
  console.log('=== TEST XUẤT PDF ===\n');

  // 1. Đăng nhập để lấy token
  console.log('[1] Đăng nhập...');
  const loginRes = await fetchJSON('/auth/login', 'POST', {
    email: 'sv1@hutech.edu.vn',
    password: '123456',
  });

  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    console.log('❌ Không đăng nhập được. Thử tài khoản khác...');
    
    // Thử đăng ký mới
    const regRes = await fetchJSON('/auth/register', 'POST', {
      email: 'testpdf@hutech.edu.vn',
      password: 'Password123!',
      ho_ten: 'Test PDF User',
      vai_tro: 'sinh_vien',
    });
    console.log('  Đăng ký:', regRes.status, regRes.data?.success ? '✓' : '✗');

    const login2 = await fetchJSON('/auth/login', 'POST', {
      email: 'testpdf@hutech.edu.vn',
      password: 'Password123!',
    });
    if (!login2.data?.data?.token) {
      console.log('❌ Vẫn không đăng nhập được. Bỏ qua test.');
      return;
    }
    var token = login2.data.data.token;
    console.log('✓ Đăng nhập OK (testpdf)\n');
  } else {
    var token = loginRes.data.data.token;
    console.log('✓ Đăng nhập OK (sv1)\n');
  }

  // 2. Lấy danh sách hồ sơ
  console.log('[2] Lấy danh sách hồ sơ...');
  const hsRes = await fetchJSON('/ho-so', 'GET', null, token);
  const hoSoList = hsRes.data?.data || [];
  console.log(`✓ Tìm thấy ${hoSoList.length} hồ sơ\n`);

  if (hoSoList.length === 0) {
    console.log('⚠️  Không có hồ sơ nào. Tạo hồ sơ trước rồi test.');
    console.log('   Tuy nhiên, tôi sẽ test API với ID=1 xem phản hồi...');
    
    const pdfRes = await fetchBinary('/pdf/ho-so/1', token);
    console.log(`\n[3] Test API /pdf/ho-so/1:`);
    console.log(`  Status: ${pdfRes.status}`);
    console.log(`  Content-Type: ${pdfRes.contentType}`);
    console.log(`  Size: ${pdfRes.size} bytes`);
    
    if (pdfRes.status === 200 && pdfRes.contentType === 'application/pdf') {
      fs.writeFileSync('test_api_output.pdf', pdfRes.buffer);
      console.log('  ✓ PDF xuất thành công → test_api_output.pdf');
    } else {
      console.log('  Response:', pdfRes.buffer.toString('utf-8').substring(0, 200));
    }
    return;
  }

  // 3. Xuất PDF cho hồ sơ đầu tiên
  const firstHoSo = hoSoList[0];
  console.log(`[3] Xuất PDF cho hồ sơ ID=${firstHoSo.id} (${firstHoSo.ma_ho_so})...`);

  const pdfRes = await fetchBinary(`/pdf/ho-so/${firstHoSo.id}`, token);
  console.log(`  Status: ${pdfRes.status}`);
  console.log(`  Content-Type: ${pdfRes.contentType}`);
  console.log(`  Content-Disposition: ${pdfRes.contentDisposition}`);
  console.log(`  Size: ${pdfRes.size} bytes`);

  if (pdfRes.status === 200 && pdfRes.contentType === 'application/pdf') {
    const fileName = `test_api_${firstHoSo.ma_ho_so}.pdf`;
    fs.writeFileSync(fileName, pdfRes.buffer);
    console.log(`  ✓ PDF xuất thành công → ${fileName}`);
    
    // Kiểm tra PDF bắt đầu bằng %PDF
    const header = pdfRes.buffer.toString('ascii', 0, 5);
    console.log(`  ✓ PDF header: ${header} (${header === '%PDF-' ? 'VALID' : 'INVALID'})`);
  } else {
    console.log('  ✗ Lỗi:', pdfRes.buffer.toString('utf-8').substring(0, 300));
  }

  // 4. Test truy cập hồ sơ không tồn tại
  console.log(`\n[4] Test hồ sơ không tồn tại (ID=99999)...`);
  const notFoundRes = await fetchBinary('/pdf/ho-so/99999', token);
  console.log(`  Status: ${notFoundRes.status} (expected: 404 or 500)`);

  // 5. Test không có token
  console.log(`\n[5] Test không có token (unauthorized)...`);
  const noAuthRes = await fetchBinary('/pdf/ho-so/1', '');
  console.log(`  Status: ${noAuthRes.status} (expected: 401 or 403)`);

  console.log('\n=== HOÀN TẤT TEST PDF ===');
}

testPDF().catch(console.error);
