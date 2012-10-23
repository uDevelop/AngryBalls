var REFRESH_INTERVAL = 20;
var canvas;
var context; 
var cWidth, cHeight;
var curMX = 0;
var curMY = 0;
var ST_START = 0; 
var ST_STRETCHING = 1;
var ST_PHYSICS = 2;
var ST_EXPLODE = 3;
var curST = 0;
var startStrethX = 0;
var startStrethY = 0;
var endStrethX = 0;
var endStrethY = 0;
var curVecX = 0;
var curVecY = 0;
var gravVecX = 0;
var gravVecY = 4;
var ballPosX = 0;
var ballPosY = 0;
var ballRad = 6;
var boxSize = 50;
var VEC_STRENGTH = 0.1;
var exp_phase = 0;
var BoxStorage = [];
var ExplodeStorage = [];
var Timer;
var score = 0;


function getCanvas() 
{
	canvas = document.getElementById("MainCanvas");
	cWidth = canvas.width;
	cHeight = canvas.height;
	canvas.onmousedown = onMouseDown;
	canvas.onmouseup   = endStretch;
	canvas.onmousemove = onMouseMove;
}

function getContext() 
{
	context = canvas.getContext("2d");		
}

function d2r(deg) //deg to rad
{ 
	return deg*Math.PI/180;
}

function DrawBall(x, y, r)
{
	context.beginPath();
	context.moveTo(x+r, y);
	for(var i=1; i<360; i++) 
	{
		var curX, curY;
		curX = x+r*Math.cos(d2r(i));
		curY = y+r*Math.sin(d2r(i));
		context.lineTo(curX, curY);
	}
	context.closePath();
}

function DrawBallB(x, y, r)
{
	DrawBall(x,y,r);
	context.stroke();
}

function DrawBallF(x, y, r)
{
	DrawBall(x,y,r);
	context.fill();	
}

function DrawBallBF(x, y, r)
{
	DrawBall(x,y,r);
	context.stroke();
	context.fill();	
}

function DrawLineXY(x1,y1, x2, y2)
{
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.closePath();
	context.stroke();
}

function DrawBoxBF(x, y, s)
{
	var x1 = x-s/2;
	var x2 = x+s/2;
	var y1 = y-s/2;
	var y2 = y+s/2;
	
	context.fillStyle = "#b06834";
	context.strokeStyle = "#555555";  
	context.fillRect(x1, y1, s, s);
	context.strokeRect(x1, y1, s, s);
	DrawLineXY(x1, y1, x2, y2); 
	DrawLineXY(x2, y1, x1, y2);
	context.font = 'bold 15px sans-serif';
	context.fillStyle = "#FF0000";
	context.strokeStyle = "#000000"; 
	context.fillText('TNT!', x-s*0.3, y+s*0.1);
	context.strokeText('TNT!', x-s*0.3, y+s*0.1);
}

function DrawBoxes(Storage) {
	for(var i=0; i<Storage.length; i++) {
		var Coord = Storage[i];
		DrawBoxBF(Coord[0], Coord[1], boxSize); 
	}
}

function ClearScr()
{
	context.strokeStyle = "#aaeeFF"; 
	context.fillStyle = "#aaeeFF";
	context.fillRect(0, 0, cWidth, cHeight);
}

function DrawScore(Score) {
	context.fillStyle = "#b06834";
	context.strokeStyle = "#555555";
	context.fillText("Score: "+Score, 10, 20);	 
	context.fill();
	
}

function PointInBox(px, py, bx, by, bs)
{
	var x1 = bx-bs/2;
	var x2 = bx+bs/2;
	var y1 = by-bs/2;
	var y2 = by+bs/2;
	
	if ( (px >= x1) && (px <= x2) && (py >= y1) && (py <= y2) ) 
		return 1;
	else
		return 0;
}

