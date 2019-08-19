import * as dotenv from "dotenv";
dotenv.config();
import minimist from "minimist";
import api from "../api";
import { render } from "./view";

(async () => {
  const { DC_NAME, DC_PASSWORD } = process.env;
  if (!DC_NAME || !DC_PASSWORD) {
    throw new Error("Please check your config");
  }
  const argv = minimist(process.argv.slice(2));
  let { q } = argv;
  console.time("api");

  let data = await api.getAttendance({
    name: DC_NAME,
    password: DC_PASSWORD
  });
  console.timeEnd("api");

  if (typeof q === "number") {
    q = q.toString();
  }

  if (typeof q === "string") {
    data = data.filter(row => row.quarter.includes(q));
  }
  console.time("render");
  render(data);
  console.timeEnd("render");
})();
