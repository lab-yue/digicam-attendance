import puppeter from "puppeteer";

export type User = {
  name: string;
  password: string;
};

export type Token = string;

export type Attendance = {
  code: string;
  title: string;
  quarter: string;
  day: string;
  time: string;
  rate: string;
  records: AttendanceStatus[];
};

export type AttendanceStatus = {
  date: string;
  status: string;
};

const urls = {
  login: "https://dh.force.com/digitalCampus/CampusLogin"
};

const getToken = (text: string): Token => {
  const matched = text.match(/CP_PARAM=(.+?)"/i);
  if (!matched || !matched[1]) {
    throw new Error("No matched token");
  }
  return matched[1];
};

async function getAttendance(u: User): Promise<Attendance[]> {
  console.time("launch");

  const browser = await puppeter.launch({
    headless: true,
    args: ["--no-sandbox"]
  });
  console.timeEnd("launch");

  const page = await browser.newPage();
  await page.setRequestInterception(true);
  const blockresourceTypes = [
    //"document",
    "stylesheet",
    "image",
    "media",
    "font",
    //"script",
    "texttrack",
    "xhr",
    "fetch",
    "eventsource",
    "websocket",
    "manifest",
    "other"
  ];

  const blockSuffixes = ["jpg", ".jpeg", ".png", ".gif", ".css"];
  const whiteKeys = [""];

  page.on("request", request => {
    const blockByResource = blockresourceTypes.includes(request.resourceType());
    const blockBySuffix = blockSuffixes.some(suffix =>
      request.url().endsWith(suffix)
    );
    const whitelisted = whiteKeys.some(key => request.url().includes(key));

    if (blockByResource || blockBySuffix) {
      console.log(`block : ${request.url()}`);
      if (!whitelisted) {
        console.log(`whitelisted : ${request.url()}`);
        request.abort();
      } else {
        request.continue();
      }
    } else {
      request.continue();
    }
  });

  console.time("login page");
  await page.goto(urls.login);
  console.timeEnd("login page");

  console.time("typing");
  const fields = await page.$$(".loginInput");
  if (fields.length !== 2) {
    throw new Error("Form Not found");
  }

  await fields[0].type(u.name);
  await fields[1].type(u.password);

  await page.click(".loginBtn");
  console.timeEnd("typing");

  console.time("login");
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  console.timeEnd("login");

  const text = await page.evaluate(() => document.body.innerHTML);
  const token = getToken(text);

  console.time("campus page");

  await page.goto(
    `https://campus.dhw.ac.jp/gakusei/web/CplanMenuWeb/UI/LoginForm.aspx?CP_PARAM=${token}`
  );
  await page.goto(
    `https://campus.dhw.ac.jp/gakusei/web/User/DHW/skt/DHWWebSktShukketsuJyokyoSansho/UI/DHWWSK_ShukketsuJyokyoSansho.aspx`
  );
  console.timeEnd("campus page");

  const data = await page.$$eval("#dg > tbody > tr + tr", rows => {
    return rows.map(
      (row): Attendance => {
        const rowData = Array.from(row.querySelectorAll("td")).map(cell =>
          (cell.innerText || "").trim()
        );

        return {
          code: rowData[0],
          title: rowData[1],
          quarter: rowData[2],
          day: rowData[3],
          time: rowData[4],
          rate: rowData[5],
          records: rowData
            .splice(6)
            .filter(r => r)
            .map(r => {
              const cell = r.split("\n");
              return { date: cell[0], status: cell[1] };
            })
        };
      }
    );
  });
  await browser.close();
  return data;
}

export default {
  getAttendance
};
