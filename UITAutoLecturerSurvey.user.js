// ==UserScript==
// @name            UIT - Auto Lecture Survey
// @author          Kevin Nitro
// @namespace       https://github.com/KevinNitroG
// @description     Userscript tự động khảo sát môn học UIT. Khuyến nghị disable script khi không sử dụng, tránh conflict với các khảo sát / link khác của trường.
// @license         https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/LICENSE
// @version         2.6
// @icon            https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/UIT-logo.png
// @match           http*://student.uit.edu.vn/sinhvien/phieukhaosat
// @match           http*://survey.uit.edu.vn/index.php/survey/index
// @match           http*://survey.uit.edu.vn/index.php/survey/index/sid/*/token/*
// @run-at          document-idle
// @grant           window.close
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_addStyle
// @grant           GM_openInTab
// @grant           GM_registerMenuCommand
// @downloadURL     https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/UITAutoLecturerSurvey.user.js
// @updateURL       https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/raw/main/UITAutoLecturerSurvey.user.js
// @supportURL      https://github.com/KevinNitroG/UIT-Auto-Lecturer-Survey/issues
// ==/UserScript==

(function () {
  'use strict';

  const FIRST_FORM_SELECTIONS = [
    '<50%',
    '50-80%',
    '>80%',
    'Không biết chuẩn đầu ra là gì',
  ];

  const SECOND_FORM_SELECTIONS = [
    'Dưới 50%',
    'Từ 50 đến dưới 70%',
    'Từ 70 đến dưới 90%',
    'Trên 90%',
  ];

  const THIRD_FORM_SELECTIONS = {
    'Thang điểm 1': 'answer_cell_00MH01.answer-item.radio-item',
    'Thang điểm 2': 'answer_cell_00MH02.answer-item.radio-item',
    'Thang điểm 3': 'answer_cell_00MH03.answer-item.radio-item',
    'Thang điểm 4': 'answer_cell_00MH04.answer-item.radio-item',
  };

  class GM {
    #userOptionFirst;
    #userOptionSecond;
    #userOptionThird;
    #position;

    constructor() {
      this.#userOptionFirst = GM_getValue('userOptionFirst', '');
      this.#userOptionSecond = GM_getValue('userOptionSecond', []);
      this.#userOptionThird = GM_getValue('userOptionThird', {});
      this.#position = this._getPosition();
      this._render();
    }

    // TODO: Huhmm
    _GMAddStyles() {
      GM_addStyle(`
        input[type="checkbox"] {
          margin-right: 5px;
        }
        h1 {
          margin-bottom: 5px;
        }
        button {
          margin-top: 10px;
        }
      `);
    }

    getUserOptions() {
      return {
        userOptionFirst: this.#userOptionFirst,
        userOptionSecond: this.#userOptionSecond,
        userOptionThird: this.#userOptionThird,
      };
    }

    _saveUserOptions() {
      GM_setValue('userOptionFirst', this.#userOptionFirst);
      GM_setValue('userOptionSecond', this.#userOptionSecond);
      GM_setValue('userOptionThird', this.#userOptionThird);
    }

    checkUserOption() {
      if (
        this.#userOptionFirst === '' ||
        this.#userOptionSecond.length === 0 ||
        Object.key(this.#userOptionThird).length === 0
      ) {
        alert('Bạn cần thiết lập các tuỳ chọn 🥵');
        return false;
      }
      return true;
    }

    _getPosition() {
      return document.querySelector('.content center');
    }

    _renderBanner() {
      const banner = `<p>⭐ UIT - Auto Lecturer Survey - Kevin Nitro 💖</p>`;
      this.#position.insertAdjacentHTML('beforeend', banner);
    }

    _renderConfigButton() {}

    _render() {}

    _configMenu() {}

    openConfigMenu() {}

    closeConfigMenu() {}

    toggleConfigMenu() {}
  }

  class FillInForms {
    #userOptionFirst;
    #userOptionSecond;
    #userOptionThird;

    constructor() {
      ({
        userOptionFirst: this.#userOptionFirst,
        userOptionSecond: this.#userOptionSecond,
        userOptionThird: this.#userOptionThird,
      } = GM().getUserOptions());
      this._fillInFirstForm();
      this._fillInSecondForm();
      this._fillInThirdForm();
      this._submit();
      this._closeTab();
    }

    /**
     * @param {number} max Right limit of random number.
     * @returns {number} Random number from [0, max - 1]
     */
    static _generateRandomIndex(max) {
      return Math.floor(Math.random() * max);
    }

    /** Fill in the first type form */
    _fillInFirstForm() {
      const labels = document.querySelectorAll('label.answertext');
      for (let i = 0; i < labels.length; i++)
        if (labels[i].innerText.trim() === this.#userOptionFirst)
          labels[i].click();
    }

    // TODO: WIP. Find questions and each in question, select 1 random.
    /** Fill in the second type form */
    _fillInSecondForm() {
      // const labels = document.querySelectorAll('label.answertext');
    }

    /** Fill in the third (table) form which has 4 selections in each question */
    _fillInThirdForm() {
      const cssSelectors = Object.values(this.#userOptionThird);
      const questions = document.querySelectorAll('.answers-list.radio-list');
      for (let i = 0; i < questions.length; i++) {
        const randomIndex = this._generateRandomIndex(
          this.#userOptionThird.length
        );
        questions[i].querySelector(cssSelectors[randomIndex]).click();
      }
    }

    /** Click on submit button */
    _submit() {
      document.querySelector('button[type="submit"][id="movenextbtn"]').click();
    }

    /** Close tab if a survey is done */
    _closeTab() {
      if (doneWindow.innerText.trim() === 'HOÀN THÀNH KHẢO SÁT') window.close();
    }
  }

  class Home {
    // #FORM_URL_REGEX_PATTERN =
    // /^(https?:\/\/)?survey\.uit\.edu\.vn\/index\.php\/survey\/index.*/;

    constructor() {
      if (window.location.pathname === '/sinhvien/phieukhaosat') {
        const gm = new GM();
        gm.render();
        if (!gm.checkUserOption()) gm.openConfigMenu();
      } else FillInForms();
    }

    /**
     * @returns {string[]} An array of survey URLs
     */
    _getSurveyURLs() {
      const urls = [...document.querySelectorAll('table a')];
      return urls.filter((url) =>
        url.innerHTML.includes('khảo sát về môn học')
      );
    }
  }

  Home();
})();
