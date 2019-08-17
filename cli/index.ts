import api from "../api";
import * as dotenv from "dotenv";
dotenv.config();

(async () => {
  const { DC_NAME, DC_PASSWORD } = process.env;
  if (!DC_NAME || !DC_PASSWORD) {
    throw new Error("Please check your config");
  }
  await api.get({ name: DC_NAME, password: DC_PASSWORD });
})();
