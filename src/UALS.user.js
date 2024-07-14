// ==UserScript==
// @name            UIT - Auto Lecture Survey (UALS)
// @version         3.0.0
// @author          Kevin Nitro
// @namespace       https://github.com/KevinNitroG
// @description     Userscript tự động khảo sát môn học UIT. Khuyến nghị disable script khi không sử dụng, tránh conflict với các khảo sát / link khác của trường.
// @downloadURL     https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/src/UALS.user.js
// @updateURL       https://github.com/KevinNitroG/UIT-Auto-Lecture-Survey/raw/main/src/UALS.user.js
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
  "use strict";

  const SELECTIONS = {
    firstOpts: {
      1: "<50%",
      2: "50-80%",
      3: ">80%",
      4: "Không biết chuẩn đầu ra là gì",
    },
    secondOpts: {
      1: "Dưới 50%",
      2: "Từ 50 đến dưới 70%",
      3: "Từ 70 đến dưới 90%",
      4: "Trên 90%",
    },
    thirdOpts: {
      1: "answer_cell_00MH01.answer-item.radio-item",
      2: "answer_cell_00MH02.answer-item.radio-item",
      3: "answer_cell_00MH03.answer-item.radio-item",
      4: "answer_cell_00MH04.answer-item.radio-item",
    },
  };

  const WINDOW_DONE_MSG = "AULS - Done a survey";
  const WINDOW_DONE_TITLE = "HOÀN THÀNH KHẢO SÁT";

  const STYLE = `
    #uals-container {
      align-items: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      // border: solid #115d9d 0.05rem;
    }

    .uals-btn-container {
      align-items: center;
      display: flex;
      justify-content: center;
    }

    .uals-btn {
      background-color: #115d9d;
      border-radius: 0.5rem;
      border: none;
      color: white;
      margin: 0.4rem 0.3rem;
      padding: 0.4rem 0.5rem;
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

    #select-1, #select-2, #select-3 {
      align-items: center;
      display: flex;
      flex-direction: row;
    }

    #select-1 > label, #select-2 > label, #select-3 > label {
      margin: 0 0.5rem 0 0;
      padding: 0 0.5rem 0 0.5rem;
      vertical-align: middle;
    }
  `;

  class Model {
    #firstOpts;
    #secondOpts;
    #thirdOpts;

    constructor() {
      this.#firstOpts = GM_getValue("userFirstOpts", []);
      this.#secondOpts = GM_getValue("userSecondOpts", []);
      this.#thirdOpts = GM_getValue("userThirdOpts", []);
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
      GM_setValue("userFirstOpts", this.#firstOpts);
      GM_setValue("userSecondOpts", this.#secondOpts);
      GM_setValue("userThirdOpts", this.#thirdOpts);
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
          text: "Bạn cần thiết lập các tuỳ chọn 🥵",
          title: "UALS",
          tag: "UALS-require_config",
        });
        return false;
      }
      return true;
    }
  }

  class DoSurvey {
    #firstOpts;
    #secondOpts;
    #thirdOpts;

    constructor() {
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
    _firstType() {
      const labels = document.querySelectorAll("label.answertext");
      for (const label of labels) {
        if (label.innerText.trim() === this.#firstOpts) label.click();
      }
    }

    // TODO: WIP. Find questions and each in question, select 1 random.
    /** Fill in the second type */
    _secondType() {
      // const labels = document.querySelectorAll('label.answertext');
    }

    _thirdType() {
      const questions = document.querySelectorAll(".answers-list.radio-list");
      if (questions.length === 0) return false;
      for (const question of questions) {
        question
          .querySelector(SELECTIONS[DoSurvey.getRandomElement(this.#thirdOpts)])
          .click();
      }
      return true;
    }

    _submit() {
      document
        .querySelector('button[type="submit"][id="movenextbtn"]')
        ?.click();
    }

    _done() {
      if (
        document.querySelector(".site-name")?.innerText.trim() ===
        WINDOW_DONE_TITLE
      ) {
        window.opener.postMessage(WINDOW_DONE_MSG, "*");
        window.close();
      }
    }

    _run() {
      this._done();
      let check = false;
      check = this._firstType() || check;
      check = this._secondType() || check;
      check = this._thirdType() || check;
      if (check) this._submit();
    }
  }

  class AutoRun {
    #surveys;
    #current;

    constructor(surveys) {
      this.#surveys = surveys;
      this.#current = 0;
      this._listenEvent = this._listenEvent.bind(this); // Copilot told me to do this. IDK why :v
      this._run();
    }

    _listenEvent(e) {
      if (e.data === WINDOW_DONE_MSG) {
        this.#current++;
        if (this.#current >= this.#surveys.length) {
          GM_notification({
            text: "Đã thực hiện xong tất cả các khảo sát 😇",
            title: "UALS",
            tag: "UALS-Auto_survey_done",
          });
          this._removeListener();
          return;
        }
        this._doSurveys();
      }
    }

    _addListener() {
      window.addEventListener("message", this._listenEvent);
    }

    _removeListener() {
      window.removeEventListener("message", this._listenEvent);
    }

    _doSurveys() {
      GM_openInTab(this.#surveys[this.#current], true);
    }

    _run() {
      if (this.#current >= this.#surveys.length) {
        GM_notification({
          text: "Không có khảo sát nào cả 😕",
          title: "UALS",
          tag: "UALS-No_survey",
        });
        return;
      }
      this._addListener();
      this._doSurveys();
    }
  }

  class ViewRunAuto {
    btnHTML() {
      return `
        <button class="uals-btn" id="uals-run-btn">
          Run Auto
        </button>
      `;
    }

    addHandler(getSurveyURLsFunc) {
      document
        .querySelector("#uals-run-btn")
        .addEventListener("click", () => new AutoRun(getSurveyURLsFunc()));
    }
  }

  class ViewConfig {
    #model;

    constructor(model) {
      this.#model = model;
    }

    btnHTML() {
      return `
        <button class="uals-btn" id="uals-config-btn">
          Config
        </button>
      `;
    }

    _saveConfigButtonHTML() {
      return `
        <button class="uals-btn" id="uals-save-config-btn">
          Save
        </button>
      `;
    }

    _resetConfigButtonHTML() {
      return `
        <button class="uals-btn" id="uals-reset-config-btn">
          Reset
        </button>
      `;
    }

    configMenuHTML() {
      return `
        <div id="uals-menu-container">
          <div class="uals-question-container">
            <h3 id="uals-menu-header">Chọn câu trả lời cho câu hỏi loại 1</h3>
            <form id="select-1">
              ${Object.entries(SELECTIONS.firstOpts)
                .map(
                  ([key, val]) =>
                    `
                    <input type="checkbox" name="select-1" id="select-1-${key}" value="${key}">
                    <label for="select-1-${key}">${val}</label>
                  `,
                )
                .join("")}
            </form>
          </div>
          <div class="uals-question-container">
            <h3 id="uals-menu-header">Chọn câu trả lời cho câu hỏi loại 2</h3>
            <form id="select-2">
              ${Object.entries(SELECTIONS.secondOpts)
                .map(
                  ([key, val]) =>
                    `
                  <input type="checkbox" name="select-2" id="select-2-${key}" value="${key}" />
                  <label for="select-2-${key}">${val}</label>
                `,
                )
                .join("")}
            </form>
          </div>
          <div class="uals-question-container">
            <h3 id="uals-menu-header">
              Chọn câu trả lời cho câu hỏi loại 3 (mức độ hài lòng)
            </h3>
            <form id="select-3">
              ${Object.entries(SELECTIONS.thirdOpts)
                .map(
                  ([key, _]) =>
                    `
                  <input type="checkbox" name="select-3" id="select-3-${key}" value="${key}" />
                  <label for="select-3-${key}">Mức ${key}</label>
                `,
                )
                .join("")}
            </form>
          </div>
          <div class="uals-btn-container">
            ${this._resetConfigButtonHTML()}
            ${this._saveConfigButtonHTML()}
          </div>
        </div>
      `;
    }

    toggleConfigMenu() {
      document.querySelector("#uals-menu-container")?.classList.toggle("show");
    }

    tickOptsToPage() {
      Object.values(this.#model.getUserOpts()).map((selections, optIndex) =>
        selections.forEach((selection) =>
          document
            .querySelector(
              `#select-${optIndex + 1} input[id="select-${optIndex + 1}-${selection}"]`,
            )
            .click(),
        ),
      );
    }

    _fetchUserOptsFromPage() {
      function getSelections(optTh) {
        return [
          ...document.querySelectorAll(`#select-${optTh} input:checked`),
        ].map((checkbox) => parseInt(checkbox.value));
      }
      return {
        firstOpts: getSelections(1),
        secondOpts: getSelections(2),
        thirdOpts: getSelections(3),
      };
    }

    _saveUserOptsHandler(handler) {
      handler.addEventListener("click", () => {
        const userOpts = this._fetchUserOptsFromPage();
        this.#model.setUserOpts(userOpts);
        this.#model.saveUserOpts();
        this.toggleConfigMenu();
      });
    }

    _resetUserOptsHandler(handler) {
      handler.addEventListener("click", () => {
        this.#model.deleteUserOpts();
        location.reload();
      });
    }

    addHandlers(preRender) {
      const configBtn = document.querySelector("#uals-config-btn");
      configBtn.addEventListener(
        "click",
        () => {
          preRender();
          this.tickOptsToPage();
        },
        {
          once: true,
        },
      );
      configBtn.addEventListener("click", this.toggleConfigMenu);
    }

    addLazyHandlers() {
      this._saveUserOptsHandler(
        document.querySelector("#uals-save-config-btn"),
      );
      this._resetUserOptsHandler(
        document.querySelector("#uals-reset-config-btn"),
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
      this.#viewRunAuto = new ViewRunAuto();
      this.#viewConfig = new ViewConfig(this.#model);
      this.#model.addStyles();
      this._render();
      this._addHandlers();
      if (!this.#model.checkUserOptsExist())
        document.querySelector("#uals-config-btn").click();
    }

    static _getSurveyURLs() {
      const urls = [...document.querySelectorAll("table a")];
      return urls.filter((url) =>
        url.innerHTML.includes("khảo sát về môn học"),
      );
    }

    _getContainer() {
      const html = `
        <div id="uals-container">
        </div>
      `;
      const position = document.querySelector("#content .content");
      position.insertAdjacentHTML("afterbegin", html);
      const container = position.querySelector("#uals-container");
      return container;
    }

    _insertElement(element) {
      this.#container.insertAdjacentHTML("beforeend", element);
    }

    _bannerHTML() {
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
      this.#viewConfig.addLazyHandlers();
    }

    _render() {
      this._insertElement(this._bannerHTML());
      const btnContainer = `
        <div class="uals-btn-container">
          ${this.#viewConfig.btnHTML()}
          ${this.#viewRunAuto.btnHTML()}
        </div>
      `;
      this._insertElement(btnContainer);
    }

    _addHandlers() {
      this.#viewConfig.addHandlers(() => this._renderConfigMenu());
      this.#viewRunAuto.addHandler(() => View._getSurveyURLs());
    }
  }

  class Controller {
    #view;

    constructor() {
      this.#view = new View();
      this.#view;
    }
  }

  const init = function () {
    if (window.location.pathname === "/sinhvien/phieukhaosat") new Controller();
    else new DoSurvey();
  };

  init();
})();