function TraceBallToBox(BoxX, BoxY)
{
	var bsx = ballPosX;
	var bsy = ballPosY;
	var bex = bsx + curVecX * VEC_STRENGTH;
	var bey = bsy + curVecX * VEC_STRENGTH;
	var bx  = bsx;
	var by  = bsy;
	var cross = 0;
	var i = 0;
	for( i = 0; i <= 5; i++)
	{
		bx = bsx * i / 5.0 + bex *( 5.0 - i ) / 5.0;
		by = bsy * i / 5.0 + bey *( 5.0 - i ) / 5.0;
		if (PointInBox(bx, by, BoxX, BoxY, boxSize) == 1 )
		{
			cross = 1;				
		}
		
	}
	return cross;
}

function DrawExplode(x, y, r)
{
	context.beginPath();
	context.moveTo(x+r * ( 1.8 +1) / 2, y);
	k = -1;
	for(var i=1; i<30; i++) 
	{
		var curX, curY;
		curX = x+r*Math.cos(d2r(i*12)) * ( 1.8 + k) / 2;
		curY = y+r*Math.sin(d2r(i*12)) * ( 1.8 + k) / 2;
		context.lineTo(curX, curY);
		k*=-1;
	}
	context.closePath();
	context.stroke();
	context.fill();
}

function RecalcBoxCoord(Storage) { 			//Физика обсчитывается так же, как и у шарика 
	for(var i=0; i<Storage.length; i++) {
		x = Storage[i][0];
		y = Storage[i][1];
		var curVY = Storage[i][2] + gravVecY;
		y = y + curVY * VEC_STRENGTH;
		var collision = false;
		var cY; //Y ящика с которым есть коллизия
		for(j=0; j<Storage.length; j++) { //ищем коллизии
			if (i!=j) {
				var curX = Storage[j][0];
				var curY = Storage[j][1];
				if ((Math.abs(x-curX) <boxSize) && ((curY - y) > 0) && ((curY - y) < boxSize)) {
					collision = true;
					cY = curY;
					break;
				}
			}
		}
		if ((y >= (cHeight - boxSize/2)) || (collision)) {
			curVY = 0;
			if (!collision) {
				y = cHeight - boxSize/2;
			}
			else
				y = cY - boxSize;
		}		
		Storage[i][1] = y;
		Storage[i][2] = curVY;
	}
}
 
function tFunc()
{
	ClearScr();
	DrawScore(score);
	//DrawBallBF(curMX, curMY, 6);
	if ( curST == ST_START )
	{
			context.fillStyle = "#FF0000";
			context.strokeStyle = "#000000"; 
			//DrawBallBF(curMX, curMY, ballRad);
			context.fillStyle = "#b06834";
			context.strokeStyle = "#555555"; 
			context.lineWidth = 1;
			DrawBoxes(BoxStorage);
			ExplodeStorage = [];
			clearInterval(Timer);			
	}
	else
	{
		RecalcBoxCoord(BoxStorage);
		if ( curST == ST_STRETCHING )
		{
			t = 0;
			context.strokeStyle = "#FF0000";
			context.fillStyle = "#000000"; 
			DrawBallB(startStrethX, startStrethY, 6);
			DrawLineXY(startStrethX, startStrethY, curMX, curMY );
			DrawBallBF(curMX, curMY, ballRad);
			context.fillStyle = "#b06834";
			context.strokeStyle = "#555555"; 
			context.lineWidth = 1;
			DrawBoxes(BoxStorage);
		}
		else
		{
			if ( curST == ST_PHYSICS )
			{
				context.fillStyle = "#FFFF00";
				context.strokeStyle = "#FF0000";
				curVecX = curVecX + gravVecX; 
				curVecY = curVecY + gravVecY;
				ballPosX = ballPosX + curVecX * VEC_STRENGTH;
				ballPosY = ballPosY + curVecY * VEC_STRENGTH;
				DrawBallBF(ballPosX, ballPosY, ballRad);
				context.fillStyle = "#b06834";
				context.strokeStyle = "#555555"; 
				context.lineWidth = 1;
				DrawBoxes(BoxStorage);				
				var boxX;
				var boxY;
				for(var j=0; j<BoxStorage.length; j++) {
					boxX = BoxStorage[j][0];
					boxY = BoxStorage[j][1];	
					if (TraceBallToBox(boxX, boxY) == 1)
					{
							ExplodeStorage.push([boxX, boxY, 0]);
							BoxStorage.splice(j, 1);
					}
				}
				if ((!ExplodeIt()) && (( ballPosX > cWidth ) ||  (ballPosY > cHeight ) || (ballPosX <  0) || (ballPosY < 0)))
				{
					curST = ST_START;					
				}
			}			
		}
	}	
} 

