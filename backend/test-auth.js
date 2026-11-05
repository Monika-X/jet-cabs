const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');

const uri = 'mongodb+srv://monimonasoccer003_db_user:iW1RKS0sBb1pEBY4@cluster0.r35wmgx.mongodb.net/car-rental-db?appName=Cluster0';

mongoose.connect(uri)
  .then(async () => {
    const admin = await User.findOne({ role: 'admin' });
    const token = jwt.sign({ id: admin._id, role: admin.role }, 'your_super_secret_jwt_key', { expiresIn: '30d' });
    
    console.log('Admin Token:', token);
    
    // Let's test a PUT request using node-fetch (or native fetch)
    const res = await fetch(`http://localhost:5000/api/cars/dummyid`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const data = await res.json();
    console.log('PUT Response:', res.status, data);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
