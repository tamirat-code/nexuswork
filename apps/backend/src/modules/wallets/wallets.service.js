import Wallet from "./wallets.model.js";

export async function getWallet(userId) {
  return Wallet.findOne({ user_id: userId });
}

export async function credit(userId, amount) {
  return Wallet.findOneAndUpdate({ user_id: userId }, { $inc: { balance: amount } }, { upsert: true, new: true });
}