function ExplodeIt() {
	res = false;
	for(var i=0; i< ExplodeStorage.length; i++) {
		var x = ExplodeStorage[i][0];
		var y = ExplodeStorage[i][1];
		var exp_phase = ExplodeStorage[i][2];
		context.fillStyle = "#FFFF00";
		context.strokeStyle = "#FF0000";
		DrawExplode(x, y, boxSize * (exp_phase) / 10);
		context.fillStyle = "#FF0000";
		context.strokeStyle = "#FF0000";
		DrawExplode(x, y, boxSize * (exp_phase) / 20);
		if ( exp_phase == 1 )
		{
			score++;				
		}
		ExplodeStorage[i][2]++;		
		if ( exp_phase > 35 )
		{
			ExplodeStorage.splice(i, 1);				
		}
		res = true;
		if (exp_phase == 30) {
			for(var j=0; j<BoxStorage.length; j++) {				
				cx = BoxStorage[j][0];
				cy = BoxStorage[j][1];
				if ((Math.abs((x-cx)) < boxSize*2) && ((Math.abs(y-cy)) < boxSize*2)) {
					BoxStorage.splice(j, 1);
					var Found = false;
					for(var k=0; k<ExplodeStorage.length; k++) {
						if ((ExplodeStorage[k][0] == cx) && (ExplodeStorage[k][1] == cy)) {
							Found = true;
						}
					}
					if (!Found) {
						ExplodeStorage.push([cx, cy, 0]);
					}
				}
			}
		}
	}
	return res;
}

function onLoad() 
{
	getCanvas();
	getContext();
	curST = ST_START;
	tFunc();
}

function onMouseMove(e) 
{
	curMX = e.pageX - canvas.offsetLeft;
	curMY = e.pageY - canvas.offsetTop;
}

function beginStretch() 
{
	if ( curST == ST_START )
	{
		startStrethX = curMX;
		startStrethY = curMY;
		curST = ST_STRETCHING;
	}
}

function endStretch() 
{
	if ( curST == ST_STRETCHING )
	{
		endStrethX = curMX;
		endStrethY = curMY;
		curVecX = startStrethX - endStrethX; 
		curVecY = startStrethY - endStrethY;
		ballPosX = curMX;
		ballPosY = curMY;
		curST = ST_PHYSICS;
	}
}

function onMouseDown(event) {
	clearInterval(Timer);	
	Timer = setInterval(tFunc, REFRESH_INTERVAL);
	if (event.button == 0) {
		beginStretch();
	}
	else if (event.button == 2) {
		boxCoordX = event.pageX - canvas.offsetLeft;
		boxCoordY = event.pageY - canvas.offsetTop; 
		addBox(boxCoordX, boxCoordY, BoxStorage);
	}
}

function addBox(X, Y, Storage) {
	var Found = false;
	for(var i=0; i<Storage.length; i++) {
		var cx = Storage[i][0];
		var cy = Storage[i][1];
		
		if ((Math.abs(X - cx) < boxSize) && (Math.abs(Y - cy) < boxSize)) {
			Found = true;			
			break;
		}
	}
	
	if (!Found) {
		Storage.push([X, Y, 0]);
	}
}

window.onload = onLoad;
window.oncontextmenu = function () {return false;}


