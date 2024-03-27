document.getElementById("fileInput").addEventListener("change", function () {
  updateFileList(this.files);
  uploadFiles();
});

document.body.addEventListener("drop", function (event) {
  event.preventDefault();
  event.stopPropagation();
  updateFileList(event.dataTransfer.files);
  uploadFiles();
});

document.body.addEventListener("dragover", function (event) {
  event.preventDefault();
  event.stopPropagation();
});

function updateFileList(files) {
  const uploadText = document.getElementById("uploadText");
  const fileList = document.getElementById("fileList");
  uploadText.textContent = "Selected Files:";
  fileList.innerHTML = "";
  for (let i = 0; i < files.length; i++) {
    const li = document.createElement("li");
    li.textContent = files[i].name;
    fileList.appendChild(li);
  }
}

function uploadFiles() {
  const fileInput = document.getElementById("fileInput");
  const files = fileInput.files;

  if (!files.length) {
    displayStatus("Please select at least one file.");
    return;
  }

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  const loadingIcon = document.getElementById("loadingIcon");

  loadingIcon.classList.remove("hidden");
  document.getElementById("uploadText").classList.add("hidden");
  document.getElementById("upload-icon").style.display = "none";

  const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);

  fetch("/api/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to upload files.");
      }
    })
    .then((data) => {
      const cdnLinks = data.cdnLinks;
      if (cdnLinks && cdnLinks.length > 0) {
        displayLinksInTable(cdnLinks);
        document.getElementById("uploadText").textContent = "";
      } else {
        displayStatus("No CDN links found.");
      }
    })
    .catch((error) => {
      console.error("Error uploading files:", error);
      displayStatus("Error uploading files. Please try again.");
    })
    .finally(() => {
      loadingIcon.classList.add("hidden");
      document.getElementById("uploadText").classList.remove("hidden");
      document.getElementById("fileInput").value = "";
      document.getElementById("fileList").value = "";
      document.getElementById("upload-box").style.display = "none";
      document.getElementById("fileInput").style.display = "none";
      document.getElementById("fileList").style.display = "none";
    });
}

function displayLinksInTable(links) {
  const userTable = document.getElementById("userTable");
  userTable.innerHTML = "";

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

  const uploadStatus = document.getElementById("uploadStatus");
  uploadStatus.classList.remove("hidden");
  document.getElementById("reloadButton").classList.remove("hidden");
}

function displayStatus(message) {
  const statusDiv = document.getElementById("uploadStatus");
  statusDiv.innerHTML = message;
  statusDiv.classList.remove("hidden");
  document.getElementById("reloadButton").classList.add("hidden");
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
  displaySuccessMessage();
}
function displaySuccessMessage() {
  const successMessage = document.getElementById("successMessage");
  successMessage.style.display = "block";
  setTimeout(() => {
    successMessage.style.display = "none";
  }, 3000);
}

function dismissSuccessMessage() {
  const successMessage = document.getElementById("successMessage");
  successMessage.style.display = "none";
}

document.getElementById("reloadButton").addEventListener("click", function () {
  location.reload();
});
