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

  const FIRST_SELECTIONS = [
    "<50%",
    "50-80%",
    ">80%",
    "Không biết chuẩn đầu ra là gì",
  ];

  const SECOND_SELECTIONS = [
    "Dưới 50%",
    "Từ 50 đến dưới 70%",
    "Từ 70 đến dưới 90%",
    "Trên 90%",
  ];

  const THIRD_SELECTIONS = [
    "answer_cell_00MH01.answer-item.radio-item",
    "answer_cell_00MH02.answer-item.radio-item",
    "answer_cell_00MH03.answer-item.radio-item",
    "answer_cell_00MH04.answer-item.radio-item",
  ];

  const WINDOW_DONE_MSG = "AULS - Done form";
  const WINDOW_DONE_TITLE = "HOÀN THÀNH KHẢO SÁT";

  /**
   *
   * @class
   * @classdesc GM API to store, get, set value and CSS styles.
   */
  class GM {
    #firstOpt;
    #secondOpts;
    #thirdOpts;

    constructor() {
      this.#firstOpt = GM_getValue("firstOpt", -1);
      this.#secondOpts = GM_getValue("secondOpts", []);
      this.#thirdOpts = GM_getValue("thirdOpts", []);
    }

    addStyles() {
      GM_addStyle(`
        #uals-container {
          align-items: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: solid #115d9d 0.05rem;
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
          margin: auto 10px;
          vertical-align: middle;
        }
      `);
    }

    setUserOpts(userOpts) {
      this.#firstOpt = userOpts.firstOpt;
      this.#secondOpts = userOpts.secondOpts;
      this.#thirdOpts = userOpts.thirdOpts;
    }

    getUserOpts() {
      return {
        firstOpt: this.#firstOpt,
        secondOpts: this.#secondOpts,
        thirdOpts: this.#thirdOpts,
      };
    }

    saveUserOpts() {
      GM_setValue("firstOpt", this.#firstOpt);
      GM_setValue("secondOpts", this.#secondOpts);
      GM_setValue("thirdOpts", this.#thirdOpts);
    }

    deleteUserOpts() {
      let keys = GM_listValues();
      for (const key of keys) {
        GM_deleteValue(key);
      }
    }

    checkUserOpts() {
      if (
        this.#firstOpt === -1 ||
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

  class FillInForm {
    #firstOpt;
    #secondOpts;
    #thirdOpts;

    constructor() {
      const { firstOpt, secondOpts, thirdOpts } = new GM().getUserOpts();
      this.#firstOpt = firstOpt;
      this.#secondOpts = secondOpts;
      this.#thirdOpts = thirdOpts;
      this._run();
    }

    /**
     * @param {number} max Right limit of random number.
     * @returns {number} Random number from [0, max - 1]
     */
    static _genRanInt(max) {
      return Math.floor(Math.random() * max);
    }

    // TODO: WIP. Check this again. Be careful of value and index. It should be value
    /** Fill in the first type form */
    _firstForm() {
      const labels = document.querySelectorAll("label.answertext");
      for (const label of labels) {
        if (label.innerText.trim() === this.#firstOpt) label.click();
      }
    }

    // TODO: WIP. Find questions and each in question, select 1 random.
    /** Fill in the second type form */
    _secondForm() {
      // const labels = document.querySelectorAll('label.answertext');
    }

    _thirdForm() {
      const questions = document.querySelectorAll(".answers-list.radio-list");
      if (questions.length === 0) return false;
      for (const question of questions) {
        const randomIndex = this._genRanInt(this.#thirdOpts.length);
        question.querySelector(this.#thirdOpts[randomIndex]).click();
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
      check = this._firstForm() || check;
      check = this._secondForm() || check;
      check = this._thirdForm() || check;
      if (check) this._submit();
    }
  }

  /**
   *
   * @class
   * @classdesc Support automatically fill in forms in Home
   */
  class SurveyManager {
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

  /**
   *
   * @class
   * @classdesc Render, manage functions in Home
   */
  class Home {
    #container;
    #gm;

    constructor() {
      this.#container = this._getContainer();
      this.#gm = new GM();
      this.#gm.addStyles();
      this._render();
      if (!this.#gm.checkUserOpts()) {
        this._renderConfigMenu();
        this._toggleConfigMenu();
        this._tickOptsToPage();
      }
    }

    /**
     * @returns {string[]} An array of survey URLs
     */
    _getSurveyURLs() {
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
          UIT - Auto Lecture Survey - Kevin Nitro
        </h2>
      `;
    }

    _runAutoSurveyButtonHTML() {
      return `
        <button class="uals-btn" id="uals-run-btn">
          Run Auto
        </button>
      `;
    }

    _configButtonHTML() {
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

    _configMenuHTML() {
      let html = `
        <div id="uals-menu-container">
          <div class="uals-question-container">
            <h3 id="uals-menu-header">Chọn câu trả lời cho form loại 1</h3>
            <form id="select-1">
              ${FIRST_SELECTIONS.map(
                (val, i) =>
                  `
                    <input type="radio" name="select-1" id="select-1-${i}" value="${i}">
                    <label for="select-1-${i}">${val}</label>
                  `,
              ).join("")}
            </form>
          </div>
          <div class="uals-question-container">
            <h3 id="uals-menu-header">Chọn câu trả lời cho form loại 2</h3>
            <form id="select-2">
              ${SECOND_SELECTIONS.map(
                (val, i) =>
                  `
                  <input type="checkbox" name="select-2" id="select-2-${i}" value="${i}" />
                  <label for="select-2-${i}">${val}</label>
                `,
              ).join("")}
            </form>
          </div>
          <div class="uals-question-container">
            <h3 id="uals-menu-header">
              Chọn câu trả lời cho form loại 3 (mức độ hài lòng)
            </h3>
            <form id="select-3">
              ${THIRD_SELECTIONS.map(
                (_, i) =>
                  `
                  <input type="checkbox" name="select-3" id="select-3-${i}" value="${i}" />
                  <label for="select-3-${i}">Mức ${i + 1}</label>
                `,
              ).join("")}
            </form>
          </div>
          <div class="uals-btn-container">
            ${this._resetConfigButtonHTML()}
            ${this._saveConfigButtonHTML()}
          </div>
        </div>
      `;
      return html;
    }

    _toggleConfigMenu() {
      document.querySelector("#uals-menu-container")?.classList.toggle("show");
    }

    _tickOptsToPage() {
      const { firstOpt, secondOpts, thirdOpts } = this.#gm.getUserOpts();
      document
        .querySelector(`#select-1 input[id="select-1-${firstOpt}"]`)
        ?.click();
      for (const opt of secondOpts) {
        document.querySelector(`#select-2 input[id="select-2-${opt}"]`).click();
      }
      for (const opt of thirdOpts) {
        document.querySelector(`#select-3 input[id="select-3-${opt}"]`).click();
      }
    }

    _fetchUserOptsFromPage() {
      return {
        firstOpt: parseInt(
          document.querySelector("#select-1 input:checked").value,
        ),
        secondOpts: [
          ...document.querySelectorAll("#select-2 input:checked"),
        ].map((checkbox) => parseInt(checkbox.value)),
        thirdOpts: [
          ...document.querySelectorAll("#select-3 input:checked"),
        ].map((checkbox) => parseInt(checkbox.value)),
      };
    }

    _saveUserOptsListener(element) {
      element.addEventListener("click", () => {
        const userOpts = this._fetchUserOptsFromPage();
        this.#gm.setUserOpts(userOpts);
        this.#gm.saveUserOpts();
        this._toggleConfigMenu();
      });
    }

    _resetUserOptsListener(element) {
      element.addEventListener("click", () => {
        this.#gm.deleteUserOpts();
        location.reload();
      });
    }

    _renderConfigMenu() {
      this._insertElement(this._configMenuHTML());
      this._saveUserOptsListener(
        document.querySelector("#uals-save-config-btn"),
      );
      this._resetUserOptsListener(
        document.querySelector("#uals-reset-config-btn"),
      );
    }

    _render() {
      this._insertElement(this._bannerHTML());
      const btnContainer = `
        <div class="uals-btn-container">
          ${this._configButtonHTML()}
          ${this._runAutoSurveyButtonHTML()}
        </div>
      `;
      this._insertElement(btnContainer);
      const configBtn = document.querySelector("#uals-config-btn");
      configBtn.addEventListener(
        "click",
        () => {
          this._renderConfigMenu();
          this._tickOptsToPage();
        },
        { once: true },
      );
      configBtn.addEventListener("click", this._toggleConfigMenu);
      document
        .querySelector("#uals-run-btn")
        .addEventListener(
          "click",
          () => new SurveyManager(this._getSurveyURLs()),
        );
    }
  }

  (function () {
    if (window.location.pathname === "/sinhvien/phieukhaosat") {
      new Home();
    } else {
      new FillInForm();
    }
  })();
})();
