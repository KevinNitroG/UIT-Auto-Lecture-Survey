// ==UserScript==
// @name            UIT - Auto Lecture Survey
// @author          Kevin Nitro
// @namespace       UIT-KevinNitro
// @description     Tự động đánh giá khảo sát giảng viên UIT. vui lòng disable script khi không sử dụng, tránh conflict với các khảo sát / link khác của trường
// @license         https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/LICENSE
// @version         1.12
// @icon            https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/UIT-logo.png
// @match           http*://student.uit.edu.vn/sinhvien/phieukhaosat
// @match           http*://survey.uit.edu.vn/index.php/survey/index
// @match           http*://survey.uit.edu.vn/index.php/survey/index/sid/*/token/*
// @run-at          document-idle
// @grant           window.close
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM.setValue
// @grant           GM.getValue
// @downloadURL     https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/UITAutoLecturerSurvey.user.js
// @updateURL       https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/UITAutoLecturerSurvey.user.js
// @supportURL      mailto:kevinnitro@duck.com
// ==/UserScript==

// THIS SCRIPT WAS GENERATED BY CHATGPT & My brain for 10% .-.

// ---------- START GLOBAL VARIABLES ----------

// Value for first type questions
const firstTypeSelectionsArray = [
  '>80%',
  '50-80%',
  'Từ 70 đến dưới 90%',
  'Trên 90%',
];

// Value for second type questions
const secondTypeSelectionsArray = [
  // 'answer_cell_00MH01',
  // 'answer_cell_00MH02',
  'answer_cell_00MH03',
  'answer_cell_00MH04',
];

// Time duration to process each form from homepage (in ms)
let processingTimeForEachForm = 0;

// Time duration to sleep for each form before continue to the next page or submit form (in ms)
const processingTimeBeforeContinueForm = 0;

// ---------- END GLOBAL VARIABLES ----------

// ---------- START HOMEPAGE FUNCTION ----------

// Return position
function UITAutoLecturerSurveyHomePagePosition() {
  return document
    .getElementsByClassName('content')[0]
    .getElementsByTagName('center')[0];
}

// Add paragrah
function UITAutoLecturerSurveyParagraph(headElement) {
  const para = document.createElement('p');
  const node = document.createTextNode(
    '⭐ UIT - Auto Lecturer Survey - Kevin Nitro 💖'
  );
  para.appendChild(node);
  headElement.appendChild(para);
}

// Add auto survey button
function UITAutoLecturerSurveyAddAutoSurveyButton(headElement) {
  const executeButton = document.createElement('button');
  executeButton.textContent = 'Auto Lecturer Survey';
  executeButton.addEventListener('click', UITAutoLecturerSurveyExecuteURLs);
  headElement.appendChild(executeButton);
}

// Get URLs of forms in homepage
function UITAutoLecturerSurveyGetURL() {
  // This small script is taken and edited from https://github.com/khanh-moriaty/autosurvey
  const links = Object.values(
    document.getElementsByTagName('table')[0].getElementsByTagName('a')
  );
  let data = [];
  links.forEach((link) => {
    if (link.innerHTML.includes(' - ')) {
      // data.push(link);
      data += link;
    }
  });
  return data;
}

// Execute URLs of forms in homepage
function UITAutoLecturerSurveyExecuteURLs() {
  const links = UITAutoLecturerSurveyGetURL();
  console.log(links);
  if (links.length > 0) {
    if (processingTimeForEachForm < 5000) {
      processingTimeForEachForm = window.prompt(
        'Nhập thời gian xử lý mỗi form (ms). Nên >= 5000 tuỳ vào tốc độ mạng và kết nối server. Nếu quá nhanh, chưa kịp xong form cũ sẽ bị lỗi.',
        '5000'
      );
    }
    links.forEach((link) => {
      setTimeout(() => {
        window.open(link.href, '_blank');
      }, processingTimeForEachForm);
      window.alert('Done các link khảo sát! 😎');
    });
  } else {
    window.alert(
      'Không tìm thấy link khảo sát nào! Hoặc bị lỗi thì tạo issue đi bro 😐'
    );
  }
}

// ---------- END HOMEPAGE FUNCTIONS ----------

// ---------- START EXECUTE FUNCTION ----------

function UITAutoLecturerSurveyRunScript() {
  // Sort array randomly and return array
  function sortArrayRandomly(array) {
    return array.sort(() => {
      return Math.random() - 0.5;
    });
  }

  // Return random index of array
  function randomIndex(array) {
    return Math.floor(Math.random() * array.length);
  }

  // Select first type questions
  const answerLabels = document.querySelectorAll('label.answertext');
  answerLabels.forEach(function (label) {
    const firstTypeSelectionsArrayRandom = sortArrayRandomly(
      firstTypeSelectionsArray
    );
    for (let i = 0; i < firstTypeSelectionsArrayRandom.length; i++) {
      if (label.innerText.trim() === firstTypeSelectionsArrayRandom[i]) {
        label.click();
        break;
      }
    }
  });

  // Select second type questions
  const secondTypeSelectionsClassArray = secondTypeSelectionsArray.map(
    (className) => `.${className}answer-item.radio-item`
  );
  const secondTypeQuestions = document.querySelectorAll(
    '.answers-list.radio-list'
  );
  secondTypeQuestions.forEach((secondTypeQuestion) => {
    const randomElementClass =
      secondTypeSelectionsClassArray[
        randomIndex(secondTypeSelectionsClassArray)
      ];
    const randomElement = secondTypeQuestion.querySelector(randomElementClass);
    if (randomElement) {
      randomElement.click();
    }
  });

  // Sleep before continue to next page / submit form
  setTimeout(() => {}, processingTimeBeforeContinueForm);

  // Continue to next page
  const moveNextBtn = document.querySelector(
    'button[type="submit"][id="movenextbtn"]'
  );
  if (moveNextBtn) {
    moveNextBtn.click();
  }

  // Submit form
  const submitBtn = document.getElementById('movesubmitbtn');
  if (submitBtn) {
    submitBtn.click();
  }

  // Close tab when done
  const doneWindow = document.querySelector('.site-name');
  if (doneWindow.innerText.trim() === 'HOÀN THÀNH KHẢO SÁT') {
    window.close();
  }
}

// ---------- END EXECUTE FUNCTION ----------

// ---------- START MAIN FUNCTION ----------

(function UITAutoLecturerSurveyMain() {
  'use strict';
  if (window.location.pathname === '/sinhvien/phieukhaosat') {
    const headElement = UITAutoLecturerSurveyHomePagePosition();
    UITAutoLecturerSurveyParagraph(headElement);
    UITAutoLecturerSurveyAddAutoSurveyButton(headElement);
  } else {
    UITAutoLecturerSurveyRunScript();
  }
})();

// ---------- END MAIN FUNCTION ----------
