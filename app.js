let statusList = ["planning","current","completed","on-hold","dropped","revisiting"];
let selectedMedia = null;
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
typeSelect.addEventListener("change",updateStatusLabel);

function clearResults(){
    if(searchInput.value === ""){
        searchResults.textContent = "";
    }

};

function updateStatusLabel(){
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

};

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
        if(entry.cover){
            const img = document.createElement("img");
            img.src = entry.cover;
            img.alt = entry.title;
            li.appendChild(img);
        }
        const listItem = document.createElement("span");
        listItem.textContent = `${entry.title} - ${entry.type}`;
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete item";
        deleteBtn.addEventListener("click",function(){

            if(confirm("Do you want to remove from shelf")){
                FollowingList = FollowingList.filter(e => e.id !== entry.id);
                saveEntries();
                renderEntries();
            }

        });
        const select = document.createElement("select");
        for(const value of statusList){
            const option = document.createElement("option");
            option.value = value;
            option.textContent = getStatusLabel(value,entry.type);
            select.appendChild(option);
        }
        select.value = entry.status;
        select.addEventListener("change",function(){
            entry.status = select.value
            saveEntries();
        });
        const input = document.createElement("input");
        input.type = "number";
        input.min = 1;
        input.max = 10
        input.placeholder = "Rating (1-10)";
        input.value = entry.rating;
        input.addEventListener("change",function(){
            if(input.value === ""){
                entry.rating = input.value;
                saveEntries();
                return;
            }
            if(!(Number(input.value) >= 1 && Number(input.value) <= 10)){
                alert("Rating is from 1-10");
                input.value = entry.rating;
                return;
            }

            entry.rating = input.value;
            saveEntries();

        });


        li.appendChild(listItem);
        li.appendChild(select);
        li.appendChild(input);
        li.appendChild(deleteBtn);

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
        window.alert("Title not inputted");
        return;
    }

     if (selectedMedia && FollowingList.some(entry => entry.anilistId === selectedMedia.id)) {
        alert("Already on your shelf!");
        return;
    }

    const titleMatch = FollowingList.some(
    entry => entry.title.toLowerCase() === title.toLowerCase()
    );
    if (titleMatch && !confirm("A title with this name is already on your shelf. Add it anyway?")) {
        return;
    }
    const newEntry = {id: crypto.randomUUID(),title: title,type: type,status: status,rating: rating, anilistId: selectedMedia ? selectedMedia.id : null, cover: selectedMedia ? selectedMedia.coverImage.medium : null,};
    FollowingList.push(newEntry);
    saveEntries();
    renderEntries();
    titleInput.value = "";
    ratingInput.value = "";
    selectedMedia = null;


});

// When the page first loads, show any saved entries
renderEntries();

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const searchResults = document.getElementById("search-results");

searchInput.addEventListener("input",clearResults);
searchInput.addEventListener("keydown",function(event){
    if(event.key === "Enter"){
        runSearch();
    }

});

// async because we await the search inside
async function runSearch(){
    const searchText = searchInput.value.trim();

    if(searchText === "") return;

    searchResults.textContent = "Searching...";

    let results;
    try {
        results = await searchAniList(searchText);
    } catch (error) {
        searchResults.textContent = "Couldn't connect to provider";
        console.error(error)
        return;
    }

    searchResults.innerHTML = "";   // clear "Searching..."

    if(results.length === 0){
        searchResults.textContent = "No results found";
        return;
    }

    for (const media of results) {
        const title = media.title.english || media.title.romaji;
        const type = getMediaType(media);

        const card = document.createElement("div");
        const img = document.createElement("img");
        img.src = media.coverImage.medium;
        img.alt = title;
        const text = document.createElement("p");
        const progress = getProgressLabel(media);
        text.textContent = `${title} - ${type} - ${progress}`;
        const coverButton = document.createElement("button");
        coverButton.appendChild(img);
        coverButton.title = `Select ${title}`;
        coverButton.className = "cover-btn";

        coverButton.addEventListener("click",function(){
            selectedMedia = media;
            const selectedCover = searchResults.querySelector(".cover-btn.selected");
            if(selectedCover){
                selectedCover.classList.remove("selected");
            }
            coverButton.classList.add("selected");
            document.getElementById("title").value = title;
            document.getElementById("type").value = type;
            updateStatusLabel();


        });

        card.appendChild(coverButton)
        card.appendChild(text);
        searchResults.appendChild(card);
    }
};

searchBtn.addEventListener("click", runSearch);




