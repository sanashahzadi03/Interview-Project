// =========================================================
// script.js
// Part 1: Pages ko switch karna (Home / Dashboard / Add / ...)
// Part 2: Jo image file nahi mili usko chhupana
// Part 3: Aapka apna tracker code yahan likhein
// =========================================================


// ---------- Part 1: Page switching ----------

const pages = document.querySelectorAll(".page-view");     // saare pages
const navLinks = document.querySelectorAll(".nav-links a"); // upar wale menu links
const goButtons = document.querySelectorAll("[data-go]");   // jis par click se page badalta hai

// Ek page dikhao, baaki chhupa do
function showPage(name) {
  pages.forEach(function (page) {
    page.hidden = page.id !== name;
  });

  navLinks.forEach(function (link) {
    link.classList.toggle("active", link.dataset.go === name);
  });

  window.scrollTo(0, 0);
}

// Har data-go wale element par click lagao
goButtons.forEach(function (button) {
  button.addEventListener("click", function (event) {
    event.preventDefault();
    showPage(button.dataset.go);
  });
});

showPage("home"); // start me Home page dikhao


// ---------- Part 2: Missing images ----------
// Agar kisi <img> ki file images folder me nahi hai to wo chhup jati hai
// (tab neeche ka rang / box dikhta hai, broken-image icon nahi).

document.querySelectorAll("img").forEach(function (img) {
  function hideImage() {
    img.style.display = "none";
  }

  img.addEventListener("error", hideImage);

  // Agar error pehle hi aa chuka ho
  if (img.complete && img.naturalWidth === 0) {
    hideImage();
  }
});


// ---------- Part 3: Aapka tracker code ----------
// Yahan se aage LocalStorage, form validation, search, filters wagera likhein.

// ---------- Part 3: Data aur LocalStorage ----------

// LocalStorage me data is naam (key) se save hoga
const STORAGE_KEY = "interviewQuestions";

// Saare questions is array me rahenge
let questions = loadQuestions();

// LocalStorage se questions wapas lao
function loadQuestions() {
  const saved = localStorage.getItem(STORAGE_KEY);

  // Pehli baar app khule to kuch save nahi hota, to khali array do
  if (saved === null) {
    return [];
  }

  // Agar data kharab ho gaya ho to app crash na ho
  try {
    return JSON.parse(saved);
  } catch (error) {
    return [];
  }
}

// Questions ko LocalStorage me save karo
function saveQuestions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

// ---------- Step 2: Add Question form ----------

// Form ke elements dhoondo
const form = document.querySelector("#question-form");
const titleInput = document.querySelector("#title");
const categoryInput = document.querySelector("#category");
const difficultyInput = document.querySelector("#difficulty");
const statusInput = document.querySelector("#status");

// Error messages
const titleError = document.querySelector("#title-error");
const categoryError = document.querySelector("#category-error");
const difficultyError = document.querySelector("#difficulty-error");

// Ek field check karo: khali hai to error dikhao, theek hai to error hatao
function checkField(input, errorMessage, value) {
  if (value === "") {
    input.classList.add("invalid");   // lal border
    errorMessage.hidden = false;      // error text dikhao
    return false;
  }

  input.classList.remove("invalid");
  errorMessage.hidden = true;
  return true;
}

// Jab form submit ho
form.addEventListener("submit", function (event) {
  event.preventDefault();             // page reload mat hone do

  // Form se values lo
  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const difficulty = difficultyInput.value;
  const status = statusInput.value;

  // Teeno fields check karo
  const titleOk = checkField(titleInput, titleError, title);
  const categoryOk = checkField(categoryInput, categoryError, category);
  const difficultyOk = checkField(difficultyInput, difficultyError, difficulty);

  // Agar koi bhi field galat hai to yahin ruk jao
  if (!titleOk || !categoryOk || !difficultyOk) {
    return;
  }

  // Naya question banao
  const newQuestion = {
    id: Date.now(),
    title: title,
    category: category,
    difficulty: difficulty,
    status: status
  };

  questions.push(newQuestion);   // array me add karo
  saveQuestions();               // LocalStorage me save karo
  form.reset();                  // form khali kar do

      clearFilters();                // purane filters hata do, taake naya question dikhe
  renderQuestions();             // list dobara banao            // list dobara banao
  showPage("questions");         // Questions page par le jao
});

