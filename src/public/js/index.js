document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");

  fileInput.addEventListener("change", function (event) {
    event.preventDefault();
    event.stopPropagation();
    uploadFiles(event.target.files);
  });

  document.body.addEventListener("dragover", function (event) {
    event.preventDefault();
    event.stopPropagation();
  });

  document.body.addEventListener("dragenter", function (event) {
    event.preventDefault();
    event.stopPropagation();
  });

  document.body.addEventListener("dragleave", function (event) {
    event.preventDefault();
    event.stopPropagation();
  });

  document.body.addEventListener("drop", function (event) {
    event.preventDefault();
    event.stopPropagation();
    uploadFiles(event.dataTransfer.files);
  });
});


async function uploadFiles(files) {
  if (!files || !files.length) {
    displayStatus("Error", "Please select at least one file");
    return;
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  let errorDetected = false;

  Array.from(files).forEach(file => {
    if (file.size > 25 * 1024 * 1024) {
      displayStatus("Error", `The file '${file.name}' exceeds the limit of max. 25MB per file`);
      errorDetected = true;
    }
  });

  if (errorDetected) {
    document.getElementById("fileInput").value = "";
    files.length = 0;
    return;
  }

  const loadingIcon = document.getElementById("loadingIcon");
  loadingIcon.classList.remove("hidden");
  document.getElementById("uploadText").classList.add("hidden");
  document.getElementById("upload-icon").style.display = "none";

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      timeout: 3600000,
    });

    if (response.ok) {
      const data = await response.json();
      const cdnLinks = data.cdnLinks;
      if (cdnLinks && cdnLinks.length > 0) {
        displayLinksInTable(cdnLinks);
        document.getElementById("uploadText").textContent = "";
        document.getElementById("fileInput").value = "";
        document.getElementById("upload-box").style.display = "none";
        document.getElementById("fileInput").style.display = "none";
      } else {
        displayStatus("Error", "Error uploading files. Please try again later.");
      }
    } else if (response.status === 460) {
      displayStatus("Error", "You cannot upload more than 500MB of data per single request");
    } else if (response.status === 461) {
      displayStatus("Error", "At least one file exceeds the limit of max. 25MB per file");
    } else if (response.status === 400) {
      displayStatus("Error", "Please upload at least one file");
    } else {
      displayStatus("Error", "Error uploading files. Please try again later.");
    }
  } catch (error) {
    displayStatus("Error", "Error uploading files. Please try again later.");
  } finally {
    loadingIcon.classList.add("hidden");
    document.getElementById("uploadText").classList.remove("hidden");
    document.getElementById("upload-icon").style.display = "flex";
  }
}



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

  cdnTable.classList.remove("hidden");
  displayStatus("Success", "CDN files uploaded successfully");
  document.getElementById("reloadButton").classList.remove("hidden");
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

document.getElementById("reloadButton").addEventListener("click", function () {
  location.reload();
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
