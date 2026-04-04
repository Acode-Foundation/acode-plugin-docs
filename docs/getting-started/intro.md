<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dark Social</title>

<style>
body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #0d0d0d;
    color: white;
}

header {
    background: black;
    padding: 15px;
    text-align: center;
    font-size: 22px;
    border-bottom: 1px solid #333;
}

.profile {
    text-align: center;
    padding: 20px;
}

.profile img {
    width: 90px;
    border-radius: 50%;
    border: 2px solid #6a0dad;
}

.post-box {
    padding: 15px;
    text-align: center;
}

textarea {
    width: 90%;
    height: 70px;
    border-radius: 15px;
    border: none;
    padding: 10px;
    background: #1a1a1a;
    color: white;
}

button {
    margin-top: 10px;
    padding: 10px 20px;
    border: none;
    border-radius: 20px;
    background: #6a0dad;
    color: white;
    font-size: 14px;
}

.feed {
    padding: 10px;
}

.post {
    background: #1a1a1a;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 15px;
}

.like, .delete {
    cursor: pointer;
    margin-right: 10px;
    color: #aaa;
}
</style>

</head>
<body>

<header>🖤 Dark Social</header>

<div class="profile">
    <img src="https://via.placeholder.com/90">
    <h3>Mini Thom</h3>
    <p>Modo misterioso activado 🖤</p>
</div>

<div class="post-box">
    <textarea id="postText" placeholder="Escribe algo oscuro..."></textarea><br>
    <button onclick="addPost()">Publicar</button>
</div>

<div class="feed" id="feed"></div>

<script>
function addPost() {
    let text = document.getElementById("postText").value;

    if (text.trim() === "") return;

    let post = document.createElement("div");
    post.className = "post";

    post.innerHTML = `
        <p>${text}</p>
        <span class="like" onclick="likePost(this)">❤️ 0</span>
        <span class="delete" onclick="deletePost(this)">🗑️</span>
    `;

    document.getElementById("feed").prepend(post);
    document.getElementById("postText").value = "";
}

function likePost(element) {
    let count = parseInt(element.innerText.split(" ")[1]);
    count++;
    element.innerText = "❤️ " + count;
}

function deletePost(element) {
    element.parentElement.remove();
}
</script>

</body>
</html>