// ---------- Step 3: Questions ko list me dikhana ----------

const questionList = document.querySelector("#question-list");

// Category, difficulty aur status ke hisaab se CSS class aur text
const tagClass = { DSA: "", Git: "git", Technical: "tech" };
const tagText = { DSA: "DSA", Git: "Git", Technical: "Tech" };
const statusClass = { "Pending": "pending", "In Progress": "progress", "Completed": "done" };

// Ek question ka card banao
function createQuestionCard(question) {
  const card = document.createElement("li");
  card.className = "card q-card";

  card.innerHTML = `
    <button class="delete" data-id="${question.id}" aria-label="Delete question">&times;</button>
    <div class="q-tag ${tagClass[question.category]}">${tagText[question.category]}</div>
    <div>
      <h3></h3>
      <span class="badge ${question.difficulty.toLowerCase()}">${question.difficulty}</span>
      <button class="badge ${statusClass[question.status]}" data-status-id="${question.id}" title="Click to change status">${question.status}</button>
    </div>
  `;

  // Title alag se daalte hain (neeche explain kiya hai kyun)
  card.querySelector("h3").textContent = question.title;

  return card;
}

function renderQuestions() {
  questionList.innerHTML = "";               // pehle list khali karo

  const filtered = getFilteredQuestions();   // search aur filter ke baad bache hue questions

  filtered.forEach(function (question) {
    const card = createQuestionCard(question);
    questionList.appendChild(card);          // card list me daalo
  });

  // Empty state: koi question hai hi nahi
  emptyState.hidden = questions.length > 0;

  // No-results state: questions hain, lekin filter se kuch nahi bacha
  noResultsState.hidden = !(questions.length > 0 && filtered.length === 0);

  updateDashboard();                         // dashboard ke numbers update karo
   updateProgress();    
}



// ---------- Step 4: Delete aur status change ----------

// Status ka order: click karne par isi order me aage badhega
const statusOrder = ["Pending", "In Progress", "Completed"];

// Question delete karo
function deleteQuestion(id) {
  const sure = confirm("Delete this question?");
  if (!sure) {
    return;                                   // user ne cancel kiya
  }

  // Sirf wo questions rakho jinki id is id se alag hai
  questions = questions.filter(function (question) {
    return question.id !== id;
  });

  saveQuestions();
  renderQuestions();
}

// Question ka status agle status par le jao
function changeStatus(id) {
  const question = questions.find(function (item) {
    return item.id === id;
  });

  const currentIndex = statusOrder.indexOf(question.status);
  const nextIndex = (currentIndex + 1) % statusOrder.length;   // aakhir ke baad wapas 0
  question.status = statusOrder[nextIndex];

  saveQuestions();
  renderQuestions();
}

// List par click suno (delete button ya status badge)
questionList.addEventListener("click", function (event) {
  const deleteButton = event.target.closest(".delete");
  const statusButton = event.target.closest("[data-status-id]");

  if (deleteButton) {
    deleteQuestion(Number(deleteButton.dataset.id));
  }

  if (statusButton) {
    changeStatus(Number(statusButton.dataset.statusId));
  }
});


// ---------- Step 5: Search aur filters ----------

const searchInput = document.querySelector("#search-input");
const filterCategory = document.querySelector("#filter-category");
const filterStatus = document.querySelector("#filter-status");
const filterDifficulty = document.querySelector("#filter-difficulty");

// Wo questions wapas do jo search aur filters se match karte hain
function getFilteredQuestions() {
  const searchText = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;
  const status = filterStatus.value;
  const difficulty = filterDifficulty.value;

  return questions.filter(function (question) {
    const matchesSearch = question.title.toLowerCase().includes(searchText);
    const matchesCategory = category === "" || question.category === category;
    const matchesStatus = status === "" || question.status === status;
    const matchesDifficulty = difficulty === "" || question.difficulty === difficulty;

    return matchesSearch && matchesCategory && matchesStatus && matchesDifficulty;
  });
}

// Search box aur teeno dropdown khali kar do
function clearFilters() {
  searchInput.value = "";
  filterCategory.value = "";
  filterStatus.value = "";
  filterDifficulty.value = "";
}

