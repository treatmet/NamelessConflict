
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
	"legs",
	"boost",
	"body1",
	"Laser", //@
	"bodyWall"
];

var smallImg = new Image();
smallImg.src = "/src/client/img/small.png";



function getMannequinFrame(shopItem, cb){
	var imgSources = [];
	var layers = [];

	var legLayers = [];
	if (shopItem.category == "pants" || shopItem.category == "shoes"){
		legLayers = getLayerOrder("legs");
	}
	
	let bodyLayers;
	switch (shopItem.subCategory){
		case "dualPistols":
			bodyLayers = getLayerOrder("DP");
			break;
		case "shotgun":
			bodyLayers = getLayerOrder("SG");
			break;
		case "machineGun":
			bodyLayers = getLayerOrder("MG");
			break;
		default:
			bodyLayers = getLayerOrder("pistol");
			break;
	}
	
	var layerOrder = [];
	
	if (shopItem.category == "boost"){
		layerOrder = getLayerOrder("boost");
	}
	else {
		layerOrder = legLayers.concat(bodyLayers);
	}
	var customizations = getMannequinCustomizations(shopItem);

	for (var l in layerOrder){
		var layer = getLayerDrawProperties(layerOrder[l], customizations)
		if (!layer){continue;}
		if (shopItem.category == "pants" || shopItem.category == "shoes"){
			layer.y -= 6;
		}
		else if (shopItem.category == "boost"){
			layer.x += 0;
			layer.y += 5;
		}

		imgSources.push(layer.img.src);
		if (layer.pattern){imgSources.push(layer.pattern.src);}

		layers.push(layer);
	}
	loadImages(imgSources, function(invalidSrcPaths){
		cb(drawLayeredImage(layers, false));
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
		pantsColor: "#FFFFFD",
		shoesColor: "#FFFFFF",
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
			customizations.shirtColor = "#8a8a8a";
			break;
		case "shirtcolor":
			customizations.shirtColor = shopItem.canvasValue;
			break;
		case "shirtpattern":
			customizations.shirtPattern = shopItem.canvasValue;
			break;
		case "pantscolor":
			customizations.pantsColor = shopItem.canvasValue;
			break;
		case "shoescolor":
			customizations.shoesColor = shopItem.canvasValue;
			break;
		case "boosttype":
			customizations.boost = shopItem.canvasValue;
			break;
		case "namecolor":
			customizations.nameColor = shopItem.canvasValue;
			break;
		case "icontype":
			customizations.icon = shopItem.canvasValue;
			break;
		case "weaponspistol":
			customizations.pistolColor = shopItem.canvasValue;
			break;
		case "weaponsdualPistols":
			customizations.dpColor = shopItem.canvasValue;
			break;
		case "weaponsmachineGun":
			customizations.mgColor = shopItem.canvasValue;
			break;
		case "weaponsshotgun":
			customizations.sgColor = shopItem.canvasValue;
			break;
		default:
			logg("ERROR - invalid category+subcategory:" + catSubCat);
			break;
	}

	return customizations;
}

function getEmptyLayers(){
	var layers = {};
	for (var t = 0; t < teams.length; t++){
		layers[teams[t]] = {};
		for (var a = 0; a < animations.length; a++){
			layers[teams[t]][animations[a]] = [];
		}
	}
	return layers;
}
//var getCustStart = 0;
//!!! Error handling! What if png does not exist or fails to load? This will crash the client
async function drawCustomizations(customizations, id, cb){		//!!! We don't need id passed here anymore	
	// console.log("customizations:");
	// console.log(customizations);
	var layers = getEmptyLayers();
	
	var imgSources = [];
	imgSources.push("/src/client/img/small.png"); //Make sure small gets added to loaded images regardless of shirt pattern 

	for (var t = 0; t < teams.length; t++){		
		for (var a = 0; a < animations.length; a++){
			// var loggy = new Date() - getCustStart;
			// console.log("Get layer order loop " + loggy + " " + animations[a]);
			var layerOrder = getLayerOrder(animations[a]);

			for (var l in layerOrder){
				var layer = getLayerDrawProperties(layerOrder[l], customizations[teams[t]]);
				if (!layer){continue;}

				imgSources.push(layer.img.src);
				if (layer.pattern && layer.pattern.src){imgSources.push(layer.pattern.src);}
				layers[teams[t]][animations[a]].push(layer);
			} // layers loop
		} //animations loop
	} // teams loop
	
	var playerAnimations = {};
	for (var t = 0; t < teams.length; t++){
		playerAnimations[teams[t]] = {};	
	}	

	//log("Loading images:");
	//var loggy = new Date() - getCustStart;
	//console.log("Before load images " + loggy);
	loadImages(imgSources, async function(invalidSrcPaths){
		//var loggy = new Date() - getCustStart;
		//console.log("After load images " + loggy);
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
				// var loggy = new Date() - getCustStart;
				// console.log("Drawing layered images " + loggy + " " + animations[a]);
				await sleep(3);
				playerAnimations[teams[t]][animations[a]] = drawLayeredImage(layers[teams[t]][animations[a]]);
			}
		}
		cb(playerAnimations, id);
	});
}

