(function () {
  "use strict";

  var TOTAL_DAYS = 10;
  var DOSES_PER_DAY = 3;
  var INTERVAL_H = 8;
  var FIRST_DOSE_H = 8; // first dose at 8:00 AM on the start date
  var TOTAL_DOSES = TOTAL_DAYS * DOSES_PER_DAY;

  var KEY_START = "pilltracker.start";
  var KEY_TAKEN = "pilltracker.taken";

  var startInput = document.getElementById("startDate");
  var scheduleEl = document.getElementById("schedule");
  var nextDoseEl = document.getElementById("nextDose");
  var nextCardEl = document.getElementById("nextCard");
  var progressEl = document.getElementById("progress");
  var barFillEl = document.getElementById("barFill");
  var resetBtn = document.getElementById("resetBtn");
  var savedNoteEl = document.getElementById("savedNote");

  // --- state ---------------------------------------------------------------
  function todayISO() {
    var d = new Date();
    return toISODate(d);
  }

  function toISODate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function loadStart() {
    var s = localStorage.getItem(KEY_START);
    if (!s) {
      s = todayISO();
      localStorage.setItem(KEY_START, s);
    }
    return s;
  }

  function loadTaken() {
    try {
      return JSON.parse(localStorage.getItem(KEY_TAKEN)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveTaken(taken) {
    localStorage.setItem(KEY_TAKEN, JSON.stringify(taken));
  }

  // --- schedule ------------------------------------------------------------
  function doseDate(startISO, index) {
    var parts = startISO.split("-");
    var d = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
      FIRST_DOSE_H,
      0,
      0,
      0
    );
    d.setHours(d.getHours() + index * INTERVAL_H);
    return d;
  }

  function fmtTime(d) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function fmtDay(d) {
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }

  // --- render --------------------------------------------------------------
  function render(scrollToNext) {
    var startISO = startInput.value || loadStart();
    var taken = loadTaken();
    var now = new Date();

    scheduleEl.innerHTML = "";

    var doses = [];
    for (var i = 0; i < TOTAL_DOSES; i++) {
      doses.push({ index: i, when: doseDate(startISO, i) });
    }

    // group by calendar day
    var groups = [];
    var byKey = {};
    doses.forEach(function (dose) {
      var key = toISODate(dose.when);
      if (!byKey[key]) {
        byKey[key] = { key: key, day: dose.when, items: [] };
        groups.push(byKey[key]);
      }
      byKey[key].items.push(dose);
    });

    var firstPending = null;
    var firstPendingEl = null;

    groups.forEach(function (group) {
      var groupEl = document.createElement("div");
      groupEl.className = "day-group";

      var doneCount = group.items.filter(function (d) {
        return taken[d.index];
      }).length;

      var head = document.createElement("div");
      head.className = "day-head";
      head.innerHTML =
        '<span class="day-title">' + fmtDay(group.day) + "</span>" +
        '<span class="day-count">' + doneCount + " / " + group.items.length + "</span>";
      groupEl.appendChild(head);

      group.items.forEach(function (dose) {
        var isTaken = !!taken[dose.index];
        var isPast = dose.when.getTime() < now.getTime();
        var dueSoon =
          !isTaken &&
          dose.when.getTime() - now.getTime() <= 30 * 60 * 1000 &&
          dose.when.getTime() - now.getTime() > 0;
        var overdue = !isTaken && isPast;

        var isFirstPending = !isTaken && !firstPending;
        if (isFirstPending) firstPending = dose;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dose" +
          (isTaken ? " done" : "") +
          (overdue ? " overdue" : "") +
          (dueSoon ? " due" : "");

        var sub = isTaken && taken[dose.index] !== true
          ? "Taken " + new Date(taken[dose.index]).toLocaleString([], { hour: "numeric", minute: "2-digit" })
          : "Dose " + (dose.index + 1) + " of " + TOTAL_DOSES;

        var badge = overdue
          ? '<span class="badge overdue">overdue</span>'
          : dueSoon
          ? '<span class="badge due">due now</span>'
          : "";

        btn.innerHTML =
          '<span class="check">' + (isTaken ? "✓" : "") + "</span>" +
          '<span class="dose-main">' +
            '<span class="dose-time">' + fmtTime(dose.when) + "</span>" +
            '<span class="dose-sub">' + sub + "</span>" +
          "</span>" +
          badge;

        btn.addEventListener("click", function () {
          var t = loadTaken();
          if (t[dose.index]) {
            delete t[dose.index];
          } else {
            t[dose.index] = new Date().toISOString();
          }
          saveTaken(t);
          render();
        });

        if (isFirstPending) firstPendingEl = btn;
        groupEl.appendChild(btn);
      });

      scheduleEl.appendChild(groupEl);
    });

    // status
    var doneTotal = Object.keys(taken).filter(function (k) {
      return Number(k) < TOTAL_DOSES && taken[k];
    }).length;
    progressEl.textContent = doneTotal + " / " + TOTAL_DOSES;
    barFillEl.style.width = (doneTotal / TOTAL_DOSES) * 100 + "%";

    nextCardEl.className = "status-card";
    if (!firstPending) {
      nextDoseEl.textContent = "All done 🎉";
      nextCardEl.classList.add("done");
    } else {
      var diff = firstPending.when.getTime() - now.getTime();
      nextDoseEl.textContent = fmtTime(firstPending.when) + " · " + fmtDay(firstPending.when);
      if (diff < 0) nextCardEl.classList.add("overdue");
      else if (diff <= 30 * 60 * 1000) nextCardEl.classList.add("due");
    }

    savedNoteEl.textContent = "Started " + startISO + ".";

    if (scrollToNext && firstPendingEl) {
      firstPendingEl.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  // --- init ----------------------------------------------------------------
  startInput.value = loadStart();
  startInput.addEventListener("change", function () {
    if (startInput.value) {
      localStorage.setItem(KEY_START, startInput.value);
      render();
    }
  });

  resetBtn.addEventListener("click", function () {
    if (confirm("Clear all check-ins? This cannot be undone.")) {
      localStorage.removeItem(KEY_TAKEN);
      render();
    }
  });

  render(true);
  // keep "overdue / due now" fresh while the page is open
  setInterval(function () { render(); }, 60 * 1000);
})();
