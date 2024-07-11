// ==UserScript==
// @name            UIT - Auto Lecture Survey (uals)
// @author          Kevin Nitro
// @namespace       https://github.com/KevinNitroG
// @description     Userscript tự động khảo sát môn học UIT. Khuyến nghị disable script khi không sử dụng, tránh conflict với các khảo sát / link khác của trường.
// @license         https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/LICENSE
// @version         3.0
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
// @downloadURL     https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/auto-survey.user.js
// @updateURL       https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/auto-survey.user.js
// @supportURL      https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/issues
// ==/UserScript==

(function () {
  'use strict';

  const FIRST_SELECTIONS = [
    '<50%',
    '50-80%',
    '>80%',
    'Không biết chuẩn đầu ra là gì',
  ];

  const SECOND_SELECTIONS = [
    'Dưới 50%',
    'Từ 50 đến dưới 70%',
    'Từ 70 đến dưới 90%',
    'Trên 90%',
  ];

  const THIRD_SELECTIONS = [
    'answer_cell_00MH01.answer-item.radio-item',
    'answer_cell_00MH02.answer-item.radio-item',
    'answer_cell_00MH03.answer-item.radio-item',
    'answer_cell_00MH04.answer-item.radio-item',
  ];

  const WINDOW_DONE_MSG = 'surveyDone';

  class GM {
    #firstOpt;
    #secondOpts;
    #thirdOpts;

    constructor() {
      this.#firstOpt = GM_getValue('firstOpt', '');
      this.#secondOpts = GM_getValue('secondOpts', []);
      this.#thirdOpts = GM_getValue('thirdOpts', []);
    }

    // TODO: Huhmm
    addStyles() {
      GM_addStyle(`
        #uals-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        #uals-btn-container {
          align-items: center;
          display: flex;
          justify-content: center;
        }

        .uals-btn {
          background-color: #115d9d;
          border-radius: 0.5rem;
          border: none;
          color: white;
          margin: 0.5rem 0.5rem 1rem 0.5rem;
          padding: 0.5rem;
          transition: background-color 0.3s ease-in-out;
        }

        .uals-btn:hover {
          background-color: #1678cb;
        }

        #uals-menu-container {
          display: none;
          opacity: 0;
          visibility: hidden;
        }

        #uals-menu-container.show {
          display: inline-block;
          opacity: 1;
          visibility: visible;
        }

        #select-2, #select-3 {
          display: flex;
          flex-direction: row;
          align-items: center;
        }
        #select-2 > label, #select-3 > label {
          margin-left: 10px;
          margin-right: 10px;
        }
      `);
    }

    getUserOptions() {
      return {
        firstOpt: this.#firstOpt,
        secondOpts: this.#secondOpts,
        thirdOpts: this.#thirdOpts,
      };
    }

    _saveUserOptions() {
      GM_setValue('firstOpt', this.#firstOpt);
      GM_setValue('secondOpts', this.#secondOpts);
      GM_setValue('thirdOpts', this.#thirdOpts);
    }

    _fetchUserOptions() {
      const firstOpt = document.querySelector('#select-1');
      firstOpt.check;
    }

    _saveUserOptionsTrigger() {
      const configBtn = document.querySelector('#uals-save-config-btn');
      configBtn.addEventListener('click', () => {
        this._fetchUserOptions();
        this._saveUserOptions();
      });
    }

    checkUserOption() {
      if (
        this.#firstOpt === '' ||
        this.#secondOpts.length === 0 ||
        this.#thirdOpts.length === 0
      ) {
        alert('Bạn cần thiết lập các tuỳ chọn 🥵');
        return false;
      }
      return true;
    }
  }

  class FillInForm {
    #firstOpt;
    #secondOpts;
    #thirdOpts;

    constructor() {
      const { firstOpt, secondOpts, thirdOpts } = GM().getUserOptions();
      this.#firstOpt = firstOpt;
      this.#secondOpts = secondOpts;
      this.#thirdOpts = thirdOpts;
      this._firstForm();
      this._secondForm();
      this._thirdForm();
      this._submit();
      this._done();
    }

    /**
     * @param {number} max Right limit of random number.
     * @returns {number} Random number from [0, max - 1]
     */
    static _genRanInt(max) {
      return Math.floor(Math.random() * max);
    }

    /** Fill in the first type form */
    _firstForm() {
      const labels = document.querySelectorAll('label.answertext');
      for (let label of labels)
        if (label.innerText.trim() === this.#firstOpt) label.click();
    }

    // TODO: WIP. Find questions and each in question, select 1 random.
    /** Fill in the second type form */
    _secondForm() {
      // const labels = document.querySelectorAll('label.answertext');
    }

    /** Fill in the third (table) form which has 4 selections in each question */
    _thirdForm() {
      const questions = document.querySelectorAll('.answers-list.radio-list');
      for (let question of questions) {
        const randomIndex = this._genRanInt(this.#thirdOpts.length);
        question.querySelector(this.#thirdOpts[randomIndex]).click();
      }
    }

    /** Click on submit button */
    _submit() {
      document
        .querySelector('button[type="submit"][id="movenextbtn"]')
        ?.click();
    }

    /** Close tab if a survey is done */
    _done() {
      if (doneWindow.innerText.trim() === 'HOÀN THÀNH KHẢO SÁT') {
        window.opener.postMessage(WINDOW_DONE_MSG, '*');
        window.close();
      }
    }
  }

  class SurveyManager {
    #surveys;
    #current;

    constructor(surveys) {
      this.#surveys = surveys;
      this.#current = 0;
    }

    _listenEvent(e) {
      if (e.data === WINDOW_DONE_MSG) {
        this.#current++;
        if (this.#current >= this.#surveys.length) {
          aler('Đã thực hiện xong tất cả các khảo sát 😇');
          this._removeListener();
          return;
        }
        this._doSurveys();
      }
    }

    _addListener() {
      window.addEventListener('message', this._listenEvent);
    }

    _removeListener() {
      window.removeEventListener('message', this._listenEvent);
    }

    _doSurveys() {
      GM_openInTab(this.#surveys[this.#current], true);
    }

    run() {
      if (this.#current >= this.#surveys.length) {
        aler('Không có khảo sát nào cả 😕');
        return;
      }
      this._addListener();
      this._doSurveys();
    }
  }

  class Home {
    #position;
    #gm;

    constructor() {
      this.#position = this._getPosition();
      this.#gm = new GM();
      this.#gm.addStyles();
      this._render();
      if (!this.#gm.checkUserOption()) this.#gm.openConfigMenu();
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

    _getPosition() {
      const html = `
        <div id="uals-container">
        </div>
      `;
      const position = document.querySelector('.content');
      position.insertAdjacentHTML('afterbegin', html);
      const container = position.querySelector('#uals-container');
      container.insertAdjacentHTML('afterend', '<br>');
      return container;
    }

    _insertElement(element) {
      this.#position.insertAdjacentHTML('beforeend', element);
    }

    _renderBanner() {
      const banner = `<p align="center">UIT - Auto Lecture Survey - Kevin Nitro</p>`;
      this._insertElement(banner);
    }

    _runAutoSurvey() {
      const sm = new SurveyManager();
      sm.run();
    }

    _runAutoSurveyButtonHTML() {
      return `<button class="uals-btn" id="uals-run-btn">Run Auto</button>`;
    }

    _configButtonHTML() {
      return `<button class="uals-btn" id="uals-config-btn">Config</button>`;
    }

    _saveConfigButtonHTML() {
      return `<button class="uals-btn" id="uals-save-config-btn">Save</button>`;
    }

    _configMenu() {
      let html = `
        <div id="uals-menu-container">
          <div id="menu-1-container">
            <h3 id="uals-menu-header">Chọn câu trả lời cho form loại 1</h3>
            <select id="select-1" name="select-1">
        `;
      for (let i = 0; i < FIRST_SELECTIONS.length; i++)
        html += `
              <option value="${i}">${FIRST_SELECTIONS[i]}</option>
          `;
      html += `
            </select>
          </div>
        `;
      html += `
          <div id="menu-2-container">
            <h3 id="uals-menu-header">Chọn câu trả lời cho form loại 2</h3>
            <form id="select-2">
        `;
      for (let i = 0; i < SECOND_SELECTIONS.length; i++)
        html += `
              <input type="checkbox" id="select-2-${i}" value="${i}" />
              <label for="select-2-${i}">${SECOND_SELECTIONS[i]}</label>
          `;
      html += `
            </form>
          </div>
        `;
      html += `
          <div id="menu-3-container">
            <h3 id="uals-menu-header">
              Chọn câu trả lời cho form loại 3 (mức độ hài lòng)
            </h3>
            <form id="select-2">
        `;
      for (let i = 0; i < THIRD_SELECTIONS.length; i++)
        html += `
              <input type="checkbox" id="select-3-${i}" value="${i}" />
              <label for="select-3-${i}">Mức ${i + 1}</label>
          `;
      html += `
            </form>
          </div>
          ${this._saveConfigButtonHTML()}
        </div>
        `;
      return html;
    }

    toggleConfigMenu() {
      const menuContainer = document.getElementById('uals-menu-container');
      menuContainer.classList.toggle('show');
    }

    _render() {
      this._renderBanner();
      const configBtnHTML = this._configButtonHTML();
      const runAutoBtnHTML = this._runAutoSurveyButtonHTML();
      const btnContainer = `
        <div id="uals-btn-container">
          ${configBtnHTML}
          ${runAutoBtnHTML}
        </div>
      `;
      this._insertElement(btnContainer);
      const configMenu = this._configMenu();
      this._insertElement(configMenu);
      const configBtn = document.querySelector('#uals-config-btn');
      const runAutoBtn = document.querySelector('#uals-run-btn');
      configBtn.addEventListener('click', this.toggleConfigMenu);
      runAutoBtn.addEventListener('click', () => {
        const sm = new SurveyManager(this._getSurveyURLs());
        sm.run();
      });
    }
  }

  (function () {
    if (window.location.pathname === '/sinhvien/phieukhaosat') {
      new Home();
    } else {
      new FillInForm();
    }
  })();
})();
