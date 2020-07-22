function getLbCookie() {
  const albCookie = document.cookie
    .split("; ")
    .map(x => x.split("="))
    .find(x => x[0] == "AWSALB");

  return albCookie && encodeURIComponent(albCookie[1]);
}

function getInstance() {
  fetch("/instance");
}

function setInstance1() {
  fetch("/set/" + window.instance1.cookie);
}

function setInstance2() {
  fetch("/set/" + window.instance2.cookie);
}

function clearInstance() {
  fetch("/clear");
}

function init() {
  fetch("/instance")
    .then(res => res.json())
    .then(res => {
      window.instance1 = {
        instance: res.instance,
        cookie: getLbCookie()
      };

      return fetch("/clear");
    })
    .then(() => fetch("/instance"))
    .then(res => res.json())
    .then(res => {
      window.instance2 = {
        instance: res.instance,
        cookie: getLbCookie()
      };

      return fetch("/clear");
    });
}

init();

