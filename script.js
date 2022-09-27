socket = io();
var indexSign;
var indexTurn;
const XImage = 'url("images/cross.png")';
const OImage = 'url("images/circle.png")';
const signs = [XImage, OImage];
const startedBtnTxt = 'Recommencer la partie'; 
var gameStarted = false;
var isConnected;
var XWin;
var scoreX=0;
var scoreO=0;
var myid;
var otherid;
const line1 = ["d1", "d2", "d3"];
const line2 = ["d4", "d5", "d6"];
const line3 = ["d7", "d8", "d9"];
const column1 = ["d1", "d4", "d7"];
const column2 = ["d2", "d5", "d8"];
const column3 = ["d3", "d6", "d9"];
const diagonal1 = ["d1", "d5", "d9"];
const diagonal2 = ["d3", "d5", "d7"];
const all = [line1, line2, line3, column1, column2, column3, diagonal1, diagonal2];

function MessageToServer(e,args) //string, map
{
    socket.emit(e, [e,otherid,args]);
}

function ClearClients()
{
    socket.emit('message_wa', ['message_clear',otherid]);
}

function SwitchTurn()
{
    if(indexTurn == 1)
    {
        indexTurn = 0; 
        return;
    }
    indexTurn++; 
    return;
}

function InitializeGame()
{
    document.getElementById("h3ScoreX").textContent=scoreX.toString();
    document.getElementById("h3ScoreO").textContent=scoreO.toString();
}

function onButtonClickGame(clicked_id)
{
    if (gameStarted && XWin == null)
    {
        const btnGame = document.getElementById(clicked_id);
        if(btnGame.style.backgroundImage == "" && indexSign == indexTurn)
        {
			console.log("ID: "+clicked_id, "Image: "+btnGame.style.backgroundImage);
            btnGame.style.backgroundImage = signs[indexSign];
            var cells = [];
            for (let i=1; i<=9; i++)
            {
                document.getElementById("d"+i).style.backgroundImage == "" ? cells.push(null) : cells.push(document.getElementById("d"+i).style.backgroundImage)
            }
            SwitchTurn(indexTurn);
            MessageToServer("message", {cells_infos: cells});
			checkBoard();
        }      
    }
}

function onButtonClickRestartGame()
{
    if((isConnected || gameStarted) && (XWin != null || checkDraw())){resetGame(false, false);}
}

function checkDraw()
{
    let filledCells = 0;
    for(let i=1; i<=9; i++)
    {
        if(document.getElementById("d"+i).style.backgroundImage != ""){filledCells++;}
    }
    console.log(filledCells, "cellules sont remplies");
    return filledCells == 9;
}

function checkBoard()
{
    let sameImageX = 0;
    let sameImageO = 0;

    for (const comb of all)
    {
        for (const btn of comb)
        {
            if(document.getElementById(btn).style.backgroundImage==XImage)
            {
                sameImageX++;
            }
            else if(document.getElementById(btn).style.backgroundImage==OImage)
            {
                sameImageO++;
            }
        }
        if(sameImageX==3)
        {
            console.log("XWIN");
            document.getElementById("hwin").textContent = "X a gagné";
            XWin = true;
            scoreX++;
            return;
        }else if (sameImageO==3)
        {
            console.log("OWIN");
            document.getElementById("hwin").textContent = "O a gagné";
            XWin = false;
            scoreO++;
            return;
        }
        sameImageX=sameImageO=0;
    }
    if (checkDraw())
    {
        console.log("DRAW");
        document.getElementById("hwin").textContent = "Égalité";
        return;
    } 
}

function resetGame(local, changeGameState)
{
    if(changeGameState)
    {
        gameStarted = !gameStarted
    }
    if(!local)
    {
        ClearClients();
        MessageToServer('message_ng', {gameStarted_infos: gameStarted});
    }
    if(gameStarted)
    {
        document.getElementById("button-startGameID").innerText = startedBtnTxt; 
        document.getElementById("button-startGameID").style.display = "inline-block";
    }
    else
    {
        document.getElementById("button-startGameID").style.display = "none";
    }
    InitializeGame();
    for (let i=1; i<=9; i++)
    {
        document.getElementById("d"+i).style.backgroundImage = null;
    }
    XWin=null;
    document.getElementById("hwin").textContent = null;
}

socket.on('remessage', (infos) => {
    for(let i=1; i<=9; i++)
    {
        document.getElementById("d"+i).style.backgroundImage = infos.cells_infos[i-1];
    }
    checkBoard();
    SwitchTurn();
});

socket.on('remessage_clear', () => {
    resetGame(true, false);
});

socket.on('remessage_ng', (infos) => {
    gameStarted = infos.gameStarted_infos;
    if(gameStarted == true)
    {
        document.getElementById("button-startGameID").innerText = startedBtnTxt; 
        document.getElementById("button-startGameID").style.display = "inline-block";
    }
    else
    {
        document.getElementById("button-startGameID").style.display = "none";
    }
});

socket.on('myid_info', (myid_nb) => {
    myid = myid_nb;
    console.log("Mon ID:", myid);
});

socket.on('otherid_info', (otherid_nb) => {
    otherid = otherid_nb;
    isConnected = true;
    resetGame(true, true);
    console.log("Son ID:", otherid);
});

socket.on('indexTurn_info', (indexTurn_nb) => {
    indexTurn = indexTurn_nb;
    console.log(indexTurn);
});

socket.on('indexSign_info', (indexSign_nb) => {
    indexSign = indexSign_nb;
    console.log(indexSign);
});

socket.on('disconnection_info', () => {
    isConnected = false;
    console.log("Le joueur a été déconnecté");
    scoreX = "0";
    scoreO = "0";
    resetGame(true, true);
});
