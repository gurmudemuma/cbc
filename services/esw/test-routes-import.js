// Test if routes can be imported
console.log('Testing routes import...');

try {
  const routes = require('./dist/routes/esw.routes.js');
  console.log('✅ Routes imported successfully');
  console.log('Routes object:', routes);
  console.log('Default export:', routes.default);
  console.log('Type:', typeof routes.default);
  
  if (routes.default && typeof routes.default === 'function') {
    console.log('✅ Routes.default is a function (Router)');
  } else {
    console.log('❌ Routes.default is NOT a function');
  }
} catch (error) {
  console.log('❌ Failed to import routes');
  console.log('Error:', error.message);
  console.log('Stack:', error.stack);
}
