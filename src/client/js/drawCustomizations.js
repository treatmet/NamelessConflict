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

var smallImg = new Image();
smallImg.src = "/client/img/small.png";

//!!! Error handling! What if png does not exist or fails to load? This will crash the client
function drawCustomizations(customizations, id, cb){			
	// console.log("customizations:");
	// console.log(customizations);
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
		imgSources.push(shirtPattern.src); //Make sure small gets added to loaded images regardless of shirt pattern 
		if (customizations[teams[t]].shirtPattern != "default"){
			if (customizations[teams[t]].shirtPattern == 1){
				shirtPattern.src = "/client/img/dynamic/patterns/zebra.png";
			}
			else if (customizations[teams[t]].shirtPattern == 2){
				shirtPattern.src = "/client/img/dynamic/patterns/pyramids.png";
			}
			imgSources.push(shirtPattern.src);
		}
	
		for (var a = 0; a < animations.length; a++){
			var layerOrder = [];
			switch(animations[a]){
				case "pistol":
					layerOrder = [{layer:"arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer:"torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:0, y:0},
									{layer:"hair", x:0, y:0},
									{layer:"hat", x:0, y:0}];
					break;
				case "pistolReloading1":		
					layerOrder = [{layer:"arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer:"torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:0, y:1},
									{layer:"hair", x:0, y:1},
									{layer:"hat", x:0, y:1}];
					break;
				case "pistolReloading2":
					layerOrder = [{layer:"arms", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"torso", animationVariant:"pistol", x:0, y:0},
									{layer:"head", x:0, y:0},
									{layer:"hair", x:0, y:0},
									{layer:"hat", x:0, y:0}];
					break;
				case "pistolReloading3":
					layerOrder = [{layer:"arms", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:"pistol", x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"torso", animationVariant:"pistol", x:0, y:0},
									{layer:"head", x:0, y:0},
									{layer:"hair", x:0, y:0},
									{layer:"hat", x:0, y:0}];
					break;
				case "pistolReloading4":
					layerOrder = [{layer:"arms", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:animations[a], animationVariant:"pistol", x:0, y:1},
									{layer:"head", x:0, y:1},
									{layer:"hair", x:0, y:1},
									{layer:"hat", x:0, y:1}];
					break;
				case "DP":
					layerOrder = [{layer:"arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:-1, y:0},
									{layer:"hair", x:-1, y:0},
									{layer:"hat", x:-1, y:0}];
					break;
				case "DPReloading1":		
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:"DP", x:0, y:0},
									{layer:"head", x:-1, y:0},
									{layer:"hair", x:-1, y:0},
									{layer:"hat", x:-1, y:0}];
					break;
				case "DPReloading2":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:"DP", x:0, y:0},
									{layer:"head", x:-1, y:0},
									{layer:"hair", x:-1, y:0},
									{layer:"hat", x:-1, y:0}];
					break;
				case "DPReloading3":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:"DP", x:0, y:0},
									{layer:"head", x:-1, y:0},
									{layer:"hair", x:-1, y:0},
									{layer:"hat", x:-1, y:0}];
					break;
				case "MG":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:-2, y:2},
									{layer:"hair", x:-2, y:2},
									{layer:"hat", x:-2, y:2}];
					break;
				case "MGReloading1":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:"MG", x:0, y:2},
									{layer:"head", x:-2, y:4},
									{layer:"hair", x:-2, y:4},
									{layer:"hat", x:-2, y:4}];
					break;
				case "MGReloading2":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:"MG", x:0, y:3},
									{layer:"head", x:-2, y:5},
									{layer:"hair", x:-2, y:5},
									{layer:"hat", x:-2, y:5}];
					break;
				case "MGReloading3":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:"MG", x:0, y:3},
									{layer:"head", x:-2, y:5},
									{layer:"hair", x:-2, y:5},
									{layer:"hat", x:-2, y:5}];
					break;
				case "MGReloading4":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:"MG", x:0, y:-1},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:"MG", x:0, y:-1},
									{layer:"head", x:-2, y:1},
									{layer:"hair", x:-2, y:1},
									{layer:"hat", x:-2, y:1}];
					break;
				case "MGReloading5":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:"MG", x:0, y:1},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:"MG", x:0, y:0},
									{layer:"head", x:-2, y:2},
									{layer:"hair", x:-2, y:2},
									{layer:"hat", x:-2, y:2}];
					break;
				case "SG":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:-2, y:1},
									{layer:"hair", x:-2, y:1},
									{layer:"hat", x:-2, y:1}];
					break;
				case "SGCock":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:animations[a], x:0, y:0},
									{layer: "torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:-2, y:3},
									{layer:"hair", x:-2, y:3},
									{layer:"hat", x:-2, y:3}];
					break;
				case "SGReloading1":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"shell", x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:"SG", x:-1, y:-1},
									{layer: "torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:-1, y:4},
									{layer:"hair", x:-1, y:4},
									{layer:"hat", x:-1, y:4}];
					break;
				case "SGReloading2":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun", animationVariant:"SG", x:-1, y:0},
									{layer: "torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:-1, y:2},
									{layer:"hair", x:-1, y:2},
									{layer:"hat", x:-1, y:2}];
					break;
				case "SGReloading3":
					layerOrder = [{layer: "arms", animationVariant:animations[a], x:0, y:0},
									{layer:"hands", animationVariant:animations[a], x:0, y:0},
									{layer:"gun",  animationVariant:"SG", x:-1, y:-2},
									{layer: "torso", animationVariant:animations[a], x:0, y:0},
									{layer:"head", x:-1, y:2},
									{layer:"hair", x:-1, y:2},
									{layer:"hat", x:-1, y:2}];
					break;
				case "Body":
					break;
				case "BodyWall":
					break;
				default:
					log("ERROR: Layer missing: " + animations[a]);
			}

			for (var l in layerOrder){
				//log("Rendering " + teams[t]+ " " + animations[a] + " " + layerOrder[l]);
				var color = false;
				var pattern = false;
				var type = "default";				
				var animationVariant = layerOrder[l].animationVariant ? "/" + layerOrder[l].animationVariant : "";

				// log(animations[a] + " " + layerOrder[l].layer + " animationVariant: " + animationVariant);

				switch(String(layerOrder[l].layer)){
					case "arms":
						color = customizations[teams[t]].shirt.indexOf('long') > -1 ? customizations[teams[t]].shirtColor : customizations[teams[t]].skinColor;
						pattern = customizations[teams[t]].shirt.indexOf('long') > -1 && customizations[teams[t]].shirtPattern != "default" ? shirtPattern : false;
						break;
					case "hands":
						color = customizations[teams[t]].gloves == "default" ? customizations[teams[t]].skinColor : customizations[teams[t]].glovesColor;
						type = customizations[teams[t]].gloves;
						break;
					case "torso":
						color = customizations[teams[t]].shirtColor,
						pattern = customizations[teams[t]].shirtPattern ? shirtPattern : false
						break;
					case "head":
						color = customizations[teams[t]].skinColor;
						break;
					case "shell":
						break;
					case "hair":
						if (customizations[teams[t]].hair == "bald" || customizations[teams[t]].hat == "skiMask")
							continue;
						color = customizations[teams[t]].hairColor;
						type = customizations[teams[t]].hair;
						break;
					case "hat":
						if (customizations[teams[t]].hat == "default" || customizations[teams[t]].hat == "noneHat")
							continue;
						type = customizations[teams[t]].hat;
						break;
					case "gun":
						if (animations[a].indexOf('pistol') > -1) {color = customizations[teams[t]].pistolColor;}
						else if (animations[a].indexOf('DP') > -1) {color = customizations[teams[t]].dpColor;}
						else if (animations[a].indexOf('SG') > -1) {color = customizations[teams[t]].sgColor;}
						else if (animations[a].indexOf('MG') > -1) {color = customizations[teams[t]].mgColor;}
						else {color = "#707070";}							
						break;
					default:
						log("RENDERING ERROR - invalid layer: [" + String(layerOrder[l].layer) + "]");
				}

				var layer = new Image();
				layer.src = "/client/img/dynamic/" + layerOrder[l].layer + animationVariant + "/" + type + ".png";	
				imgSources.push(layer.src);


				layers[teams[t]][animations[a]].push({
					img: layer,
					x: layerOrder[l].x,
					y: layerOrder[l].y,
					color: color,
					pattern: pattern
				});
			} // layers loop
		} //animations loop
	} // teams loop
	
	var playerAnimations = {};
	for (var t = 0; t < teams.length; t++){
		playerAnimations[teams[t]] = {};	
	}	

	//log("Loading images:");
	loadImages(imgSources, function(invalidSrcPaths){
		//log("Images loaded");
		for (var t = 0; t < teams.length; t++){
			for (var a = 0; a < animations.length; a++){

					//Replace invalid images
					for (var l = 0; l < layers[teams[t]][animations[a]].length; l++){						
						for (var p = 0; p < invalidSrcPaths.length; p++){
							if (invalidSrcPaths[p] == layers[teams[t]][animations[a]][l].img.src){
								layers[teams[t]][animations[a]][l].img = smallImg;
							}
						}
					}

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
	var invalidSrcPaths = [];
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
				callback(invalidSrcPaths);
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
					callback(invalidSrcPaths);
				} else {
					//If not all images are loaded call own function again
					_loadAllImages(callback);
				}
			});
			$(img).error(function(){
				log("ERROR LOADING IMAGE AT PATH : " + img.src);
				invalidSrcPaths.push(img.src);
				imagesLoaded++;
				if(imagesLoaded == imgArr.length) {
					callback(invalidSrcPaths);
				} else {
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