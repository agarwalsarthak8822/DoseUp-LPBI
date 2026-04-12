import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var -- module-scoped singleton for HMR
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cached = globalForMongoose.mongooseConn ?? { conn: null, promise: null };
if (!globalForMongoose.mongooseConn) {
  globalForMongoose.mongooseConn = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local.");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
