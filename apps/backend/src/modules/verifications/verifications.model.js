import mongoose from "mongoose";

// TODO: define the real schema for the "verifications" module.
// See docs/database/ for the field list from the project's schema design.
const verificationsSchema = new mongoose.Schema(
  {
    // placeholder field so the model is valid until this module is implemented
    _placeholder: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Verifications", verificationsSchema);
