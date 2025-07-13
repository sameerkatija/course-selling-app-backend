require("dotenv").config();

const PORT: number = Number(process.env.PORT);
const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = 11;
export { PORT, JWT_SECRET, SALT_ROUNDS };
