const DataManager = {
  greenhouseData: [],
  users: {},
  greenhouseBoxes: {},
  recommendations: [],

  initialize() {
    this.loadData();
    this.loadUsers();
    this.loadBoxes();
    this.loadRecommendations();
  },

  loadData() {
    this.greenhouseData = JSON.parse(localStorage.getItem("greenhouseData")) || [];
  },

  loadUsers() {
    this.users = JSON.parse(localStorage.getItem("users")) || this.getDefaultUsers();
    if (!localStorage.getItem("users")) {
      localStorage.setItem("users", JSON.stringify(this.users));
    }
  },

  getDefaultUsers() {
    return {
      farmer1: { password: "1234", role: "grower" },
      farmer2: { password: "1234", role: "grower" },
      farmer3: { password: "1234", role: "grower" },
      expert1: { password: "1234", role: "expert" },
      expert2: { password: "1234", role: "expert" },
      expert3: { password: "1234", role: "expert" },
      admin1: { password: "1234", role: "admin" },
      admin2: { password: "1234", role: "admin" }
    };
  },

  loadBoxes() {
    this.greenhouseBoxes = JSON.parse(localStorage.getItem("greenhouseBoxes")) || {};
    if (Object.keys(this.greenhouseBoxes).length === 0) {
      this.setDefaultBoxes();
    }
  },

  setDefaultBoxes() {
    this.greenhouseBoxes = {
      farmer1: [
        { id: "box1", name: "گوجه فرنگی", cropType: "گوجه‌فرنگی" },
        { id: "box2", name: "خیار", cropType: "خیار" }
      ],
      farmer2: [{ id: "box3", name: "کاهو", cropType: "کاهو" }]
    };
    localStorage.setItem("greenhouseBoxes", JSON.stringify(this.greenhouseBoxes));
  },

  saveBox(currentUser, box) {
    const boxes = this.greenhouseBoxes[currentUser] || [];
    boxes.push(box);
    this.greenhouseBoxes[currentUser] = boxes;
    localStorage.setItem("greenhouseBoxes", JSON.stringify(this.greenhouseBoxes));
  },

  updateBox(currentUser, boxId, newName) {
    const boxes = this.greenhouseBoxes[currentUser] || [];
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      box.name = newName;
      localStorage.setItem("greenhouseBoxes", JSON.stringify(this.greenhouseBoxes));
    }
  },

  deleteBox(currentUser, boxId) {
    const boxes = this.greenhouseBoxes[currentUser] || [];
    this.greenhouseBoxes[currentUser] = boxes.filter(b => b.id !== boxId);
    localStorage.setItem("greenhouseBoxes", JSON.stringify(this.greenhouseBoxes));
  },

  saveData(data) {
    this.greenhouseData.push(data);
    localStorage.setItem("greenhouseData", JSON.stringify(this.greenhouseData));
  },

  saveRecommendation(rec) {
    this.recommendations.push(rec);
    localStorage.setItem("recommendations", JSON.stringify(this.recommendations));
  },

  loadRecommendations() {
    this.recommendations = JSON.parse(localStorage.getItem("recommendations")) || [];
  }
};

const Auth = {
  login(username, password, errorMessageElement) {
    const user = DataManager.users[username];
    if (!user || user.password !== password) {
      errorMessageElement.textContent = "نام کاربری یا رمز اشتباه است.";
      return false;
    }

    localStorage.setItem("loggedInUser", username);

    // چک کردن اولین ورود
    if (password === "1234") {
      window.location.href = "change-password.html";
    } else {
      window.location.href = `${user.role}.html`;
    }

    return true;
  },

  checkFirstLogin(username) {
    const user = DataManager.users[username];
    if (user && user.password === "1234") {
      UI.showToast("لطفاً رمز عبور خود را تغییر دهید.", "orange");
      window.location.href = "change-password.html";
    }
  },

  logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  }
};

function changePassword() {
  const newPassword = document.getElementById("new-password").value;
  const errorMessage = document.getElementById("error-message");

  if (!newPassword || newPassword.length < 4) {
    errorMessage.textContent = "رمز باید حداقل 4 کاراکتر باشد.";
    return;
  }

  const username = localStorage.getItem("loggedInUser");
  const users = DataManager.users;
  users[username].password = newPassword;

  localStorage.setItem("users", JSON.stringify(users));

  UI.showToast("رمز با موفقیت تغییر کرد.", "green");
  setTimeout(() => {
    window.location.href = "app.html";
  }, 1000);
}

function loadBoxes() {
  const currentUser = localStorage.getItem("loggedInUser");
  const boxesList = document.getElementById("boxes-list");
  const boxes = DataManager.greenhouseBoxes[currentUser] || [];

  boxesList.innerHTML = "";
  boxes.forEach(box => {
    const li = document.createElement("li");
    li.className = "collection-item";
    li.innerHTML = `
      <span contenteditable="true" onblur="renameBox('${box.id}', this.innerText)">
        ${box.name}
      </span>
      <a href="#!" onclick="deleteBox('${box.id}')" class="secondary-content red-text">
        <i class="fas fa-trash"></i>
      </a>
      <a href="data-entry.html?boxId=${box.id}" class="secondary-content">
        <i class="fas fa-arrow-left"></i>
      </a>
    `;
    boxesList.appendChild(li);
  });
}

function renameBox(id, newName) {
  const currentUser = localStorage.getItem("loggedInUser");
  const boxes = DataManager.greenhouseBoxes[currentUser];
  const box = boxes.find(b => b.id === id);
  if (box) {
    box.name = newName;
    localStorage.setItem("greenhouseBoxes", JSON.stringify(DataManager.greenhouseBoxes));
    loadBoxes();
  }
}

function deleteBox(id) {
  const currentUser = localStorage.getItem("loggedInUser");
  DataManager.deleteBox(currentUser, id);
  loadBoxes();
}

document.getElementById("add-box-form")?.addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("box-name").value;
  const cropType = document.getElementById("crop-type-select").value;
  const currentUser = localStorage.getItem("loggedInUser");

  const newBox = {
    id: "box" + Math.floor(Math.random() * 1000),
    name,
    cropType
  };

  DataManager.saveBox(currentUser, newBox);
  loadBoxes();
  this.reset();
});