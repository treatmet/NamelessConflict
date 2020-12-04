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



function getMannequinFrame(shopItem, cb){
	var imgSources = [];
	var layers = [];
	var layerOrder = getLayerOrder("pistol");
	var customizations = getMannequinCustomizations(shopItem);

	for (var l in layerOrder){
		var layer = getLayerDrawProperties(layerOrder[l], customizations)
		if (!layer){continue;}
		imgSources.push(layer.img.src);
		if (layer.pattern){imgSources.push(layer.pattern.src);}
		layers.push(layer);
	}
	loadImages(imgSources, function(invalidSrcPaths){
		cb(drawLayeredImage(94, 116, layers, false));
	});
}

function getMannequinCustomizations(shopItem){
	var customizations = {
		nameColor: "#000",
		hat: "noneHat",
		hair: "baldHair",
		hairColor: "#FFFFFF",
		shirt: "default",
		shirtColor: "#FFFFFF",
		shirtPattern: "default",
		skinColor: "#FFFFFF",
		gloves: "default",
		glovesColor: "#FFFFFF",
		pistolColor: "#FFFFFF",
		dpColor: "#FFFFFF",
		mgColor: "#FFFFFF",
		sgColor: "#FFFFFF",
		boost: "default",
		boostColor: "",
		pantsColor: "#FFFFFF",
		icon: "default"		
	}

	var catSubCat = shopItem.category + shopItem.subCategory;
	switch(catSubCat){
		case "hattype":
			customizations.hat = shopItem.canvasValue;
			break;
		case "hairtype":
			customizations.hair = shopItem.canvasValue;
			customizations.hairColor = "#7f5227";
			break;
		case "haircolor":
			customizations.hair = "crewHair";
			customizations.hairColor = shopItem.canvasValue;
			break;
		case "skincolor":
			customizations.skinColor = shopItem.canvasValue;
			break;
		case "shirttype":
			customizations.shirt = shopItem.canvasValue;
			customizations.shirtColor = "#0b3790";
			break;
		case "shirtcolor":
			customizations.shirtColor = shopItem.canvasValue;
			break;
		case "shirtPattern":
			customizations.shirtPattern = shopItem.canvasValue;
			break;
		case "pantscolor":
			customizations.pantsColor = shopItem.canvasValue;
			break;
		case "boosttype":
			customizations.boost = shopItem.canvasValue;
			customizations.hairColor = shopItem.id;
			break;
		case "namecolor":
			customizations.nameColor = shopItem.canvasValue;
			break;
		case "icon":
			customizations.icon = shopItem.canvasValue;
			break;
		default:
			logg("ERROR - invalid category+subcategory:" + catSubCat);
			break;
	}

	return customizations;
}

