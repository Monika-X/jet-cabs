const mongoose = require('mongoose');
const carSchema = new mongoose.Schema({
  totalUnits: Number,
  availableUnits: Number,
  status: String
});

carSchema.pre('save', function (next) {
  try {
    if (this.availableUnits > this.totalUnits) {
      this.availableUnits = this.totalUnits;
    }
    this.status = this.availableUnits > 0 ? 'Available' : 'Unavailable';
    next();
  } catch (err) {
    console.error("Hook Error:", err.message);
  }
});

const Car = mongoose.model('TestCar', carSchema);

async function run() {
  const c = new Car({ totalUnits: 2, availableUnits: 2 });
  await c.save().catch(e => console.log("Save error:", e.message));
}
run();
