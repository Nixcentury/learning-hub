// The Hub supplies account context. No cached role, URL role selector, student
// directory or database request belongs in this account-access display.
(() => {
  const panels = [...document.querySelectorAll("[data-classroom-state]")];
  const account = document.querySelector("[data-classroom-account]");
  const name = document.querySelector("[data-account-name]");
  const email = document.querySelector("[data-account-email]");
  const delayed = document.querySelector("[data-access-delayed]");
  let currentState = "";
  let timer;

  function render(context) {
    const access = context?.classroom;
    const identity = context?.identity;
    const signedIn = identity?.status === "signed-in" && Boolean(identity.uid);
    let state = parent === window ? "standalone" : "loading";
    if (parent !== window && access) {
      if (!signedIn && access.state === "guest") state = "guest";
      if (signedIn && identity.uid === access.uid && ["loading", "student", "teacher", "error"].includes(access.state)) state = access.state;
    }
    const focusedPanel = document.activeElement?.closest("[data-classroom-state]");
    panels.forEach(panel => { panel.hidden = panel.dataset.classroomState !== state; });
    name.textContent = "";
    email.textContent = "";
    account.hidden = !signedIn || !access || access.uid !== identity.uid;
    if (!account.hidden) {
      name.textContent = String(access.displayName || access.email || "Learning Hub");
      email.textContent = String(access.email || "");
    }
    ["pending", "rejected", "revoked"].forEach(request => {
      document.querySelector("[data-request-" + request + "]").hidden = state !== "student" || access?.requestStatus !== request;
    });
    const warning = ["student", "teacher"].includes(state) && access?.warning === true;
    document.querySelector("[data-account-warning]").hidden = !warning;
    document.querySelector("[data-account-warning-retry]").hidden = !warning;
    if (state !== currentState) {
      clearTimeout(timer);
      delayed.hidden = true;
      if (state === "loading") timer = setTimeout(() => { delayed.hidden = false; }, 10000);
      if (focusedPanel?.hidden) panels.find(panel => !panel.hidden)?.querySelector("h2")?.focus();
    }
    currentState = state;
    document.body.dataset.classroomAccess = state;
  }

  document.addEventListener("hub-page-context", event => render(event.detail));
  document.querySelectorAll("[data-classroom-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (parent === window) return;
      parent.postMessage({ type: "learning-hub-classroom-action", action: button.dataset.classroomAction }, location.origin === "null" ? "*" : location.origin);
    });
  });
  render(null);
})();
