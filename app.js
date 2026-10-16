const addbtn = document.getElementById("add-btn");
const list = document.getElementById("list");

addbtn.addEventListener("click",function(){
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
    const li = document.createElement("li")
    li.textContent = `${title} - ${type} - ${status}`;
    if (rating !== "") {
        li.textContent += ` - ${rating}/10`;
    }
    list.appendChild(li);
    titleInput.value = "";
    ratingInput.value = "";


});