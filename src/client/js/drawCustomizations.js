const teams = [
	"red",
	"blue"
];
const animations = [
	"pistol",
	"pistolReloading1",
	"pistolReloading2",
	"pistolReloading3",
	"pistolReloading4",
	"DP",
	"DPReloading1",
	"DPReloading2",
	"DPReloading3",
	"MG",
	"MGReloading1",
	"MGReloading2",
	"MGReloading3",
	"MGReloading4",
	"MGReloading5",
	"SG",
	"SGCock",
	"SGReloading1",
	"SGReloading2",
	"SGReloading3",
	"Body",
	"BodyWall"
];

//!!! Error handling! What if png does not exist or fails to load? This will crash the client
function drawCustomizations(customizations, id, cb){			
	console.log("customizations:");
	console.log(customizations);
	var layers = {};
	for (var t = 0; t < teams.length; t++){
		layers[teams[t]] = {};
		for (var a = 0; a < animations.length; a++){
			layers[teams[t]][animations[a]] = [];
		}
	}
	
	var imgSources = [];

	for (var t = 0; t < teams.length; t++){
		var shirtPattern = new Image(); //Each team can have their own shirt pattern
		shirtPattern.src = "/client/img/small.png";
		if (customizations[teams[t]].shirtPattern){
			if (customizations[teams[t]].shirtPattern == 1){
				shirtPattern.src = "/client/img/dynamic/patterns/zebra.png";
			}
			else if (customizations[teams[t]].shirtPattern == 2){
				shirtPattern.src = "/client/img/dynamic/patterns/pyramids.png";
			}
		}	
		imgSources.push(shirtPattern.src);
	
		for (var a = 0; a < animations.length; a++){
			var layerOrder = [];
			switch(animations[a]){
				case "pistol":
					layerOrder = ["arms", "hands", "pistol", "torso", "head", "hair"];
					break;
				case "pistolReloading1":		
					layerOrder = ["arms", "hands", "pistol", "torso", "head", "hair"];
					break;
				case "pistolReloading2":
					layerOrder = ["arms", "pistol", "hands", "torso", "head", "hair"];
					break;
				case "pistolReloading3":
					layerOrder = ["arms", "pistol", "hands", "torso", "head", "hair"];		
					break;
				case "pistolReloading4":
					layerOrder = ["arms", "pistol", "hands", "torso", "head", "hair"];		
					break;
				case "DP":
					layerOrder = ["arms", "hands", "DP", "torso", "head", "hair"];
					break;
				case "DPReloading1":		
					layerOrder = ["arms", "hands", "DP", "torso", "head", "hair"];
					break;
				case "DPReloading2":
					layerOrder = ["arms", "hands", "torso", "head", "hair"];
					break;
				case "DPReloading3":
					layerOrder = ["arms", "hands", "DP", "torso", "head", "hair"];		
					break;
				case "MG":
					layerOrder = ["arms", "hands", "MG", "torso", "head", "hair"];		
					break;
				case "MGReloading1":
					layerOrder = ["arms", "hands", "MG", "torso", "head", "hair"];		
					break;
				case "MGReloading2":
					layerOrder = ["arms", "hands", "MG", "torso", "head", "hair"];		
					break;
				case "MGReloading3":
					layerOrder = ["arms", "hands", "MG", "torso", "head", "hair"];		
					break;
				case "MGReloading4":
					layerOrder = ["arms", "MG", "hands", "torso", "head", "hair"];		
					break;
				case "MGReloading5":
					layerOrder = ["arms", "MG", "hands", "torso", "head", "hair"];		
					break;
				case "SG":
					layerOrder = ["arms", "hands", "SG", "torso", "head", "hair"];		
					break;
				case "SGCock":
					layerOrder = ["arms", "hands", "SG", "torso", "head", "hair"];		
					break;
				case "SGReloading1":
					layerOrder = ["arms", "hands", "shell", "SG", "torso", "head", "hair"];		
					break;
				case "SGReloading2":
					layerOrder = ["arms", "hands", "SG", "torso", "head", "hair"];		
					break;
				case "SGReloading3":
					layerOrder = ["arms", "hands", "SG", "torso", "head", "hair"];		
					break;
				default:
					log("ERROR: Layer missing: " + animations[a]);
			}

			for (var l in layerOrder){
				//log("Rendering " + teams[t]+ " " + animations[a] + " " + layerOrder[l]);
				var color = false;
				var pattern = false;

				switch(String(layerOrder[l])){
					case "arms":
						color = customizations[teams[t]].shirt >= 100 ? customizations[teams[t]].shirtColor : customizations[teams[t]].skinColor;
						pattern = customizations[teams[t]].shirt >= 100 && customizations[teams[t]].shirtPattern ? shirtPattern : false;
						break;
					case "hands":
						color = customizations[teams[t]].gloves ? customizations[teams[t]].glovesColor : customizations[teams[t]].skinColor;
						break;
					case "torso":
						color = customizations[teams[t]].shirtColor,
						pattern = customizations[teams[t]].shirtPattern ? shirtPattern : false
						break;
					case "head":
						color = customizations[teams[t]].skinColor;
						break;
					case "hair":
						color = customizations[teams[t]].hairColor;
						break;
					case "pistol":
						color = customizations[teams[t]].pistolColor;
						break;
					case "DP":
						color = customizations[teams[t]].dpColor;						
						break;
					case "SG":
						color = customizations[teams[t]].sgColor;						
						break;
					case "MG":
						color = customizations[teams[t]].mgColor;						
					default:
						log("RENDERING ERROR - invalid layer: " + layerOrder[l] + " (switch)");
				}


				var layer = new Image();
				layer.src = "/client/img/dynamic/" + animations[a] + "/" + layerOrder[l] + ".png";	
				layers[teams[t]][animations[a]].push({
					img: layer,
					x: 0,
					y: 0,
					color: color,
					pattern: pattern
				});
				imgSources.push(layer.src);
			} // layers loop
		} //animations loop
	} // teams loop
	
	var playerAnimations = {};
	for (var t = 0; t < teams.length; t++){
		playerAnimations[teams[t]] = {};	
	}	

	log("Loading images:");
	loadImages(imgSources, function(){
		log("Images loaded");
		for (var t = 0; t < teams.length; t++){
			for (var a = 0; a < animations.length; a++){
					playerAnimations[teams[t]][animations[a]] = drawLayeredImage(94, 116, layers[teams[t]][animations[a]]);
			}
		}
		cb(playerAnimations, id);
	});
}

