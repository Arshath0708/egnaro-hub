import https from 'https';
https.get('https://egnaromart.com/api/get-categories.php', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log("RAW JSON RECEIVED:");
    console.log(data);
  });
}).on('error', (err) => {
  console.error("Error fetching: " + err.message);
});
