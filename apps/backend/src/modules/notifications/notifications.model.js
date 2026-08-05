import mongoose from "mongoose";

// TODO: define the real schema for the "notifications" module.
// See docs/database/ for the field list from the project's schema design.
const notificationsSchema = new mongoose.Schema(
  {
    // placeholder field so the model is valid until this module is implemented
    _placeholder: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Notifications", notificationsSchema);
