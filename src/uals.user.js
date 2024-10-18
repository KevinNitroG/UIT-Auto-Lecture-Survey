// ==UserScript==
// @name            UIT - Auto Lecture Survey (UALS)
// @version         3.0.0
// @author          Kevin Nitro
// @namespace       https://github.com/KevinNitroG
// @description     Userscript tự động khảo sát môn học UIT. Khuyến nghị disable script khi không sử dụng, tránh conflict với các khảo sát / link khác của trường.
// @downloadURL     https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/src/uals.user.js
// @updateURL       https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/src/uals.user.js
// @supportURL      https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/issues
// @license         https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/LICENSE
// @icon            https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/assets/images/UIT-logo.png
// @run-at          document-idle
// @match           http*://student.uit.edu.vn/sinhvien/phieukhaosat
// @match           http*://survey.uit.edu.vn/index.php/survey/index
// @match           http*://survey.uit.edu.vn/index.php/survey/index/sid/*/token/*
// @grant           GM_addStyle
// @grant           GM_deleteValue
// @grant           GM_getValue
// @grant           GM_listValues
// @grant           GM_notification
// @grant           GM_openInTab
// @grant           GM_setValue
// @grant           window.close
// ==/UserScript==

(function () {
  'use strict';

  const SELECTIONS = {
    first: {
      opts: [
        { label: '<50%', selector: '' },
        { label: '50-80%', selector: '' },
        { label: '>80%', selector: '' },
        { label: 'Không biết chuẩn đầu ra là gì', selector: '' },
      ],
    },
    second: {
      opts: [
        { label: 'Dưới 50%', selector: '' },
        { label: 'Từ 50 đến dưới 70%', selector: '' },
        { label: 'Từ 70 đến dưới 90%', selector: '' },
        { label: 'Trên 90%', selector: '' },
      ],
    },
    third: {
      container: '.answers-list.radio-list',
      opts: [
        { selector: 'answer_cell_00MH01.answer-item.radio-item' },
        { selector: 'answer_cell_00MH02.answer-item.radio-item' },
        { selector: 'answer_cell_00MH03.answer-item.radio-item' },
        { selector: 'answer_cell_00MH04.answer-item.radio-item' },
      ],
    },
  };

  const BROADCAST_CHANNEL_NAME = 'uals';

  const SUBMIT_BUTTON_SELECTOR = 'button[type="submit"][id="movenextbtn"]';

  const SURVEY_DONE_MSG = 'uals-survey-done';
  const SURVEY_FAIL_MSG = 'uals-survey-fail';
  const WINDOW_DONE_TITLE = 'HOÀN THÀNH KHẢO SÁT';

  const STYLE = `
    #uals__container {
      align-items: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      // border: solid #115d9d 0.05rem;
    }

    .uals__btn-container {
      align-items: center;
      display: flex;
      justify-content: center;
    }

    .uals__btn {
      background-color: #115d9d;
      border-radius: 0.5rem;
      border: none;
      color: white;
      margin: 0.4rem 0.3rem;
      padding: 0.4rem 0.5rem;
      transition: background-color 0.3s ease-in-out;
    }

    .uals__btn:hover {
      background-color: #1678cb;
    }

    #uals__menu-container {
      display: none;
      overflow: hidden;
      transition: height 0.5s;
    }

    .uals__menu-container--show {
      display: inline-block !important;
      height: auto;
    }

    .uals__run-btn--unavailable, .uals__run-btn--unavailable:hover {
      cursor: default;
      filter: brightness(70%);
    }

    .uals__run-btn--running {
      background-color: red !important;
    }

    .uals__please_star {
      align-items: center;
      display: flex;
      justify-content: center;
    }

    .uals__form-select {
      align-items: center;
      display: flex;
      flex-direction: row;
    }

    .uals__form-select>label {
      margin: 0 0.5rem 0 0;
      padding: 0 0.5rem 0 0.5rem;
      vertical-align: middle;
    }
  `;

  class Model {
    #firstOpts;
    #secondOpts;
    #thirdOpts;
    #firstOptsKey;
    #secondOptsKey;
    #thirdOptsKey;

    constructor() {
      this.#firstOptsKey = 'userFirstOpts';
      this.#secondOptsKey = 'usersecondOpts';
      this.#thirdOptsKey = 'userthirdOpts';
      this.#firstOpts = GM_getValue(this.#firstOptsKey, []);
      this.#secondOpts = GM_getValue(this.#secondOptsKey, []);
      this.#thirdOpts = GM_getValue(this.#thirdOptsKey, []);
    }

    addStyles() {
      GM_addStyle(STYLE);
    }

    setUserOpts(userOpts) {
      this.#firstOpts = userOpts.firstOpts;
      this.#secondOpts = userOpts.secondOpts;
      this.#thirdOpts = userOpts.thirdOpts;
    }

    getUserOpts() {
      return {
        firstOpts: this.#firstOpts,
        secondOpts: this.#secondOpts,
        thirdOpts: this.#thirdOpts,
      };
    }

    saveUserOpts() {
      GM_setValue(this.#firstOptsKey, this.#firstOpts);
      GM_setValue(this.#secondOptsKey, this.#secondOpts);
      GM_setValue(this.#thirdOptsKey, this.#thirdOpts);
    }

    deleteUserOpts() {
      let keys = GM_listValues();
      for (const key of keys) {
        GM_deleteValue(key);
      }
    }

    checkUserOptsExist() {
      if (
        this.#firstOpts.length === 0 ||
        this.#secondOpts.length === 0 ||
        this.#thirdOpts.length === 0
      ) {
        GM_notification({
          text: 'Bạn cần thiết lập các tuỳ chọn 🥵',
          title: 'UALS',
          tag: 'uals-require_config',
        });
        return false;
      }
      return true;
    }
  }

  class BroadcastSvc {
    #channel;

    constructor() {
      this.#channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    }

    addReceiveMsgListener(callback) {
      const handleEvent = (ev) => {
        switch (ev?.data?.msg) {
          case SURVEY_DONE_MSG:
            callback();
            break;
          case SURVEY_FAIL_MSG:
            this.removeReceiveMsgListener();
            break;
        }
      };
      this.#channel.addEventListener('message', handleEvent);
    }

    removeReceiveMsgListener() {
      this.#channel.close();
    }

    sendDoneMsg() {
      this.#channel.postMessage({ msg: SURVEY_DONE_MSG });
    }

    sendFailMsg() {
      this.#channel.postMessage({ msg: SURVEY_FAIL_MSG });
    }
  }

  class DoSurvey {
    #broadcast;
    #firstOpts;
    #secondOpts;
    #thirdOpts;

    constructor() {
      this.#broadcast = BroadcastSvc();
      const {
        firstOpt: firstOpts,
        secondOpts,
        thirdOpts,
      } = new Model().getUserOpts();
      this.#firstOpts = firstOpts;
      this.#secondOpts = secondOpts;
      this.#thirdOpts = thirdOpts;
      this._run();
    }

    static getRandomElement(array) {
      const randomIndex = Math.floor(Math.random() * array.length);
      return array[randomIndex];
    }

    // TODO: WIP. Check this again. Be careful of value and index. It should be value
    /** Fill in the first type */
    _firstTypeRun() {
      const labels = document.querySelectorAll('label.answertext');
      for (const label of labels) {
        if (label.innerText.trim() === this.#firstOpts) {
          label.click();
        }
      }
    }

    // TODO: WIP. Find questions and each in question, select 1 random.
    /** Fill in the second type */
    _secondTypeRun() {
      // const labels = document.querySelectorAll('label.answertext');
    }

    _thirdTypeRun() {
      const questions = document.querySelectorAll(SELECTIONS.third.container);
      if (questions.length === 0) {
        return false;
      }
      questions.forEach((question) =>
        question
          .querySelector(
            SELECTIONS.third.opts[DoSurvey.getRandomElement(this.#thirdOpts)],
          )
          .click(),
      );
      return true;
    }

    _submit() {
      document.querySelector(SUBMIT_BUTTON_SELECTOR)?.click();
    }

    _done() {
      if (
        document.querySelector('.site-name')?.innerText.trim() ===
        WINDOW_DONE_TITLE
      ) {
        this.#broadcast.sendDoneMsg();
        window.close();
      }
    }

    _run() {
      this._done();
      let check = false;
      check = this._firstTypeRun() || check;
      check = this._secondTypeRun() || check;
      check = this._thirdTypeRun() || check;
      if (check) {
        this._submit();
      } else {
        this.#broadcast.sendFailMsg();
      }
    }
  }

  class AutoRun {
    #surveys;
    #current;
    #broadcast;

    constructor(surveys) {
      this.#surveys = surveys;
      this.#current = 0;
      this.#broadcast = BroadcastSvc();
      // this._iterateSurvey = this._iterateSurvey.bind(this); // Copilot told me to do this. IDK why :v
      this.#broadcast.addReceiveMsgListener(() => this._iterateSurvey());
      this._run();
    }

    _iterateSurvey() {
      this.#current++;
      if (this.#current >= this.#surveys.length) {
        GM_notification({
          text: 'Đã hoàn thành xong tất cả các khảo sát 😇',
          title: 'UALS',
          tag: 'uals-auto_survey_done',
        });
        this.#broadcast.removeReceiveMsgListener();
      } else {
        this._run();
      }
    }

    _run() {
      GM_openInTab(this.#surveys[this.#current], true);
    }
  }

  class ViewRunAuto {
    #surveyList;
    #autoRun;

    constructor(surveyList) {
      this.#surveyList = surveyList;
      this.#autoRun = null;
    }

    _startBtnHTML() {
      return `
        <button class="uals__btn" id="uals__run-btn">
          Run Auto
        </button>
      `;
    }

    _stopBtnHTML() {
      return `
        <button class="uals__btn uals__run-btn--running" id="uals__run-btn">
          Stop Auto
        </button>
      `;
    }

    _unavailableBtnHTML() {
      return `
        <button class="uals__btn uals__run-btn--unavailable" id="uals__run-btn" disabled>
          No Survey
        </button>
      `;
    }

    btnHTML() {
      return this.#surveyList.length === 0
        ? this._unavailableBtnHTML()
        : this._startBtnHTML();
    }

    addHandler() {
      document.querySelector('#uals__run-btn').addEventListener('click', () => {
        if (this.#autoRun) {
          GM_notification({
            text: 'Bạn đã dùng Auto Run rồi. Hãy refresh trang để refresh',
            title: 'UALS',
            tag: 'uals-already_auto_run',
          });
          return;
        }
        this.#autoRun = new AutoRun(this.#surveyList);
      });
    }
  }

  class ViewConfig {
    #model;

    constructor(model) {
      this.#model = model;
    }

    btnHTML() {
      return `
        <button class="uals__btn" id="uals__config-btn">
          Config
        </button>
      `;
    }

    _pleaseStarHTML() {
      return `
        <p class="uals__please_star">👆 Cho mình xin 1 star repo dới 👆</p>
      `;
    }

    _saveConfigBtnHTML() {
      return `
        <button class="uals__btn" id="uals__save-config-btn">
          Save
        </button>
      `;
    }

    _resetConfigBtnHTML() {
      return `
        <button class="uals__btn" id="uals__reset-config-btn">
          Reset
        </button>
      `;
    }

    configMenuHTML() {
      return `
        <div id="uals__menu-container">
          ${this._pleaseStarHTML()}
          <section class="uals__question-section">
            <h3 id="uals__menu-header">Chọn câu trả lời cho câu hỏi loại 1</h3>
            <form class="uals__form-select" id="uals__select-1">
              ${SELECTIONS.first.opts
                .map(
                  (opt, index) =>
                    `
                    <input type="checkbox" name="uals__select-1-${index}" id="uals__select-1-${index}" value="${index}">
                    <label for="uals__select-1-${index}">${opt.label}</label>
                  `,
                )
                .join('')}
            </form>
          </section>
          <section class="uals__question-section">
            <h3 id="uals__menu-header">Chọn câu trả lời cho câu hỏi loại 2</h3>
            <form class="uals__form-select" id="uals__select-2">
              ${SELECTIONS.second.opts
                .map(
                  (opt, index) =>
                    `
                  <input type="checkbox" name="uals__select-2-${index}" id="uals__select-2-${index}" value="${index}" />
                  <label for="uals__select-2-${index}">${opt.label}</label>
                `,
                )
                .join('')}
            </form>
          </section>
          <section class="uals__question-section">
            <h3 id="uals__menu-header">
              Chọn câu trả lời cho câu hỏi loại 3 (mức độ hài lòng)
            </h3>
            <form class="uals__form-select" id="uals__select-3">
              ${SELECTIONS.third.opts
                .map((_, index) => {
                  const level = index + 1;
                  return `
                  <input type="checkbox" name="uals__select-3-${level}" id="uals__select-3-${level}" value="${level}" />
                  <label for="uals__select-3-${level}">Mức ${level}</label>
                `;
                })
                .join('')}
            </form>
          </section>
          <div class="uals__btn-container">
            ${this._resetConfigBtnHTML()}
            ${this._saveConfigBtnHTML()}
          </div>
        </div>
      `;
    }

    toggleConfigMenu() {
      document
        .querySelector('#uals__menu-container')
        .classList.toggle('uals__menu-container--show');
    }

    tickOptsToPage() {
      Object.values(this.#model.getUserOpts()).forEach((opts, selectionIndex) =>
        opts.forEach((opt) =>
          document
            .querySelector(`#uals__select-${selectionIndex + 1}-${opt}`)
            .click(),
        ),
      );
    }

    _fetchUserOptsFromPage() {
      function getSelections(CSSSelector) {
        const element = document.querySelector(CSSSelector);
        const formData = new FormData(element);
        return Object.values(Object.fromEntries([...formData])).map((val) =>
          parseInt(val),
        );
      }
      return {
        firstOpts: getSelections('#uals__select-1'),
        secondOpts: getSelections('#uals__select-2'),
        thirdOpts: getSelections('#uals__select-3'),
      };
    }

    _saveUserOptsHandler(handler) {
      handler.addEventListener('click', () => {
        const userOpts = this._fetchUserOptsFromPage();
        this.#model.setUserOpts(userOpts);
        this.#model.saveUserOpts();
        this.toggleConfigMenu();
      });
    }

    _resetUserOptsHandler(handler) {
      handler.addEventListener('click', () => {
        this.#model.deleteUserOpts();
        location.reload();
      });
    }

    addHandlers() {
      const configBtn = document.querySelector('#uals__config-btn');
      configBtn.addEventListener('click', this.toggleConfigMenu);
      this._saveUserOptsHandler(
        document.querySelector('#uals__save-config-btn'),
      );
      this._resetUserOptsHandler(
        document.querySelector('#uals__reset-config-btn'),
      );
    }
  }

  class View {
    #container;
    #model;
    #viewRunAuto;
    #viewConfig;

    constructor() {
      this.#container = this._getContainer();
      this.#model = new Model();
      this.#viewRunAuto = new ViewRunAuto(View._getSurveyURLs());
      this.#viewConfig = new ViewConfig(this.#model);
      this.#model.addStyles();
      this._render();
      this._addHandlers();
      if (!this.#model.checkUserOptsExist()) {
        this.#viewConfig.toggleConfigMenu();
      }
    }

    static _getSurveyURLs() {
      const urls = [...document.querySelectorAll('table a')];
      return urls.filter((url) =>
        url.innerHTML.includes('khảo sát về môn học'),
      );
    }

    _getContainer() {
      const html = `
        <div id="uals__container">
        </div>
      `;
      const position = document.querySelector('#content .content');
      position.insertAdjacentHTML('afterbegin', html);
      const container = position.querySelector('#uals__container');
      return container;
    }

    _insertElement(element) {
      this.#container.insertAdjacentHTML('beforeend', element);
    }

    _headerHTML() {
      return `
        <h2 align="center" style="margin: auto;">
          <a href="https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey" target="_blank">
            UIT - Auto Lecture Survey
          </a>
        </h2>
      `;
    }

    _renderConfigMenu() {
      this._insertElement(this.#viewConfig.configMenuHTML());
    }

    _render() {
      this._insertElement(this._headerHTML());
      const btnContainer = `
        <div class="uals__btn-container">
          ${this.#viewConfig.btnHTML()}
          ${this.#viewRunAuto.btnHTML()}
        </div>
      `;
      this._insertElement(btnContainer);
      this._insertElement(this.#viewConfig.configMenuHTML());
      this.#viewConfig.tickOptsToPage();
    }

    _addHandlers() {
      this.#viewConfig.addHandlers();
      this.#viewRunAuto.addHandler();
    }
  }

  class Controller {
    #view;

    constructor() {
      this.#view = new View();
      this.#view;
    }
  }

  function init() {
    if (window.location.pathname === '/sinhvien/phieukhaosat') {
      new Controller();
    } else {
      new DoSurvey();
    }
  }

  init();
})();
