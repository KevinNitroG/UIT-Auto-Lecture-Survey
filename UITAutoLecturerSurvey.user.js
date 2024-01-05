// ==UserScript==
// @name            UIT - Auto Lecture Survey
// @author          Kevin Nitro
// @namespace       UIT-KevinNitro
// @description     Tự động đánh giá khảo sát giảng viên UIT. vui lòng disable script khi không sử dụng, tránh conflict với các khảo sát / link khác của trường
// @license         https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/LICENSE
// @version         1.10
// @icon            https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/UIT-logo.png
// @match           http*://survey.uit.edu.vn/index.php/survey/index/sid/*/token/*
// @match           http*://survey.uit.edu.vn/index.php/survey/index
// @run-at          document-idle
// @grant           window.close
// @downloadURL     https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/UITAutoLecturerSurvey.user.js
// @updateURL       https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/UITAutoLecturerSurvey.user.js
// @supportURL      mailto:kevinnitro@duck.com
// ==/UserScript==

// THIS SCRIPT WAS GENERATED BY CHATGPT & My brain for 10% .-.

(function () {
  'use strict';

  // Values for first type questions
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

  // Sort array randomly and return array
  function sortArrayRandomly(array) {
    return array.sort(function () {
      return Math.random() - 0.5;
    });
  }

  // Return random index of array
  function randomIndex(array) {
    return Math.floor(Math.random() * array.length);
  }

  // Select first type questions
  let answerLabels = document.querySelectorAll('label.answertext');
  answerLabels.forEach(function (label) {
    let firstTypeSelectionsArrayRandom = sortArrayRandomly(
      firstTypeSelectionsArray,
    );
    for (let i = 0; i < firstTypeSelectionsArrayRandom.length; i++) {
      if (label.innerText.trim() === firstTypeSelectionsArrayRandom[i]) {
        label.click();
        break;
      }
    }
  });

  // Select second type questions
  let secondTypeSelectionsArrayClass = secondTypeSelectionsArray.map(
    (className) => `${className} answer-item radio-item`,
  );
  const radioLists = document.querySelectorAll('.answers-list.radio-list');
  radioLists.forEach(function (radioList) {
    let randomElementClass =
      secondTypeSelectionsArrayClass[
        randomIndex(secondTypeSelectionsArrayClass)
      ];
    let randomElement = radioList.querySelector(
      '.' + randomElementClass.replace(/ /g, '.'),
    );
    if (randomElement) {
      randomElement.click();
    }
  });

  // setTimeout(function () {}, 100);

  // Continue to next page
  const moveNextBtn = document.querySelector(
    'button[type="submit"][id="movenextbtn"]',
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
})();
