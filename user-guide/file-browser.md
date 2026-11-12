
<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sidhu Village Farming Game</title>
<style>
body {
  margin:0;
  background:#243b25;
  color:white;
  font-family:Arial;
  text-align:center;
}
h2 {color:#ffd34e}
canvas {
  width:95%;
  max-width:600px;
  background:#8bc65a;
  border:4px solid #e6c18a;
  border-radius:12px;
  touch-action:manipulation;
}
button {
  padding:13px;
  margin:5px;
  border:0;
  border-radius:10px;
  background:#e9ae36;
  font-weight:bold;
  font-size:15px;
}
.controls {max-width:500px;margin:auto}
</style>
</head>
<body>

<h2>🚜 SIDHU VILLAGE FARMING</h2>
<p>💰 पैसे: <span id="money">500</span> |
🌾 फसल: <span id="crop">0</span></p>

<canvas id="game" width="600" height="400"></canvas>

<div class="controls">
  <p>अपना काम चुनो:</p>
  <button onclick="action='plant'">🌱 बीज बोओ</button>
  <button onclick="action='water'">💧 पानी दो</button>
  <button onclick="action='harvest'">🌾 फसल काटो</button>
  <button onclick="action='tractor'">🚜 ट्रैक्टर</button>
  <br>
  <button onclick="move(0,-1)">⬆️</button><br>
  <button onclick="move(-1,0)">⬅️</button>
  <button onclick="move(1,0)">➡️</button><br>
  <button onclick="move(0,1)">⬇️</button>
  <br>
  <button onclick="music()">🎵 Music ON/OFF</button>
</div>

<p id="message">अपने गाँव में खेती शुरू करो!</p>

<script>
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

let money=500,crops=0;
let action="plant";
let player={x:2,y:2};
let farm=Array.from({length:5},()=>Array(7).fill(0));
let musicOn=false;
let audio,osc,gain;

function draw(){
 ctx.clearRect(0,0,600,400);

 // गाँव का मैदान
 ctx.fillStyle="#83bd53";
 ctx.fillRect(0,0,600,400);

 // खेत
 for(let y=0;y<5;y++){
  for(let x=0;x<7;x++){
   let px=65+x*68,py=40+y*65;
   ctx.fillStyle="#9b6539";
   ctx.fillRect(px,py,55,52);
   if(farm[y][x]===1){
    ctx.fillText("🌱",px+13,py+35);
   }
   if(farm[y][x]===2){
    ctx.fillText("🌾",px+10,py+35);
   }
  }
 }
 // घर
 ctx.font="35px Arial";
 ctx.fillText("🏠",500,65);
 ctx.fillText("🐄",510,130);
 ctx.fillText("🚜",470,350);

 // खिलाड़ी
 ctx.font="38px Arial";
 ctx.fillText("👨‍🌾",65+player.x*68,40+player.y*65+38);

 document.getElementById("money").textContent=money;
 document.getElementById("crop").textContent=crops;
}

function move(dx,dy){
 player.x=Math.max(0,Math.min(6,player.x+dx));
 player.y=Math.max(0,Math.min(4,player.y+dy));
 draw();
}

canvas.onclick=function(e){
 let r=canvas.getBoundingClientRect();
 let x=Math.floor((e.clientX-r.left)*600/r.width);
 let y=Math.floor((e.clientY-r.top)*400/r.height);
 let gx=Math.floor((x-65)/68);
 let gy=Math.floor((y-40)/65);

 if(gx<0||gx>6||gy<0||gy>4)return;

 player.x=gx;player.y=gy;

 if(action==="plant" && farm[gy][gx]===0 && money>=20){
  farm[gy][gx]=1;money-=20;
  message("बीज बो दिया! 🌱");
 }
 else if(action==="water" && farm[gy][gx]===1){
  farm[gy][gx]=2;
  message("फसल तैयार हो गई! 🌾");
 }
 else if(action==="harvest" && farm[gy][gx]===2){
  farm[gy][gx]=0;crops++;money+=100;
  message("फसल बेचकर ₹100 मिले!");
 }
 else if(action==="tractor"){
  message("🚜 ट्रैक्टर खेत में चल रहा है!");
 }
 else{
  message("पहले सही काम चुनो!");
 }
 draw();
};

function message(t){
 document.getElementById("message").textContent=t;
}

// Original synthesized background tune
function music(){
 if(!audio){
  audio=new(window.AudioContext||window.webkitAudioContext)();
  osc=audio.createOscillator();
  gain=audio.createGain();
  osc.type="triangle";
  osc.frequency.value=196;
  gain.gain.value=0;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
 }
 if(audio.state==="suspended")audio.resume();
 musicOn=!musicOn;
 gain.gain.setTargetAtTime(
  musicOn?0.035:0,audio.currentTime,0.1
 );
 message(musicOn?"🎵 Music चालू है!":"Music बंद है");
}

draw();
</script>
</body>
</html>

<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sidhu Village Farming Game</title>
<style>
body {
  margin:0;
  background:#243b25;
  color:white;
  font-family:Arial;
  text-align:center;
}
h2 {color:#ffd34e}
canvas {
  width:95%;
  max-width:600px;
  background:#8bc65a;
  border:4px solid #e6c18a;
  border-radius:12px;
  touch-action:manipulation;
}
button {
  padding:13px;
  margin:5px;
  border:0;
  border-radius:10px;
  background:#e9ae36;
  font-weight:bold;
  font-size:15px;
}
.controls {max-width:500px;margin:auto}
</style>
</head>
<body>

<h2>🚜 SIDHU VILLAGE FARMING</h2>
<p>💰 पैसे: <span id="money">500</span> |
🌾 फसल: <span id="crop">0</span></p>

<canvas id="game" width="600" height="400"></canvas>

<div class="controls">
  <p>अपना काम चुनो:</p>
  <button onclick="action='plant'">🌱 बीज बोओ</button>
  <button onclick="action='water'">💧 पानी दो</button>
  <button onclick="action='harvest'">🌾 फसल काटो</button>
  <button onclick="action='tractor'">🚜 ट्रैक्टर</button>
  <br>
  <button onclick="move(0,-1)">⬆️</button><br>
  <button onclick="move(-1,0)">⬅️</button>
  <button onclick="move(1,0)">➡️</button><br>
  <button onclick="move(0,1)">⬇️</button>
  <br>
  <button onclick="music()">🎵 Music ON/OFF</button>
</div>

<p id="message">अपने गाँव में खेती शुरू करो!</p>

<script>
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

let money=500,crops=0;
let action="plant";
let player={x:2,y:2};
let farm=Array.from({length:5},()=>Array(7).fill(0));
let musicOn=false;
let audio,osc,gain;

function draw(){
 ctx.clearRect(0,0,600,400);

 // गाँव का मैदान
 ctx.fillStyle="#83bd53";
 ctx.fillRect(0,0,600,400);

 // खेत
 for(let y=0;y<5;y++){
  for(let x=0;x<7;x++){
   let px=65+x*68,py=40+y*65;
   ctx.fillStyle="#9b6539";
   ctx.fillRect(px,py,55,52);
   if(farm[y][x]===1){
    ctx.fillText("🌱",px+13,py+35);
   }
   if(farm[y][x]===2){
    ctx.fillText("🌾",px+10,py+35);
   }
  }
 }
 // घर
 ctx.font="35px Arial";
 ctx.fillText("🏠",500,65);
 ctx.fillText("🐄",510,130);
 ctx.fillText("🚜",470,350);

 // खिलाड़ी
 ctx.font="38px Arial";
 ctx.fillText("👨‍🌾",65+player.x*68,40+player.y*65+38);

 document.getElementById("money").textContent=money;
 document.getElementById("crop").textContent=crops;
}

function move(dx,dy){
 player.x=Math.max(0,Math.min(6,player.x+dx));
 player.y=Math.max(0,Math.min(4,player.y+dy));
 draw();
}

canvas.onclick=function(e){
 let r=canvas.getBoundingClientRect();
 let x=Math.floor((e.clientX-r.left)*600/r.width);
 let y=Math.floor((e.clientY-r.top)*400/r.height);
 let gx=Math.floor((x-65)/68);
 let gy=Math.floor((y-40)/65);

 if(gx<0||gx>6||gy<0||gy>4)return;

 player.x=gx;player.y=gy;

 if(action==="plant" && farm[gy][gx]===0 && money>=20){
  farm[gy][gx]=1;money-=20;
  message("बीज बो दिया! 🌱");
 }
 else if(action==="water" && farm[gy][gx]===1){
  farm[gy][gx]=2;
  message("फसल तैयार हो गई! 🌾");
 }
 else if(action==="harvest" && farm[gy][gx]===2){
  farm[gy][gx]=0;crops++;money+=100;
  message("फसल बेचकर ₹100 मिले!");
 }
 else if(action==="tractor"){
  message("🚜 ट्रैक्टर खेत में चल रहा है!");
 }
 else{
  message("पहले सही काम चुनो!");
 }
 draw();
};

function message(t){
 document.getElementById("message").textContent=t;
}

// Original synthesized background tune
function music(){
 if(!audio){
  audio=new(window.AudioContext||window.webkitAudioContext)();
  osc=audio.createOscillator();
  gain=audio.createGain();
  osc.type="triangle";
  osc.frequency.value=196;
  gain.gain.value=0;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
 }
 if(audio.state==="suspended")audio.resume();
 musicOn=!musicOn;
 gain.gain.setTargetAtTime(
  musicOn?0.035:0,audio.currentTime,0.1
 );
 message(musicOn?"🎵 Music चालू है!":"Music बंद है");
}

draw();
</script>
</body>
</html>
<script setup>
import { 
  Check, 
  Plus, 
  MoreVertical, 
  File, 
  Folder, 
  Hammer, 
  Package, 
  Trash2, 
  Pencil, 
  Info, 
  ExternalLink, 
  Copy, 
  Baseline
} from 'lucide-vue-next';
</script>

# File Browser

The File Browser is the heart of your project management in Acode. It allows you to manage files from internal storage, external SD cards (via SAF), and remote servers (FTP/SFTP).

## Home View

The Home View acts as the centralized hub for all your file connections.

![File Browser Home](/file_browser.png)

### Top Bar Actions

|            Icon             | Name               | Description                                                               |
| :-------------------------: | :----------------- | :------------------------------------------------------------------------ |
|   <Baseline :size="20" />   | **Selection Mode** | Toggles selection mode to select multiple items (for batch delete, etc.). |
|     <Plus :size="20" />     | **Add Connection** | Opens a menu to add new storage paths or remote connections.              |
| <MoreVertical :size="20" /> | **Menu**           | Access global file browser settings and actions.                          |

::: details <Plus :size="16" style="display:inline; vertical-align:middle"/> Add Connection Options

- **Add Path**: select a local folder (e.g., from external SD card or internal storage) using the Android Storage Access Framework (SAF).
- **Add FTP**: Setup a connection to a standard FTP server.
- **Add SFTP**: Setup a secure connection to an SFTP server.
  :::

::: details <MoreVertical :size="16" style="display:inline; vertical-align:middle"/> Menu Options

- **Settings**: Configure file browser behavior (e.g., show hidden files, sorting).
- **Reset Connections**: Clear all saved remote connections and paths.
- **Reload**: Refresh the list of connections.
  :::

---

## Project & Folder View

Navigating into a folder or project changes the available tools to focus on content creation.

![File Browser Project View](/file_browser_project.png)

### Managing Files

When inside a folder, the <Plus :size="16" style="display:inline; vertical-align:middle"/> button allows you to create content:

- <File :size="16" style="display:inline; vertical-align:middle"/> **New File**: Create a blank file.
- <Folder :size="16" style="display:inline; vertical-align:middle"/> **New Folder**: Create a new subdirectory.
- <Hammer :size="16" style="display:inline; vertical-align:middle"/> **New Project**: Initialize a project from built-in templates.
- <Package :size="16" style="display:inline; vertical-align:middle"/> **Import Project**: Extract and import a project from a `.zip` file.

### Context Actions (Long Press)

::: tip Pro Tip
**Long press** on any file or folder to reveal the context menu.
:::

- <Trash2 :size="16" style="display:inline; vertical-align:middle"/> **Delete**: Remove the item permanently.
- <Pencil :size="16" style="display:inline; vertical-align:middle"/> **Rename**: Change the name of the file or folder.
- <Info :size="16" style="display:inline; vertical-align:middle"/> **Info**: View properties like size, permission, and full path.
- <ExternalLink :size="16" style="display:inline; vertical-align:middle"/> **Open With**: Force open a file with a specific mode or external app.
- <Copy :size="16" style="display:inline; vertical-align:middle"/> **Copy URI**: Copy the file's path to your clipboard.

### Active Workspace

::: info Open Folder
At the bottom right (or via the check button), you will see an **Open** button (<Check :size="16" style="display:inline; vertical-align:middle"/>).
:::

Clicking this sets the **currently visible folder** as your **Active Workspace** in the sidebar. This loads the folder into the side panel for quick access while editing files.
