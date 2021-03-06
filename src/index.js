import { JSDOM } from 'jsdom';
import request from 'request';

import logger from './log';

const menuUrl = 'https://www.lounaat.info/lounas/rupla/helsinki';
const menuUrl2 = 'https://www.lounaat.info/lounas/on-the-rocks-kallio/helsinki';
const weekdays = ['Maanantaina', 'Tiistaina', 'Keskiviikkona', 'Torstaina', 'Perjantaina'];

const parsePompierMenu = (html) => {
  const dayIndex = new Date().getDay() - 3;
  if (dayIndex < 0 || dayIndex >= weekdays.length) {
    return 'Lunch available only weekdays!';
  }

  // Parse menu text
  const jsdom = new JSDOM(html);
  const cssSelector = '.item-container';
  const menu = jsdom.window.document.querySelector(cssSelector).textContent;

  // Find correct substring from menu
  const startIndex = menu.indexOf(weekdays[dayIndex]);
  const endIndex = dayIndex < weekdays.length - 1
    ? menu.indexOf(weekdays[dayIndex + 1])
    : menu.length;
  if (startIndex >= 0 && startIndex < endIndex) {
    const linesString = menu.substring(startIndex, endIndex);
    const lines = linesString.split('\n');

    // Format output
    return [`${lines[0]}`, ...lines.slice(1, lines.length)].join('\n');
  }

  return 'Error fetching Pompier lunch information';
};

const fetchPompierMenu = async (url = menuUrl) => new Promise((resolve) => {
  request(
    url,
    (error, { statusCode }, html) => {
      if (!error && statusCode === 200) {
        return resolve(parsePompierMenu(html));
      }
      const errorMsg = `Failed fetching Pompier menu: ${statusCode}`;
      logger.error(errorMsg);
      return resolve(errorMsg);
    },
  );
});

const fetchGrillsonMenu = async (url = menuUrl2) => new Promise((resolve) => {
  request(
    url,
    (error, { statusCode }, html) => {
      if (!error && statusCode === 200) {
        return resolve(parsePompierMenu(html));
      }
      const errorMsg = `Failed fetching Pompier menu: ${statusCode}`;
      logger.error(errorMsg);
      return resolve(errorMsg);
    },
  );
});


(async () => {
  logger.info('Fetching Pompier menu for today...');
  const text = await fetchPompierMenu();
  const text2 = await fetchGrillsonMenu();
  const text3 = `RUPLA: \n${text} \n\n ON THE ROCKS: \n${text2}`;
  logger.info(`Result:\n${menuUrl}|${text}`);
  logger.info(`Result:\n${menuUrl2}|${text2}`);
  logger.info(text3);
  

  const payload2 = { text: text3 };
  request({
    uri: process.env.SLACK_WEBHOOK,
    method: 'POST',
    json: payload2,
  }, () => logger.info('Posted menu2...'));

})();
