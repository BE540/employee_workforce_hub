const http = require('http');

// First, login to get a token
const loginData = JSON.stringify({
  email: 'manager1@toyota.poc',
  password: 'Test@1234'
});

const loginOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('Attempting login...');

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const loginResp = JSON.parse(data);
      if (loginResp.token) {
        console.log('✅ Login successful, token:', loginResp.token.substring(0, 20) + '...');
        
        // Now test the resource-planner endpoint
        const resourceOptions = {
          hostname: 'localhost',
          port: 4000,
          path: '/api/analytics/resource-planner',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResp.token}`
          }
        };

        console.log('\nFetching resource planner data...');
        
        const resourceReq = http.request(resourceOptions, (res2) => {
          let resData = '';
          res2.on('data', (chunk) => { resData += chunk; });
          res2.on('end', () => {
            try {
              const resourceResp = JSON.parse(resData);
              console.log('✅ Resource planner response status:', res2.statusCode);
              console.log('Response keys:', Object.keys(resourceResp));
              if (resourceResp.data) {
                console.log('Data keys:', Object.keys(resourceResp.data));
                console.log('Projects count:', resourceResp.data.projects?.length || 0);
                console.log('Teams count:', resourceResp.data.teams?.length || 0);
                console.log('Employees count:', resourceResp.data.employees?.length || 0);
              } else if (resourceResp.error) {
                console.log('❌ Error:', resourceResp.error);
              }
            } catch (e) {
              console.log('Response:', resData);
            }
          });
        });
        
        resourceReq.on('error', (e) => console.error('Request error:', e));
        resourceReq.end();
      } else {
        console.log('❌ Login failed:', loginResp);
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

loginReq.on('error', (e) => {
  console.error('Connection error: Make sure backend is running on port 4000');
  console.error('Error:', e.message);
});

loginReq.write(loginData);
loginReq.end();
