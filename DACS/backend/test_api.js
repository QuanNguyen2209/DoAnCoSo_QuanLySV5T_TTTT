const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', e => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log("=== BẮT ĐẦU TEST API ===");
    let testToken = null;
    const testEmail = `test_${Date.now()}@student.hutech.edu.vn`;
    const testPassword = "Password123!";

    // TC01: Đăng ký
    console.log(`\n[TC01] Đăng ký tài khoản: ${testEmail}`);
    const regRes = await fetchAPI('/auth/register', 'POST', {
        email: testEmail,
        password: testPassword,
        ho_ten: "Test User",
        vai_tro: "sinh_vien"
    });
    console.log(`- Status: ${regRes.status}`);
    console.log(`- Body:`, regRes.data);

    // TC02: Đăng nhập
    console.log(`\n[TC02] Đăng nhập`);
    const loginRes = await fetchAPI('/auth/login', 'POST', {
        email: testEmail,
        password: testPassword
    });
    console.log(`- Status: ${loginRes.status}`);
    if (loginRes.data && loginRes.data.data && loginRes.data.data.token) {
        testToken = loginRes.data.data.token;
        console.log(`- Đăng nhập THÀNH CÔNG, đã lấy Token.`);
    } else {
        console.log(`- LỖI: Không lấy được token.`, loginRes.data);
    }

    // TC03: Lấy thông tin tài khoản (Auth /me)
    if (testToken) {
        console.log(`\n[TC03] Gọi API /auth/me`);
        const meRes = await fetchAPI('/auth/me', 'GET', null, testToken);
        console.log(`- Status: ${meRes.status}`);
        console.log(`- Body:`, meRes.data);
    }

    // TC04: Xem danh sách hồ sơ 
    if (testToken) {
        console.log(`\n[TC04] Xem danh sách hồ sơ (GET /ho-so)`);
        const hsRes = await fetchAPI('/ho-so', 'GET', null, testToken);
        console.log(`- Status: ${hsRes.status}`);
        if(hsRes.data && hsRes.data.data) {
             console.log(`- Số lượng hồ sơ:`, hsRes.data.data.length || 0);
        } else {
             console.log(`- Body:`, hsRes.data);
        }
    }

    console.log("\n=== HOÀN TẤT TEST ===");
}

runTests().catch(console.error);