async function drawCustomization(teamCustomizations, animationFrameName, team, id, cb){		//!!! We don't need id passed here anymore	
	// console.log("customizations:");
	// console.log(customizations);
	var layers = getEmptyLayers();
	
	var imgSources = [];
	imgSources.push("/src/client/img/small.png"); //Make sure small gets added to loaded images regardless of shirt pattern 

	var layerOrder = getLayerOrder(animationFrameName);

	for (var l in layerOrder){
		var layer = getLayerDrawProperties(layerOrder[l], teamCustomizations);
		if (!layer){continue;}

		imgSources.push(layer.img.src);
		if (layer.pattern && layer.pattern.src){imgSources.push(layer.pattern.src);}
		layers[team][animationFrameName].push(layer);
	} // layers loop
	
	var playerAnimations = {};
	for (var t = 0; t < teams.length; t++){
		playerAnimations[team] = {};	
	}	

	//log("Loading images:");
	loadImages(imgSources, async function(invalidSrcPaths){
		//log("Images loaded");
				//Replace invalid images
				for (var l = 0; l < layers[team][animationFrameName].length; l++){						
					for (var p = 0; p < invalidSrcPaths.length; p++){
						if (invalidSrcPaths[p] == layers[team][animationFrameName][l].img.src){
							layers[team][animationFrameName][l].img = smallImg;
						}
					}
				}
				
		cb(drawLayeredImage(layers[team][animationFrameName]), id);
	});
}


//teamCustomizations is really just 1 set of customizations
function getLayerDrawProperties(layerData, teamCustomizations){ 
	var layer = {};
	layer.color = false;
	layer.pattern = false;
	layer.x = layerData.x;
	layer.y = layerData.y;
	layer.rotation = layerData.rotation;
	var type = "default";				
	var animationVariant = layerData.animationVariant ? "/" + layerData.animationVariant : "";

	// log(animations[a] + " " + layerData.layer + " animationVariant: " + animationVariant);

	switch(String(layerData.layer)){
		case "arms":
			layer.color = teamCustomizations.shirt.indexOf('long') > -1 ? teamCustomizations.shirtColor : teamCustomizations.skinColor;
			layer.pattern = teamCustomizations.shirt.indexOf('long') > -1 ? getPattern(teamCustomizations.shirtPattern) : false;
			break;
		case "hands":
			layer.color = teamCustomizations.gloves == "default" ? teamCustomizations.skinColor : teamCustomizations.glovesColor;
			type = teamCustomizations.gloves;
			break;
		case "torso":
			layer.color = teamCustomizations.shirtColor;
			layer.pattern = getPattern(teamCustomizations.shirtPattern);
			break;
		case "head":
			layer.color = teamCustomizations.skinColor;
			break;
		case "shell":
			break;
		case "hair":
			if (teamCustomizations.hair == "baldHair" || teamCustomizations.hat == "skiMaskHat")
				return false;
			layer.color = teamCustomizations.hairColor;
			if (teamCustomizations.hair != "cornrowsHair") {layer.pattern = getPattern("hair");}
			type = teamCustomizations.hair;
			break;
		case "hat":
			if (teamCustomizations.hat == "default" || teamCustomizations.hat == "noneHat")
				return false;
			if (teamCustomizations.hat == "headbandHat" && (teamCustomizations.hair == "bigAfroHair" || teamCustomizations.hair == "afroHair"))
				return false;
			if (teamCustomizations.hair == "bigAfroHair" && (teamCustomizations.hat != "skiMaskHat" && teamCustomizations.hat != "sunglassesHat" && teamCustomizations.hat != "googlyHat"))
				layer.y += 7;
			if (teamCustomizations.hair == "afroHair" && (teamCustomizations.hat != "skiMaskHat" && teamCustomizations.hat != "sunglassesHat" && teamCustomizations.hat != "googlyHat"))
				layer.y += 3;	
			type = teamCustomizations.hat;
			break;
		case "gun":
			if (layerData.animationVariant.indexOf('pistol') > -1) {layer.color = teamCustomizations.pistolColor;}
			else if (layerData.animationVariant.indexOf('DP') > -1) {layer.color = teamCustomizations.dpColor;}
			else if (layerData.animationVariant.indexOf('SG') > -1) {layer.color = teamCustomizations.sgColor;}
			else if (layerData.animationVariant.indexOf('MG') > -1) {layer.color = teamCustomizations.mgColor;}
			break;
		case "legs":			
			if (teamCustomizations.pantsColor == "#FFFFFF"){
				layer.color = teamCustomizations.skinColor;
			}
			else {
				layer.color = teamCustomizations.pantsColor;
			}
			break;
		case "boost":
			type = teamCustomizations.boost;
			break;
		case "shoes":
			if (teamCustomizations.shoesColor == "#ffde00"){
				layer.pattern = getPattern("chainLink");
			}
			layer.color = teamCustomizations.shoesColor;
			break;
		case "bloodFront":
			break;
		default:
			log("RENDERING ERROR - invalid layer: [" + String(layerData.layer) + "]");
			break;
	}
	layer.img = new Image();
	//console.log("LOADING IMAGE: " + "/src/client/img/dynamic/" + layerData.layer + animationVariant + "/" + type + ".png");
	layer.img.src = "/src/client/img/dynamic/" + layerData.layer + animationVariant + "/" + type + ".png";	

	return layer;
}

