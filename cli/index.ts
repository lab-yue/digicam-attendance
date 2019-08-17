import * as dotenv from "dotenv";
dotenv.config();

import api from "../api";
import { render } from "./view";

(async () => {
  const { DC_NAME, DC_PASSWORD } = process.env;
  if (!DC_NAME || !DC_PASSWORD) {
    throw new Error("Please check your config");
  }

  const data = await api.getAttendance({
    name: DC_NAME,
    password: DC_PASSWORD
  });

  render(data);
})();
