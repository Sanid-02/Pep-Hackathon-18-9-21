const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const pdfkit = require("pdfkit");

require('events').EventEmitter.defaultMaxListeners = Infinity;
let demand = process.argv.slice(2);
let priceList = [];

let page;
(async function fn() {
  let browser = await puppeteer.launch({
    headless: false,
    slowMo: 75,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  page = await browser.newPage();

  // Search from AMAZON:
  await goToTarget("amazon");
  await page.waitForTimeout(3000);
  await page.waitForSelector(".nav-search-field", { visible: true });
  await page.click(".nav-search-field");
  await page.type(".nav-search-field", demand);
  await page.keyboard.press("Enter", { delay: 1000 });
  await page.waitForTimeout(3000);

  // To obtain the price and name of article
  let nameOfItem = await page.$$(".a-size-medium.a-color-base.a-text-normal");
  let priceOfItem = await page.$$(".a-price-whole");
  await convertToText(nameOfItem, priceOfItem, "AMAZON");

  let filepath = process.cwd();

  // Search from Flipkart:
  await page.waitForTimeout(3000);
  await goToTarget("flipkart");
  await page.waitForSelector("._2KpZ6l._2doB4z");
  await page.click("._2KpZ6l._2doB4z");
  await page.waitForSelector("._3704LK");
  await page.click("._3704LK");
  await page.type("._3704LK", demand);
  await page.keyboard.press("Enter", { delay: 1000 });
  await page.waitForTimeout(2000);
  await page.waitForSelector("._2gmUFU._3V8rao");
  let arr = await page.$$("._2gmUFU._3V8rao");

  await arr[17].click();
  arr = await page.$$("._24_Dny");
  await arr[12].click();

  await page.waitForSelector("._4rR01T");
  nameOfItem = await page.$$("._4rR01T");
  priceOfItem = await page.$$("._30jeq3._1_WHN1");
  await convertToText(nameOfItem, priceOfItem, "FLIPKART");

  // Search from croma
  await page.waitForTimeout(3000);
  await goToTarget("croma");
  await page.waitForSelector("#search");
  await page.click("#search");
  await page.type("#search", demand);
  await page.keyboard.press("Enter", { delay: 1000 });
  await page.waitForTimeout(2000);
  await page.waitForSelector(".product-title.plp-prod-title");
  nameOfItem = await page.$$(".product-title.plp-prod-title");
  priceOfItem = await page.$$(".new-price");
  await convertToText(nameOfItem, priceOfItem, "CROMA");

  // Search from Vijay Sales
  await page.waitForTimeout(3000);
  await goToTarget("vijay sales");
  await page.waitForTimeout(3000);
  await page.waitForSelector("#txtSearch");
  await page.click("#txtSearch");
  await page.type("#txtSearch", demand);
  await page.keyboard.press("Enter", { delay: 1000 });
  await page.waitForTimeout(2000);
  await page.waitForSelector(".Dynamic-Bucket-ProductName");
  nameOfItem = await page.$$(".Dynamic-Bucket-ProductName");
  priceOfItem = await page.$$(".Dynamic-Bucket-mrp.dvpricepdlft");
  await convertToText(nameOfItem, priceOfItem, "VIJAY SALES");

  await pdfCreater(filepath, demand, priceList);
})();

async function goToTarget(input) {
  await page.goto("https://www.google.com/");
  await page.type("input[title='Search']", input);
  await page.keyboard.press("Enter", { delay: 1000 });
  await page.waitForSelector(".iUh30.Zu0yb.tjvcx", { visible: true });
  await page.click(".iUh30.Zu0yb.tjvcx");
}

function getText(element) {
  return element.textContent;
}

async function convertToText(ele_name, ele_price, source) {
  if (ele_name.length > 10) {
    ele_name = ele_name.slice(0, 11);
  }
  for (let i = 0; i < ele_name.length; i++) {
    let name = await page.evaluate(getText, ele_name[i]);
    let price = await page.evaluate(getText, ele_price[i]);
    if (i == ele_name.length - 1) {
      priceList.push(name.trim() + " -> " + price.trim() + " on " + source);
      priceList.push(
        "------------------------------------------------------------------------------"
      );
    } else {
      priceList.push(name.trim() + " -> " + price.trim() + " on " + source);
    }
  }
}

async function pdfCreater(f_path, demand, arr) {
  let filePath = path.join(f_path, demand + ".pdf");
  let pdfDoc = new pdfkit();
  for (let i = 0; i < arr.length; i++) {
    let text = JSON.stringify(arr[i]);
    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.font("Times-Roman").text(text, {
      align: "center",
    });
  }
  pdfDoc.end();
}