//imgArr is a list of strings containing the paths to images (src property)
function loadImages(imgArr,callback) {
	//Keep track of the images that are loaded
	var imagesLoaded = 0;
	function _loadAllImages(callback){
		//Create an temp image and load the url
		var img = new Image();
		$(img).attr('src',imgArr[imagesLoaded]); //Second parameter must be the src of the image

		//log("loading " + imagesLoaded + "/" + imgArr.length + " " + img.src);
		if (img.complete || img.readyState === 4) {
			//log("CACHED " + (imagesLoaded + 1) + "/" + imgArr.length + " " + img.src);
			// image is cached
			imagesLoaded++;
			//Check if all images are loaded
			if(imagesLoaded == imgArr.length) {
				//If all images loaded do the callback
				callback();
			} else {
				//If not all images are loaded call own function again
				_loadAllImages(callback);
			}
		} else {
			$(img).load(function(){
				//log("DONE " + imagesLoaded + "/" + imgArr.length + " " + img.src);
				//Increment the images loaded variable
				imagesLoaded++;
				//Check if all images are loaded
				if(imagesLoaded == imgArr.length) {
					//If all images loaded do the callback
					callback();
				} else {
					//If not all images are loaded call own function again
					_loadAllImages(callback);
				}
			});
		}
	};		
	_loadAllImages(callback);
}

function drawLayeredImage(w, h, imagesArray){
	var p_canvas = document.createElement('canvas');
	var pCtx = p_canvas.getContext("2d");
	p_canvas.width = w;
	p_canvas.height = h;

	for (var i = 0; i < imagesArray.length; i++){
		drawOnCanvas(pCtx, imagesArray[i].img, imagesArray[i].x, imagesArray[i].y, imagesArray[i].color, imagesArray[i].pattern);
	}
	
	return p_canvas;
}

function drawOnCanvas(destCanvasCtx, img, x, y, color = false, pattern = false, zoom = 1, clearFrame = true){
	var tCan = document.createElement('canvas');
	var tCtx = tCan.getContext("2d");
	tCan.width = img.width * zoom;
	tCan.height = img.height * zoom;
	x /= zoom;
	y /= zoom;
	if (clearFrame)
		tCtx.clearRect(0,0,tCan.width,tCan.height); //Clears previous frame!!!	
	

	//draw the image	
	tCtx.drawImage(img, 0, 0, img.width * zoom, img.height * zoom);

	if (pattern){
		tCtx.globalCompositeOperation = "multiply";
		tCtx.drawImage(pattern, 0, 0);
	}
	
	if (color){
		tCtx.fillStyle = color;

		//Brightness
		tCtx.globalCompositeOperation = "multiply";
		tCtx.fillRect(0, 0, tCan.width, tCan.height);

		//Color transformation
		tCtx.globalCompositeOperation = "color";
		tCtx.fillRect(0, 0, tCan.width, tCan.height);

		//Clip the color shader outside image  
		tCtx.globalCompositeOperation = "destination-in";
		tCtx.drawImage(img, 0, 0);
	}

	destCanvasCtx.drawImage(tCan, x, y);
}



function drawSimpleImage(destCanvasCtx, img, clearFrame = false){
	if (clearFrame)
		destCanvasCtx.clearRect(0,0,destCanvasCtx.width,destCanvasCtx.height); //Clears previous frame!!!	
	
	//draw the image
	destCanvasCtx.drawImage(img, 0, 0);	
}