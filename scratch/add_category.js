import https from 'https';

const postData = JSON.stringify({
  name: 'Test Long Category Name'
});

const options = {
  hostname: 'egnaromart.com',
  port: 443,
  path: '/api/add-category.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log("RESPONSE FROM SERVER:");
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