function getPattern(custPattern){
	if (custPattern){
		var pattern = new Image();
		pattern.src = "/src/client/img/small.png";
		if (custPattern != "default"){
			pattern.src = "/src/client/img/dynamic/patterns/" + custPattern + ".png";
		}
		return pattern;
	}
	else {
		return false;
	}
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
		case "Laser":
			layerOrder = [{layer: "arms", animationVariant:animationFrame, x:0, y:0},
							{layer:"hands", animationVariant:animationFrame, x:0, y:0},
							{layer: "torso", animationVariant:animationFrame, x:0, y:0},
							{layer:"gun",  animationVariant:"Laser", x:0, y:0},
							{layer:"head", x:-2, y:1},
							{layer:"hair", x:-2, y:1},
							{layer:"hat", x:-2, y:1}];
			break;
		case "legs":
			layerOrder = [{layer: "legs", x:0, y:0},
						{layer: "shoes", x:0, y:0}];
			break;
		case "boost":
			layerOrder = [{layer: "boost", x:0, y:0}];
			break;
		case "bodyWall":
			const wallBodyOffset = -5;
			layerOrder = [
				{layer: "arms", animationVariant:animationFrame, x:0, y:wallBodyOffset},
				{layer: "torso", animationVariant:animationFrame, x:0, y:wallBodyOffset},
				{layer:"hands", animationVariant:animationFrame, x:0, y:wallBodyOffset},
				{layer:"bloodFront", animationVariant:animationFrame, x:wallBodyOffset, y:wallBodyOffset},
				{layer:"head", x:30, y:-5 + wallBodyOffset, rotation:25*Math.PI/180},
				{layer:"hair", x:30, y:-5 + wallBodyOffset, rotation:25*Math.PI/180}
				];
			break;
		case "body1":
			layerOrder = [
				{layer:"hair", x:-1, y:-38},
				{layer: "arms", animationVariant:animationFrame, x:0, y:0},
				{layer: "torso", animationVariant:animationFrame, x:0, y:0},
				{layer:"head", x:-1, y:-38},
				{layer:"hands", animationVariant:animationFrame, x:0, y:0},
				{layer: "legs", animationVariant:animationFrame, x:0, y:0},
				{layer: "shoes", animationVariant:animationFrame, x:0, y:0},
				{layer:"bloodFront", x:0, y:0}];
			break;
		default:
			log("ERROR: Layer missing: " + animationFrame);
			break;
	}	
	return layerOrder;
}

function drawLayeredImage(layerArray, clearFrame = true){
	var p_canvas = document.createElement('canvas');
	var pCtx = p_canvas.getContext("2d");
	if (layerArray[0]){
		p_canvas.width = layerArray[0].img.width;
		p_canvas.height = layerArray[0].img.height;

		for (var i = 0; i < layerArray.length; i++){
			drawOnCanvas(pCtx, layerArray[i], 1, clearFrame);
		}
	}
	
	return p_canvas;
}

//function drawOnCanvas(destCanvasCtx, img, x, y, color = false, pattern = false, zoom = 1,  rotation = 0, clearFrame = true){

function drawOnCanvas(destCanvasCtx, layer, zoom = 1, clearFrame = true){
	var tCan = document.createElement('canvas');
	var tCtx = tCan.getContext("2d");
	tCan.width = layer.img.width * zoom;
	tCan.height = layer.img.height * zoom;


	if (!layer.x){layer.x = 0;}
	if (!layer.y){layer.y = 0;}

	if (clearFrame){
		tCtx.clearRect(0,0,tCan.width,tCan.height); //Clears previous frame!!!	
	}
	
	tCtx.save();


		//rotate the image
		if (layer.rotation){
			tCtx.rotate(layer.rotation);
		}

		//draw the image	
		tCtx.drawImage(layer.img, 0, 0, layer.img.width * zoom, layer.img.height * zoom);

		if (layer.pattern && layer.pattern.src){
			tCtx.globalCompositeOperation = "multiply";
			tCtx.drawImage(layer.pattern, 0, 0);
		}
		
		if (layer.color){
			tCtx.fillStyle = layer.color;

			//Brightness
			tCtx.globalCompositeOperation = "multiply";
			tCtx.fillRect(0, 0, tCan.width, tCan.height);

			//Color transformation
			tCtx.globalCompositeOperation = "color";
			tCtx.fillRect(0, 0, tCan.width, tCan.height);

			//Clip the color shader outside image  
			tCtx.globalCompositeOperation = "destination-in";
			tCtx.drawImage(layer.img, 0, 0);
		}

		destCanvasCtx.drawImage(tCan, layer.x, layer.y);
	tCtx.restore();

}

