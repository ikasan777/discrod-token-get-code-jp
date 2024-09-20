const axios = require('axios');
const readline = require('readline');
const childProcess = require('child_process');
const chalk = require('chalk');
const fs = require('fs');

console.log(chalk.yellow("このコードのせいでアカウントがBANされた！、等の文句は受け付けてないにゃ！\nまたこのコードいじってないのに使えない！という場合は[nyaru.rant@gmail.com]に連絡をくれると嬉しいにゃ"));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let accounts = [];
let saveToFile = false;

rl.question(chalk.cyan('トークンをファイルに保存するにゃ？(y/n): '), (answer) => {
  if (answer.toLowerCase() === 'y') {
    saveToFile = true;
  }
  function askNumAccounts() {
    rl.question('何個取得するにゃ？: ', (num) => {
      const numAccounts = parseInt(num);
      if (isNaN(numAccounts)) {
        console.log(chalk.red('数字を入力するにゃ！それ以外は受け付けないにゃ！'));
        askNumAccounts();
      } else {
        function askAccountInfo(index) {
          if (index < numAccounts) {
            rl.question(`にゃカウント${index + 1}個目のメールアドレスを教えて欲しいにゃ！: `, (email) => {
              if (email.trim() === '') {
                console.log(chalk.red('メールアドレスの入力は必須にゃ！'));
                askAccountInfo(index);
                return;
              }
              rl.question(`にゃにゃ？アカウント${index + 1}個目のパスワードを教えてほしいにゃ！: `, (password) => {
                if (password.trim() === '') {
                  console.log(chalk.red('パスワードの入力は必須にゃ！'));
                  askAccountInfo(index);
                  return;
                }
                accounts.push({ email, password });
                askAccountInfo(index + 1);
              });
            });
          } else {
            rl.close();
            getTokens(accounts);
          }
        }

        askAccountInfo(0);
      }
    });
  }

  askNumAccounts();
});

async function getTokens(accounts) {
  const promises = accounts.map(account => axios.post('https://discord.com/api/v9/auth/login', {
    email: account.email,
    password: account.password,
  }));

  try {
    const responses = await Promise.all(promises);
    responses.forEach((response, index) => {
      console.log(`"${accounts[index].email}"のトークンはこれにゃ！"${response.data.token}"`);
      if (saveToFile) {
        const data = `${accounts[index].email}:${response.data.token}\n`;
        fs.appendFile('tokens.txt', data, (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    });
  } catch (errors) {
    if (errors.response && errors.response.status === 400) {
      console.log(chalk.red('メールアドレスかパスワードが間違ってるみたいだにゃ！'));
      console.log(chalk.cyan('エンターで最初からできるにゃ！'));
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('', () => {
        console.clear();
        childProcess.execSync('node ' + process.argv[1], { stdio: 'inherit' });
        process.exit();
        
      });
    } else {
      console.error('tokenを取得できなかったにゃ...許してほしいにゃ...\n:', errors);
    }
  }
}