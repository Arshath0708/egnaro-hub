import https from 'https';

https.get('https://egnaromart.com/api/run_sub_subcategory_migration.php', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log("MIGRATION OUTPUT:");
    console.log(data);
  });
}).on('error', (err) => {
  console.error("Error running migration: " + err.message);
});
