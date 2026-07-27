const mongoose = require('mongoose');
const User = require('./models/User');

const uri = 'mongodb+srv://monimonasoccer003_db_user:iW1RKS0sBb1pEBY4@cluster0.r35wmgx.mongodb.net/car-rental-db?appName=Cluster0';

mongoose.connect(uri)
  .then(async () => {
    const admins = await User.find({ role: 'admin' });
    console.log('Admins found:', admins);
    const customers = await User.find({ role: 'customer' });
    console.log('Customers found:', customers);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
