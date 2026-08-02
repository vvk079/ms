// models/Counter.js
// A tiny atomic sequence generator. Used to mint collision-free, monotonically
// increasing order numbers under concurrency (countDocuments()+1 races and also
// collides after deletions). One document per named sequence.
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name, e.g. "orderNumber"
  seq: { type: Number, default: 0 },     // first next() returns 1 (upsert $inc starts at 0)
});

// Atomically increment and return the next value for a sequence.
counterSchema.statics.next = async function (name) {
  const doc = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
};

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
