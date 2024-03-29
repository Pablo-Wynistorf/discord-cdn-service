document.addEventListener("DOMContentLoaded", function () {

  const links = JSON.parse(localStorage.getItem("cdnLinks")) || [];
      
  displayLinksInTable(links);

});

function displayLinksInTable(links) {
  const userTable = document.getElementById("userTable");
  const cdnTable = document.getElementById("cdnTable");
  userTable.innerHTML = "";

  if (links.length === 0) {
    displayStatus("Error", "Error uploading files. Please try again later.");
    return;
  }

  links.forEach((linkObj) => {
    for (const [fileName, cdnLink] of Object.entries(linkObj)) {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                    <button class="copy-btn bg-gray-700 text-white px-2 py-1 rounded" onclick="copyToClipboard('${cdnLink}')">Copy</button>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-300">${fileName}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                    <a href="${cdnLink}" target="_blank">${cdnLink}</a>
                </td>
            `;
      userTable.appendChild(row);
    }
  });
}

function copyToClipboard(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  displayStatus("Success", "Link copied to clipboard");
}

document.getElementById("upload-button").addEventListener("click", function () {
  window.location.href = "/";
});

function displayStatus(status, message) {
  if (status === "Success") {
    document.getElementById("statusMessage").classList.add("text-black");
    document.getElementById("statusMessage").classList.add("bg-green-400");
  } else {
    document.getElementById("statusMessage").classList.add("text-black");
    document.getElementById("statusMessage").classList.add("bg-red-400");
  }
  const statusMessage = document.getElementById("statusMessage");
  statusMessage.innerText = message;
  statusMessage.style.display = "flex";

  setTimeout(() => {
    dismissStatusMessage();
  }, 5000);
}

function dismissStatusMessage() {
  const statusMessage = document.getElementById("statusMessage");
  statusMessage.style.display = "none";
}