//!!! Error handling! What if png does not exist or fails to load? This will crash the client
function drawCustomizations(customizations, id, cb){		//!!! We don't need id passed here anymore	
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
	imgSources.push("/client/img/small.png"); //Make sure small gets added to loaded images regardless of shirt pattern 

	for (var t = 0; t < teams.length; t++){		
		for (var a = 0; a < animations.length; a++){
			var layerOrder = getLayerOrder(animations[a]);

			for (var l in layerOrder){
				var layer = getLayerDrawProperties(layerOrder[l], customizations[teams[t]]);
				if (!layer){continue;}

				imgSources.push(layer.img.src);
				if (layer.pattern){imgSources.push(layer.pattern.src);}
				layers[teams[t]][animations[a]].push(layer);
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

//teamCustomizations is really just 1 set of customizations
function getLayerDrawProperties(layerData, teamCustomizations){ 
	var layer = {};
	layer.color = false;
	layer.pattern = false;
	layer.x = layerData.x;
	layer.y = layerData.y;
	var type = "default";				
	var animationVariant = layerData.animationVariant ? "/" + layerData.animationVariant : "";

	// log(animations[a] + " " + layerData.layer + " animationVariant: " + animationVariant);

	switch(String(layerData.layer)){
		case "arms":
			layer.color = teamCustomizations.shirt.indexOf('long') > -1 ? teamCustomizations.shirtColor : teamCustomizations.skinColor;
			layer.pattern = teamCustomizations.shirt.indexOf('long') > -1 && teamCustomizations.shirtPattern != "default" ? shirtPattern : false;
			break;
		case "hands":
			layer.color = teamCustomizations.gloves == "default" ? teamCustomizations.skinColor : teamCustomizations.glovesColor;
			type = teamCustomizations.gloves;
			break;
		case "torso":
			layer.color = teamCustomizations.shirtColor;
			if (teamCustomizations.shirtPattern){
				var shirtPattern = new Image();
				shirtPattern.src = "/client/img/small.png";
				if (teamCustomizations.shirtPattern != "default"){
					if (teamCustomizations.shirtPattern == 1){
						shirtPattern.src = "/client/img/dynamic/patterns/zebra.png";
					}
					else if (teamCustomizations.shirtPattern == 2){
						shirtPattern.src = "/client/img/dynamic/patterns/pyramids.png";
					}
					imgSources.push(shirtPattern.src);
				}
				layer.pattern = shirtPattern;
			}
			break;
		case "head":
			layer.color = teamCustomizations.skinColor;
			break;
		case "shell":
			break;
		case "hair":
			if (teamCustomizations.hair == "baldHair" || teamCustomizations.hat == "skiMask")
				return false;
			layer.color = teamCustomizations.hairColor;
			type = teamCustomizations.hair;
			break;
		case "hat":
			if (teamCustomizations.hat == "default" || teamCustomizations.hat == "noneHat")
				return false;
			type = teamCustomizations.hat;
			break;
		case "gun":
			if (layerData.animationVariant.indexOf('pistol') > -1) {layer.color = teamCustomizations.pistolColor;}
			else if (layerData.animationVariant.indexOf('DP') > -1) {layer.color = teamCustomizations.dpColor;}
			else if (layerData.animationVariant.indexOf('SG') > -1) {layer.color = teamCustomizations.sgColor;}
			else if (layerData.animationVariant.indexOf('MG') > -1) {layer.color = teamCustomizations.mgColor;}
			else {layer.color = "#707070";}							
			break;
		default:
			log("RENDERING ERROR - invalid layer: [" + String(layerData.layer) + "]");
	}
	layer.img = new Image();
	layer.img.src = "/client/img/dynamic/" + layerData.layer + animationVariant + "/" + type + ".png";	

	return layer;
}


function getLayerOrder(animationFrame){
	var layerOrder = [];
	switch(animationFrame){
		case "pistol":
			layerOrder = [{layer:"arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer:"torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:0, y:0},
							{layer:"hair", x:0, y:0},
							{layer:"hat", x:0, y:0}];
			break;
		case "pistolReloading1":		
			layerOrder = [{layer:"arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer:"torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:0, y:1},
							{layer:"hair", x:0, y:1},
							{layer:"hat", x:0, y:1}];
			break;
		case "pistolReloading2":
			layerOrder = [{layer:"arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"torso", animationVariant:"pistol", x:0, y:0},
							{layer:"head", x:0, y:0},
							{layer:"hair", x:0, y:0},
							{layer:"hat", x:0, y:0}];
			break;
		case "pistolReloading3":
			layerOrder = [{layer:"arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:"pistol", x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"torso", animationVariant:"pistol", x:0, y:0},
							{layer:"head", x:0, y:0},
							{layer:"hair", x:0, y:0},
							{layer:"hat", x:0, y:0}];
			break;
		case "pistolReloading4":
			layerOrder = [{layer:"arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:animationFrame, animationVariant:"pistol", x:0, y:1},
							{layer:"head", x:0, y:1},
							{layer:"hair", x:0, y:1},
							{layer:"hat", x:0, y:1}];
			break;
		case "DP":
			layerOrder = [{layer:"arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:-1, y:0},
							{layer:"hair", x:-1, y:0},
							{layer:"hat", x:-1, y:0}];
			break;
		case "DPReloading1":		
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:"DP", x:0, y:0},
							{layer:"head", x:-1, y:0},
							{layer:"hair", x:-1, y:0},
							{layer:"hat", x:-1, y:0}];
			break;
		case "DPReloading2":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:"DP", x:0, y:0},
							{layer:"head", x:-1, y:0},
							{layer:"hair", x:-1, y:0},
							{layer:"hat", x:-1, y:0}];
			break;
		case "DPReloading3":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:"DP", x:0, y:0},
							{layer:"head", x:-1, y:0},
							{layer:"hair", x:-1, y:0},
							{layer:"hat", x:-1, y:0}];
			break;
		case "MG":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:-2, y:2},
							{layer:"hair", x:-2, y:2},
							{layer:"hat", x:-2, y:2}];
			break;
		case "MGReloading1":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:"MG", x:0, y:2},
							{layer:"head", x:-2, y:4},
							{layer:"hair", x:-2, y:4},
							{layer:"hat", x:-2, y:4}];
			break;
		case "MGReloading2":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:"MG", x:0, y:3},
							{layer:"head", x:-2, y:5},
							{layer:"hair", x:-2, y:5},
							{layer:"hat", x:-2, y:5}];
			break;
		case "MGReloading3":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:"MG", x:0, y:3},
							{layer:"head", x:-2, y:5},
							{layer:"hair", x:-2, y:5},
							{layer:"hat", x:-2, y:5}];
			break;
		case "MGReloading4":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:"MG", x:0, y:-1},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:"MG", x:0, y:-1},
							{layer:"head", x:-2, y:1},
							{layer:"hair", x:-2, y:1},
							{layer:"hat", x:-2, y:1}];
			break;
		case "MGReloading5":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:"MG", x:0, y:1},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:"MG", x:0, y:0},
							{layer:"head", x:-2, y:2},
							{layer:"hair", x:-2, y:2},
							{layer:"hat", x:-2, y:2}];
			break;
		case "SG":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:-2, y:1},
							{layer:"hair", x:-2, y:1},
							{layer:"hat", x:-2, y:1}];
			break;
		case "SGCock":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:-2, y:3},
							{layer:"hair", x:-2, y:3},
							{layer:"hat", x:-2, y:3}];
			break;
		case "SGReloading1":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"shell", x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:"SG", x:-1, y:-1},
							{layer: "torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:-1, y:4},
							{layer:"hair", x:-1, y:4},
							{layer:"hat", x:-1, y:4}];
			break;
		case "SGReloading2":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun", animationVariant:"SG", x:-1, y:0},
							{layer: "torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:-1, y:2},
							{layer:"hair", x:-1, y:2},
							{layer:"hat", x:-1, y:2}];
			break;
		case "SGReloading3":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun",  animationVariant:"SG", x:-1, y:-2},
							{layer: "torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"head", x:-1, y:2},
							{layer:"hair", x:-1, y:2},
							{layer:"hat", x:-1, y:2}];
			break;
		case "Body":
			break;
		case "BodyWall":
			break;
		default:
			log("ERROR: Layer missing: " + animationFrame);
	}	
	return layerOrder;
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

function drawLayeredImage(w, h, imagesArray, clearFrame = true){
	var p_canvas = document.createElement('canvas');
	var pCtx = p_canvas.getContext("2d");
	p_canvas.width = w;
	p_canvas.height = h;

	for (var i = 0; i < imagesArray.length; i++){
		drawOnCanvas(pCtx, imagesArray[i].img, imagesArray[i].x, imagesArray[i].y, imagesArray[i].color, imagesArray[i].pattern, 1, clearFrame);
	}
	
	return p_canvas;
}

function drawOnCanvas(destCanvasCtx, img, x, y, color = false, pattern = false, zoom = 1, clearFrame = true){
	var tCan = document.createElement('canvas');
	var tCtx = tCan.getContext("2d");
	tCan.width = img.width * zoom;
	tCan.height = img.height * zoom;

	if (clearFrame){
		tCtx.clearRect(0,0,tCan.width,tCan.height); //Clears previous frame!!!	
	}
	

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