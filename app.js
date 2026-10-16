const addBtn = document.getElementById("add-btn");
const list = document.getElementById("list");


const typeSelect = document.getElementById("type");
const statusSelect = document.getElementById("status");
const currentOption = document.querySelector('#status option[value="current"]');
const planningOption = document.querySelector('#status option[value="planning"]');
const revisitingOption = document.querySelector('#status option[value="revisiting"]');
const completedOption = document.querySelector('#status option[value="completed"]');
const droppedOption = document.querySelector('#status option[value="dropped"]');
const onHoldOption = document.querySelector('#status option[value="on-hold"]');
//Changes the dropdown depending on Media type
typeSelect.addEventListener("change",function(){
    const isAnime = typeSelect.value === "Anime";
    if(isAnime){
        currentOption.textContent = "Watching";
        planningOption.textContent = "Plan to Watch";
        revisitingOption.textContent = "Re-Watching";
    }
    else{
        currentOption.textContent = "Reading";
        planningOption.textContent = "Plan to Read";
        revisitingOption.textContent = "Re-Reading";
    }
});

function getStatusLabel(status, type) {
    const isAnime = type === "Anime";
    if(status === "current") return isAnime ? "Watching" : "Reading";
    if(status === "planning") return isAnime ? "Plan to Watch" : "Plan to Read";
    if(status === "revisiting") return isAnime ? "Re-Watching" : "Re-Reading";
    if(status === "completed") return completedOption.textContent;
    if(status === "dropped") return droppedOption.textContent;
    if(status === "on-hold") return onHoldOption.textContent;
    return status;


};



//LOAD: get saved entries, or start with an empty array
let FollowingList = JSON.parse(localStorage.getItem("FollowingList")) || [];

//SAVE: write the entries array to localStorage
function saveEntries() {
    localStorage.setItem("FollowingList",JSON.stringify(FollowingList));
};

//DISPLAY:clear the list and rebuild it from the array
function renderEntries() {
    list.innerHTML = "";   // empties the <ul> so entries don't show up twice


    for(const entry of FollowingList){
        const li = document.createElement("li");
        li.textContent = `${entry.title} - ${entry.type} - ${getStatusLabel(entry.status,entry.type)}`;
        if(entry.rating !== ""){
            li.textContent += ` - ${entry.rating}/10`;
        }
        list.appendChild(li);

    }
};

addBtn.addEventListener("click", function () {
    const titleInput = document.getElementById("title");
    const typeInput = document.getElementById("type");
    const statusInput = document.getElementById("status");
    const ratingInput = document.getElementById("rating");


    const title = titleInput.value.trim();
    const rating = ratingInput.value;
    const status = statusInput.value;
    const type = typeInput.value;


    if(title.length === 0){
        window.alert("Title not found");
        return;
    }
    const newEntry = {title: title,type: type,status: status,rating: rating};
    FollowingList.push(newEntry);
    saveEntries();
    renderEntries();
    titleInput.value = "";
    ratingInput.value = "";


});

// When the page first loads, show any saved entries
renderEntries();