// Search box me kuch likhte hi list update karo
searchInput.addEventListener("input", renderQuestions);

// Dropdown badalte hi list update karo
filterCategory.addEventListener("change", renderQuestions);
filterStatus.addEventListener("change", renderQuestions);
filterDifficulty.addEventListener("change", renderQuestions);

// ---------- Step 6: Empty state aur no-results state ----------

const emptyState = document.querySelector("#empty-state");
const noResultsState = document.querySelector("#no-results-state");
const clearFiltersButton = document.querySelector("#clear-filters-button");

// "Clear filters" button dabane par sab filters hata do
clearFiltersButton.addEventListener("click", function () {
  clearFilters();
  renderQuestions();
});

// ---------- Step 7: Dashboard ----------

const statTotal = document.querySelector("#stat-total");
const statDsa = document.querySelector("#stat-dsa");
const statInterview = document.querySelector("#stat-interview");
const statMachine = document.querySelector("#stat-machine");
const machineTile = document.querySelector("#machine-tile");

// Machine coding ka status (ye kisi question ka hissa nahi, isliye alag save hota hai)
const MACHINE_KEY = "machineStatus";
const machineStatuses = ["Not Started", "In Progress", "Completed"];
let machineStatus = localStorage.getItem(MACHINE_KEY) || "Not Started";

// Un questions ki ginti jo Completed hain aur diye gaye categories me aate hain
function countCompleted(categories) {
  const completed = questions.filter(function (question) {
    return categories.includes(question.category) && question.status === "Completed";
  });

  return completed.length;
}

// Dashboard ke chaaron numbers update karo
function updateDashboard() {
  statTotal.textContent = questions.length;
  statDsa.textContent = countCompleted(["DSA"]);
  statInterview.textContent = countCompleted(["Git", "Technical"]);
  statMachine.textContent = machineStatus;
}

// Machine coding tile par click karne se status agla ho jaye
machineTile.addEventListener("click", function () {
  const currentIndex = machineStatuses.indexOf(machineStatus);
  const nextIndex = (currentIndex + 1) % machineStatuses.length;

  machineStatus = machineStatuses[nextIndex];
  localStorage.setItem(MACHINE_KEY, machineStatus);
  updateDashboard();
   updateProgress();

  
});


// ---------- Step 8: Progress ----------

const progressRing = document.querySelector("#progress-ring");
const progressPercent = document.querySelector("#progress-percent");
const progressText = document.querySelector("#progress-text");

// done aur total se percentage nikalo (0 se 100)
function getPercent(done, total) {
  if (total === 0) {
    return 0;                       // zero se divide nahi kar sakte
  }
  return Math.round((done / total) * 100);
}

// Ek category ka percentage (jaise sirf DSA ke questions me se kitne Completed hain)
function getCategoryPercent(category) {
  const inCategory = questions.filter(function (question) {
    return question.category === category;
  });

  const completed = inCategory.filter(function (question) {
    return question.status === "Completed";
  });

  return getPercent(completed.length, inCategory.length);
}

// Machine coding ka percentage uske status se
function getMachinePercent() {
  if (machineStatus === "Completed") {
    return 100;
  }
  if (machineStatus === "In Progress") {
    return 50;
  }
  return 0;
}

// Ek bar ki width aur uska percentage text set karo
function setBar(name, percent) {
  document.querySelector("#bar-" + name).style.width = percent + "%";
  document.querySelector("#pct-" + name).textContent = percent + "%";
}

// Progress page ka sab kuch update karo
function updateProgress() {
  const total = questions.length;

  const completed = questions.filter(function (question) {
    return question.status === "Completed";
  });

  const percent = getPercent(completed.length, total);

  // Ring
  progressRing.style.setProperty("--percent", percent);
  progressPercent.textContent = percent + "%";
  progressText.textContent = completed.length + " of " + total + " completed";

  // Bars
  setBar("dsa", getCategoryPercent("DSA"));
  setBar("git", getCategoryPercent("Git"));
  setBar("technical", getCategoryPercent("Technical"));
  setBar("machine", getMachinePercent());
}


// ---------- Page khulte hi list dikhao (ye line hamesha sabse neeche rahegi) ----------
renderQuestions();