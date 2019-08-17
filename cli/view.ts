import chalk from "chalk";
import { Attendance } from "../api";

export function render(data: Attendance[]) {
  data.map(row => renderRow(row));
}

export function renderRow(a: Attendance) {
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
