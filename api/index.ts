import puppeter from "puppeteer";
import chalk from "chalk";

type User = {
  name: string;
  password: string;
};

type Token = string;

type Attendance = {
  code: string;
  title: string;
  quarter: string;
  day: string;
  time: string;
  rate: string;
  records: AttendanceStatus[];
};

type AttendanceStatus = {
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

async function get(u: User) {
  const browser = await puppeter.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto(urls.login);

  const fields = await page.$$(".loginInput");
  if (fields.length !== 2) {
    throw new Error("Form Not found");
  }

  await fields[0].type(u.name);
  await fields[1].type(u.password);

  await page.click(".loginBtn");
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  const text = await page.evaluate(() => document.body.innerHTML);
  const token = getToken(text);
  await page.goto(
    `https://campus.dhw.ac.jp/gakusei/web/CplanMenuWeb/UI/LoginForm.aspx?CP_PARAM=${token}`
  );
  await page.goto(
    `https://campus.dhw.ac.jp/gakusei/web/User/DHW/skt/DHWWebSktShukketsuJyokyoSansho/UI/DHWWSK_ShukketsuJyokyoSansho.aspx`
  );
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
  viewAll(data);
  await browser.close();
}

function viewAll(data: Attendance[]) {
  data.map(row => view(row));
}
function view(a: Attendance) {
  console.log(chalk.white.bold(`> ${a.title} ${a.code}`));
  let recordLog = [chalk.yellow(a.rate)];
  for (let record of a.records) {
    switch (record.status) {
      case "出席": {
        recordLog.push(chalk.black.bgGreen(record.date));
        break;
      }
      case "修正出席": {
        recordLog.push(chalk.black.bgCyan(record.date));
        break;
      }
      case "遅刻": {
        recordLog.push(chalk.black.bgRed(record.date));
        break;
      }
      case "欠席": {
        recordLog.push(chalk.black.bgRed(record.date));
        break;
      }
      default: {
        recordLog.push(chalk.black.bgGreen(record.date));
      }
    }
  }
  console.log(recordLog.join(" "));
}

export default {
  get
};
