const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const User = require('./models/User');

const uri = 'mongodb+srv://monimonasoccer003_db_user:iW1RKS0sBb1pEBY4@cluster0.r35wmgx.mongodb.net/car-rental-db?appName=Cluster0';

async function runTest() {
  await mongoose.connect(uri);
  const admin = await User.findOne({ role: 'admin' });
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'your_super_secret_jwt_key', { expiresIn: '1h' });

  console.log('--- Testing Create Car ---');
  
  const form = new FormData();
  form.append('carName', 'Audit Test Car');
  form.append('brand', 'Audit');
  form.append('category', 'Sports Cars');
  form.append('fuelType', 'Electric');
  form.append('transmission', 'Automatic');
  form.append('seatingCapacity', '2');
  form.append('hourlyPrice', '50');
  form.append('dailyPrice', '500');
  form.append('totalUnits', '5');
  form.append('availableUnits', '5');
  form.append('description', 'Test desc');
  
  const blob = new Blob(['dummy image content'], { type: 'image/png' });
  form.append('images', blob, 'dummy.png');

  let createRes = await fetch('http://localhost:5000/api/cars', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  let createdCar = await createRes.json();
  console.log('Create Response:', createRes.status, createdCar.success ? 'Success' : createdCar.message);
  
  if (!createdCar.success) {
    process.exit(1);
  }

  const carId = createdCar.data._id;
  const imagePublicId = createdCar.data.images[0].public_id;

  console.log('--- Testing Update Car ---');
  const updateForm = new FormData();
  updateForm.append('carName', 'Audit Test Car UPDATED');
  updateForm.append('retainedImages', JSON.stringify([imagePublicId])); // Keep the image
  
  let updateRes = await fetch(`http://localhost:5000/api/cars/${carId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: updateForm
  });

  let updatedCar = await updateRes.json();
  console.log('Update Response:', updateRes.status, updatedCar.success ? 'Success' : updatedCar.message);

  console.log('--- Testing Get Cars ---');
  let getRes = await fetch('http://localhost:5000/api/cars');
  let getCars = await getRes.json();
  console.log('Get Cars Response:', getRes.status, getCars.success ? `Success (${getCars.data.length} cars found)` : getCars.message);

  console.log('--- Testing Delete Car ---');
  let deleteRes = await fetch(`http://localhost:5000/api/cars/${carId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  let deletedCar = await deleteRes.json();
  console.log('Delete Response:', deleteRes.status, deletedCar.success ? 'Success' : deletedCar.message);
  
  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
