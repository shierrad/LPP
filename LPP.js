import { THREE, OrbitControls, GLTFLoader, EXRLoader, EffectComposer,
     RenderPass, ShaderPass, OutlinePass, OutputPass, FXAAShader} from "./Modules/imports.js";

import {sceneScript, sceneParams, info, adds, globals} from "./Modules/sceneProperties.js";


let exrCubeRenderTarget;
let exrBackground;
let container;
let camera, scene, renderer, controls;
let gltfObject
let c_rotation = 0;
let kronos;
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let composer, effectFXAA, outlinePass;
let outlineColor = new THREE.Color( 0xffffff ) 
let bevThicknessUniform = { value: 25 };
let foodThicknessUniform = {value : 25}
let activeObjects = {"food":"","bev":""}
let osakaSong, tteokSong;
let sfxClick ,sfxShh ,sfxPop ,sfxSteps;
let newEnvMap;
let spotLight;
let sceneObjects = {}
let cUrl;
let mouseOpacity = 0.0;
let materialShader;
let EXRInterval;

//EL PAPS sd jh
console.clear();

const manager = new THREE.LoadingManager();

let signMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xbc0a58, // Pink color
  metalness: 0.7, // Fully metallic
  roughness: 0.4, // Completely smooth
  emissive: 0x17992e, // Green tint
  clearcoat: 1,
  clearcoatRoughness: 0,
  reflectivity: 0.5,
  transparent: true,
  opacity: 0.0
});

let LMouseMaterial = new THREE.MeshBasicMaterial({transparent: true});


let treeList = ["pine_tree", "birch", "palm_tree_tall"]

let originalAnimalList = ["01fox","02cat","03duck","04bizon","05deer",
                  "06penguin","07shark","08bear","11frog","12dog",
                  "13cow","14dog","15lizard","10sheep","17horse",
                  "24bird","22smolchiken","21chiken","19dog","20dog",
                  "25dog","23smolbird","09deer","16rabbit"]

let animalList = [];
for (var i = 0; i < sceneParams.animalN; i++) {
  let randomIndex = getRandomNumber(0, originalAnimalList.length);
  animalList.push(originalAnimalList[randomIndex]);
}

let animalMeshes = [];

let foodParentGroupParams = {
  type : "food",   
  name : "Sushi",
  style:"real",
  rot: 0,
  pos: null
}

let bevParentGroupParams = {
  type : "bev",   
  name : "Coca",
  style:"real",
  rot: 0,
  pos: null
}

let modelsParams = [
  {name : "Paketaxo", type:"food", scale:8.0, pos:[0,0,0], rot: [0,0,0]},
  {name : "Concha", type:"food", scale:7.0, pos:[0,0,0], rot: [0,0,0]},
  {name : "Ramen", type:"food", scale:90.0, pos:[0,0,0], rot: [0,0,0]},
  {name : "Sushi", type:"food", scale:1.2, pos:[0,0,0], rot: [0,0,0]},
  {name : "Cafe", type:"bev", scale:0.8, pos:[0,0,0], rot: [0,0,0]},
  {name : "Guama", type:"bev", scale:0.5, pos:[0,0,0], rot: [0,0,0]},
  {name : "Matcha", type:"bev", scale:2.5, pos:[0,0,0], rot: [0,0,0]},
  {name : "Coca", type:"bev", scale:1.5, pos:[0,0,0], rot: [0,0,0]}
];

let styleList = ["real","toon","sprite"];

let foodbevList = {
  "food":["Paketaxo", "Sushi", "Concha", "Ramen"], 
  "bev":["Cafe","Coca" ,"Matcha", "Guama"]};

  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

const outlineParams = {
				edgeStrength: 5.0,
				edgeGlow: 10.0,
				edgeThickness: 5.0,
				pulsePeriod: 0,
				rotate: true,
				usePatternTexture: false
};
    

class ModelGroup extends THREE.Group{
    constructor(stateDict){
        super();
        this.stateDict = stateDict;
    }
    
    updateState(state_dict){
        this.children.forEach(function(child){
        if (child.name === "sprite"){
            updateSprite(child, stateDict);
        }
        })
    }
    
    updateParentAngle(updatedAngle){
        this.stateDict.rot = updatedAngle;
        this.children.forEach(function(child){
        if (!child.name.includes("sprite")){
            child.rotation.y = updatedAngle;
        } else {
            child.updateRotation(updatedAngle);
        }
        })
    }
    
    updateObjectsVisibility(){
      let styleName = this.stateDict.style + this.stateDict.name;
      let type = this.stateDict.type;
      this.children.forEach(function(child){
        if (child.name === styleName ){
          activeObjects[type] = child;
          child.visible = true;
        } else {
          child.visible = false;
        }
        //if (child.name.includes("sprite")){child.visible = true;} //REMOVE WHEN DONE!!
      })
    }

}
    
class rotatableSprite extends THREE.Sprite{
  constructor(material){
      super(material);
  }
  updateRotation(updatedAngle){
    var updatedDegAngle = closestDegAngle(updatedAngle, 6) % 360;
    //if (updatedDegAngle >= 180){
    //updatedDegAngle = -360 + updatedDegAngle;
    //}
    var path = this.source+updatedDegAngle+".png"
    const loader = new THREE.TextureLoader();
    loader.load(path, (texture) => {
    this.material.map = texture;
    this.material.needsUpdate = true;
    })
}
}

let foodParentGroup = new ModelGroup(foodParentGroupParams);
let bevParentGroup = new ModelGroup(bevParentGroupParams);


function closestDegAngle(angleInRadians, spacing){
  var angleInDegrees = THREE.MathUtils.radToDeg(angleInRadians);
  var closestDegree = Math.round(angleInDegrees/spacing)*spacing;
  return closestDegree 
}

function prepareScene(){
container = document.createElement( 'div' );
document.body.appendChild( container );
scene = new THREE.Scene();
scene.background = new THREE.Color(0).setHSL(0,0,0.5);
let r = 6.5;
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(20*r, 0, 0);
//renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); //ORIGINAL
renderer = new THREE.WebGLRenderer({ alpha: false,
                                     antialias: true, //Original true
                                     preserveDrawingBuffer: false,       //THIIMPORTANT
                                     logarithmicDepthBuffer: true  });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true
//renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

//let ALight = new THREE.AmbientLight(0xfffff0, 5);
//scene.add( ALight );


let fadePlaneGeometry = new THREE.PlaneGeometry(100, 100);
let fadePlaneMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 , transparent: true, opacity: 0.0});
let fadePlane = new THREE.Mesh(fadePlaneGeometry, fadePlaneMaterial);
fadePlane.position.z = 10;
fadePlane.name = "fadePlane"
sceneObjects.fadePlane = fadePlane;

if (adds.axes){addAxes()}

document.body.appendChild(renderer.domElement);
document.body.style.margin = '0';
if (adds.mouse){
  window.addEventListener('pointermove', onPointerMove, false);
  window.addEventListener('click', onLeftClick, false);
  window.addEventListener('contextmenu', onRightClick, false);
}
window.addEventListener( 'resize', onWindowResize );

composer = new EffectComposer( renderer );
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );
outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
outlinePass.edgeStrength = outlineParams.edgeStrength;
outlinePass.edgeGlow = outlineParams.edgeGlow;
outlinePass.edgeThickness = outlineParams.edgeThickness;
outlinePass.pulsePeriod = outlineParams.pulsePeriod;
outlinePass.rotate = outlineParams.rotate;
outlinePass.usePatternTexture = outlineParams.usePatternTexture;
//outlinePass.visibleEdgeColor = outlineParams.visibleEdgeColor;
//console.log(outlinePass)
composer.addPass( outlinePass );
const outputPass = new OutputPass();
composer.addPass( outputPass );
effectFXAA = new ShaderPass( FXAAShader );
effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
composer.addPass( effectFXAA );


kronos = new THREE.Clock();

}

function addControls(){
controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0, 0, 0);
controls.update();
}

function loadModel(url) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader(manager);
    loader.load(url, function(gltf) {
      gltfObject = gltf.scene;
      gltfObject.position.set(0,0,0)
      gltfObject.scale.set(sceneParams.gltfObjectScale,sceneParams.gltfObjectScale,sceneParams.gltfObjectScale);
      resolve(gltfObject);
    }, undefined, function(error) {
      console.error('Error loading model:', error);
      reject(error);
    });
  });
}

function addAxes(len=100){
  const axesHelper = new THREE.AxesHelper(len); // the parameter sets the length of the axes
  axesHelper.material.linewidth = 2; // set the thickness of the lines
  axesHelper.material.depthTest = true; // disable depth testing to keep the axes visible through other objects
  axesHelper.material.transparent = true; // make the axes slightly transparent
  axesHelper.material.opacity = 0.75;
  scene.add(axesHelper);
  const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
  const points = [];
  points.push( new THREE.Vector3( -1000, 10, -500 ) );
  points.push( new THREE.Vector3( 0, 10, 28 ) );
  const geometry = new THREE.BufferGeometry().setFromPoints( points );
  const line = new THREE.Line( geometry, material );
  scene.add( line );
}

function addLights(){
  spotLight = new THREE.SpotLight(0xfffff0, 50000);
  spotLight.position.set(90, 5.3,80);
  spotLight.target = new THREE.Object3D( 10, 0, 0 );
  spotLight.angle = (Math.PI/20)*1.7;
  const spotLightHelper = new THREE.SpotLightHelper(spotLight, 0xff0000 );
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  //camera.updateProjectionMatrix();
  renderer.setSize( width, height );
}

function onPointerMove(event) {
  if (event.isPrimary == false) return;
  mouse.x =  (event.clientX / window.innerWidth) * 2 - 1; 
  mouse.y =  -(event.clientY / window.innerHeight) * 2 + 1;
  checkIntersection(); 
}

function onLeftClick(event) {
  raycaster.setFromCamera(mouse, camera);
  if (sceneScript.eating){ 
    //console.log(activeObjects)
    const raycastObjects = [activeObjects["food"], activeObjects["bev"]] //Originally we raycast to the full scene
    const intersects = raycaster.intersectObjects(raycastObjects, true);
    if (intersects.length>0){
      const selectedObject = intersects[0].object;
      if (selectedObject.visible){
        sfxShh.play();
        applyLeftClickLogic(selectedObject)
      }
    }
  } else {
    if (sceneScript.menuSetup){
      let mainPlane = scene.getObjectByName("Menu");
      const raycastObjects = scene.getObjectByName("Menu").children
      const intersects = raycaster.intersectObjects(raycastObjects, true);
      if (intersects.length>0){
        const selectedObject = intersects[0].object;
        applyPlaneLeftClickLogic(selectedObject, mainPlane);
      }
    }
  }
}

function applyPlaneLeftClickLogic(selectedObject, mainPlane){
  //console.log(selectedObject)
  sfxClick.play();
  if (selectedObject.type === "food"){
    info.selections.food = selectedObject.name;
  } 
  if (selectedObject.type === "bev"){
    info.selections.bev = selectedObject.name;
  }
  if (selectedObject.type === "play" && selectedObject.selectable){
      info.selections.play = true;
      selectedObject.selected = true;
      //scene.add(fadePlane);
  }
  mainPlane.children.forEach(function (plane) {
    if (plane.type === "food"){
      if (plane.name === info.selections.food){
        plane.selected = true;
      }
      else {
        plane.selected = false;
      }
    }
    if (plane.type === "bev"){
      if (plane.name === info.selections.bev){
        plane.selected = true;
      }
      else {
        plane.selected = false;
      }
    }
    if (plane.type === "play" && plane.selectable){
      //plane.selected = true;
    }
  });
  updatePlanes();
}

function onRightClick(event) {
  event.preventDefault();
  raycaster.setFromCamera(mouse, camera);
  const raycastObjects = [activeObjects["food"], activeObjects["bev"]] //Originally we raycast to the full scene
  const intersects = raycaster.intersectObjects(raycastObjects, true);
  if (intersects.length>0){
    const selectedObject = intersects[0].object;
    if (selectedObject.visible){
      sfxPop.play();
      applyRightClickLogic(selectedObject)
    }
  }
}

function checkIntersection(){
  raycaster.setFromCamera(mouse, camera);
  if (sceneScript.eating){ //if we are eating we want to raycast to the food objects

    const raycastObjects = [activeObjects["food"], activeObjects["bev"]]
    const intersects = raycaster.intersectObjects(raycastObjects, true);
    if (intersects.length>0){
      const selectedObject = intersects[0].object;
      if (selectedObject.visible){
        applyFoodBevHoverLogic(selectedObject)
      }
    } else {
      bevThicknessUniform.value = 0;
      foodThicknessUniform.value = 0;
      outlinePass.selectedObjects = [];
    }
  } else { //if we are not eating we want to raycast to the menu selection planes (once the menu is setup)
    if (sceneScript.menuSetup && !sceneScript.cooking) {
      let mainPlane = scene.getObjectByName("Menu");
      mainPlane.children.forEach(function (plane) {
        plane.hover = false;
      });
      const raycastObjects = scene.getObjectByName("Menu").children
      const intersects = raycaster.intersectObjects(raycastObjects, true);
      if (intersects.length>0){
        const selectedObject = intersects[0].object;
        if (selectedObject.selectable){
          selectedObject.hover = true;
        }
      }
      updatePlanes();
    }
  }
}

function updatePlanes(){
  let mainPlane = scene.getObjectByName("Menu");
  mainPlane.children.forEach(function (plane) {
    if (info.selections.bev && info.selections.food){
      if (plane.type == "play"){
        plane.selectable = true;
      }
    }
    if (!plane.hover && !plane.selected) {
      if (plane.type != "play"){
        plane.material.opacity = 0.0;
        plane.material.color.set(sceneParams.hoverColor)
      }
      if (plane.type == "play"){
        if (plane.selectable){
          let textureLoader = new THREE.TextureLoader();
          textureLoader.load('./Assets/Img/listo.png', function(texture) {
            plane.material.map = texture;
            plane.material.needsUpdate = true;
            plane.material.opacity = 0.3;
          });
        }
      }
    } 
    if (plane.hover) {
      if (plane.type != "play"){
        plane.material.opacity = 0.3;
        plane.material.color.set(sceneParams.hoverColor)
      }
      if (plane.type == "play"){
        if (plane.selectable){
          //let textureLoader = new THREE.TextureLoader();
          //textureLoader.load('./Assets/Img/listo.png', function(texture) {
            //plane.material.map = texture;
            //plane.material.needsUpdate = true;
            plane.material.opacity = 0.65;
          //});
        }
      }
    }
    if (plane.selected) {
      if (plane.type != "play"){
        plane.material.opacity = 0.3;
        plane.material.color.set(sceneParams.selectColor);
      }
      if (plane.type === "play"){
        plane.material.opacity = 1.0;
        sceneScript.cooking = true;
        foodParentGroup.stateDict.name = info.selections.food;
        bevParentGroup.stateDict.name = info.selections.bev;
        scene.add(sceneObjects.fadePlane) 
      } 
    } 
  });
}

function fadeOut(){
  if (!sceneScript.fadedOut){
    let fadePlane = scene.getObjectByName("fadePlane");
    fadePlane.material.opacity += 0.008;
    if (osakaSong.volume > 0.01){
      osakaSong.volume -=0.01;
    }
    if (fadePlane.material.opacity >= 1.0){
      fadePlane.material.opacity = 1.0;
      sceneScript.fadedOut = true;
      osakaSong.volume = 0.0;
      osakaSong.pause()
    }
  } 
}

function fadeIn(elapsedTime){
  if (!sceneScript.fadedIn){
    let fadePlane = scene.getObjectByName("fadePlane");
    let overlayMouse = document.getElementById('overlay-mouse');
    //let overlayR = document.getElementById('overlay-R');
    //let overlayL = document.getElementById('overlay-L');
    if (fadePlane) {
      fadePlane.material.opacity -= 0.008;
      mouseOpacity = 1 - fadePlane.material.opacity;
      overlayMouse.style.opacity = mouseOpacity;
      if (fadePlane.material.opacity <= 0.01){
        fadePlane.material.opacity = 0.0;
        scene.remove(fadePlane);
        sceneScript.fadedIn = true;
      }
    }
  }
}

function cooking(elapsedTime, timeout = 3000){
  let comidaSign = scene.getObjectByName("comidaSign");
  let bebidaSign = scene.getObjectByName("bebidaSign");
  let Menu = scene.getObjectByName("Menu");
  if (Menu){scene.remove(Menu)}
  if (comidaSign){scene.remove(comidaSign)}
  if (bebidaSign){scene.remove(bebidaSign)}
  if (!comidaSign && !bebidaSign && !Menu) {
    scene.add(spotLight)
    scene.add(foodParentGroup);
    scene.add(bevParentGroup);
    foodParentGroup.updateObjectsVisibility()
    bevParentGroup.updateObjectsVisibility()
    sceneScript.eating = true;
    //sceneScript.cooking = false;
    //addMousePlanes();
    setTimeout(() =>{
      tteokSong.volume = 0.3;
      tteokSong.loop = true;
      tteokSong.play()
      fadeIn()
    }, timeout)
    setTimeout(() =>{
      let overlayMouse = document.getElementById("overlay-mouse");
      let overlayR = document.getElementById("overlay-R");
      let overlayL = document.getElementById("overlay-L");
      let thanks = document.getElementById("thanksTextbox");
      if (overlayMouse){overlayMouse.remove();}
      if (overlayR){overlayR.remove();}
      if (overlayL){overlayL.remove();}
      if (thanks){thanks.style.opacity = 1.0;}
    }, 23000)
  }
}


function applyFoodBevHoverLogic(selectedObject){
  var parentToonOrReal = findToonOrRealParent(selectedObject)
  if (parentToonOrReal){
    if (parentToonOrReal.type === "Sprite"){
      if (parentToonOrReal.parent.stateDict.type ==="food"){
      foodThicknessUniform.value = 25;
      } else if (parentToonOrReal.parent.stateDict.type ==="bev"){
        bevThicknessUniform.value = 25;
      } 
    } else {
      outlinePass.selectedObjects = [parentToonOrReal];
    }
  } 
}

function applyLeftClickLogic(selectedObject){
  var parentToonOrReal = findToonOrRealParent(selectedObject)
    if (parentToonOrReal){
      let index = styleList.indexOf(parentToonOrReal.parent.stateDict.style);
      index = (index+1) % styleList.length;
      parentToonOrReal.parent.stateDict.style = styleList[index] 
      parentToonOrReal.parent.updateObjectsVisibility()
      checkIntersection();
    }
}

function applyRightClickLogic(selectedObject){
  var parentToonOrReal = findToonOrRealParent(selectedObject)
  if (parentToonOrReal){
    let type = parentToonOrReal.parent.stateDict.type;
    let list = foodbevList[type]
    let index = list.indexOf(parentToonOrReal.parent.stateDict.name);
    index = (index+1) % list.length;
    parentToonOrReal.parent.stateDict.name = list[index] 
    parentToonOrReal.parent.updateObjectsVisibility()
    checkIntersection();
  }
}

function checkMenuSetup(et){
  let comidaSign = scene.getObjectByName("comidaSign");
  let bebidaSign = scene.getObjectByName("bebidaSign");
  if (comidaSign) {comidaSign.rotation.z += sceneParams.signRotationSpeed;}
  if (bebidaSign) {bebidaSign.rotation.z -= sceneParams.signRotationSpeed;}
  if (!sceneScript.menuSetup){
    if (!sceneScript.sitting){
   setCameraPosition(et, sceneScript.sitting);
    } else {
      if (!sceneScript.menuStanding){
        let mainPlane = scene.getObjectByName("Menu");
        if (mainPlane){
          // TODO do the rotation without the global c_rotation
          rotateAboutPoint(mainPlane, new THREE.Vector3(0, -10, 0), new THREE.Vector3(1, 0, 0) , sceneParams.menuRotationSpeed);
          c_rotation = c_rotation + sceneParams.menuRotationSpeed;
        if (signMaterial.opacity < 1){ signMaterial.opacity +=0.02;}
        if (c_rotation >= Math.PI / 2){
          sceneScript.menuStanding = true;
          if (!sceneScript.addedSelectionPlanes){ 
            addSelectionPlanes();
            sceneScript.menuSetup = true;
          }
        }
      }
    }
  }
  }
}

function setCameraPosition(et, sitting = false){
  let startX = -1000;
  let startY = -500;
  let endX = 0;
  let endY = 28;
  let totalTime = sceneParams.timeToArrive;
  let t = et - info.startTime;
  let x = startX + (endX - startX) * (t / totalTime);
  let y = startY + (endY - startY) * (t / totalTime);
  if (x >= endX || sceneScript.sitting){
    x=endX;
    y=endY;
    sceneScript.sitting = true;
    sfxSteps.pause();
  }
  camera.position.set(x, 3, y);
  //camera.position.set(startX, 0, startY);
}

function findToonOrRealParent(object) {
    // Base case: if the current object is null or has no parent, return null
    if (object === null || object.parent === null) {
        return null;
    }
    if (object.parent.name.includes("foodParent") || object.parent.name.includes("bevParent")) {
      const children = object.parent.children;
      const parentStyleName = object.parent.stateDict.style+object.parent.stateDict.name;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.name === parentStyleName) {
            return child;
        }
      }
    }
  return findToonOrRealParent(object.parent);
}

function getLowestChildren(obj) {
    let currentObj = obj;
    while (currentObj && currentObj.children[0].children && currentObj.children[0].children.length > 0) {
      currentObj = currentObj.children[0];
    }
    return currentObj.children;
}

function updateObjectParentsAngle(elapsedTime){
  for (let type of ["food", "bev"]){
    var parent = scene.getObjectByName(type + "ParentGroup");
    if (parent) {
      var updatedAngle = updateAngle(elapsedTime)
      parent.updateParentAngle(updatedAngle)
    }
  } 
}

function setAngle(){
    for (var a = 0; a <= 360; a += 6) {
      let url = "../Screenshots/"+ foodParentGroup.stateDict.name + bevParentGroup.stateDict.name+"/"+a+".png"
      cUrl = a+".png";
      if (!UrlExists(url)){
        let angleInRadians = THREE.MathUtils.degToRad(a);
        foodParentGroup.updateParentAngle(angleInRadians)
        bevParentGroup.updateParentAngle(angleInRadians)
        console.clear()
        //console.log(a)
        //console.log(url)
        break;
      } 
    }
}

function updateAngle(elapsedTime){
  return sceneParams.foodRotationSpeed*elapsedTime % (2*Math.PI);
}

function UrlExists(url)
{
  var http = new XMLHttpRequest();
  http.open('HEAD', url, false);
  http.send();
  return http.status!=404;
}

function getObject(scene, name){
  var gltfObjectO 
  scene.children.forEach( function(child){
    if (child.name == name){
      gltfObjectO = child
      return;
    }
  })
  return gltfObjectO
}

function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
  pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;
  if(pointIsWorld){
      obj.parent.localToWorld(obj.position); // compensate for world coordinate
  }
  obj.position.sub(point); // remove the offset
  obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
  obj.position.add(point); // re-add the offset
  if(pointIsWorld){
      obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
  }
  obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

function countOccurrences(list) {
  var occurrences = {};
  for (var i = 0; i < list.length; i++) {
    var element = list[i];
    if (occurrences[element] === undefined) {
      occurrences[element] = 1;
    } else {
      occurrences[element]++;
    }
  }
  return occurrences;
}

function getAvgColor(texture){
  var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var image = texture.image;
    // Set the canvas size to match the texture dimensions
    canvas.width = image.width;
    canvas.height = image.height;
    // Draw the texture onto the canvas
    context.drawImage(image, 0, 0);
    // Get the image data
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    // Variables to store the sum of red, green, and blue components
    var totalR = 0, totalG = 0, totalB = 0;
    // Loop through each pixel
    for (var i = 0, len = data.length; i < len; i += 4) {
        // Extract RGB values from the pixel data
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        // Accumulate the sum of RGB values
        totalR += r;
        totalG += g;
        totalB += b;
    }
    // Calculate the average RGB values
    var numPixels = imageData.width * imageData.height;
    var avgR = Math.round(totalR / numPixels)*0.5;
    var avgG = Math.round(totalG / numPixels)*0.5;
    var avgB = Math.round(totalB / numPixels)*0.5;
    let color = new THREE.Color(avgR / 255, avgG / 255, avgB / 255);
    let hsl = {h:0,s:0,l:0};
    color.getHSL(hsl);
    color.setHSL(hsl.h, 1.8*hsl.s, 1.5*hsl.l)
    return color;
};

function updatePosVelAnimals(animalMeshes){
  animalMeshes.forEach(function(mesh){
    mesh.rotation.z = mesh.vel.T;
    mesh.position.x += mesh.vel.R*Math.sin(mesh.vel.T);
    mesh.position.z += mesh.vel.R*Math.cos(mesh.vel.T);
    if (mesh.position.x*mesh.position.x+mesh.position.z*mesh.position.z < 60000){
      mesh.vel.T += 0.9*Math.PI;
    }
    if (mesh.position.x*mesh.position.x+mesh.position.z*mesh.position.z > 8000000 ){//16000000){
      mesh.vel.T += Math.PI;
    }
  });
}

function oscilateMouse(t){
  let overlayR = document.getElementById('overlay-R');
  let overlayL = document.getElementById('overlay-L');
  let mO = mouseOpacity*0.5*(1.0 + Math.sin(2*t));
  if (overlayR){
    overlayR.style.opacity = mO
    overlayL.style.opacity = mouseOpacity*(1-mO);
  }
}


function addSound(Url, id){
  const audioContext = new AudioContext();
  const sound = new Audio(Url);
  const soundSource = audioContext.createMediaElementSource(sound);
  soundSource.connect(audioContext.destination);
  sound.id = id;
  return sound;
}

function addBackgroundO(Url) {
  let pmremGenerator = new THREE.PMREMGenerator(renderer);
  let loader = new EXRLoader(manager)
  loader.load(Url, function (texture) {
    texture = adjustColor(texture, 1.06, 1.03, 0.99);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
    exrBackground = texture;
    scene.background = exrCubeRenderTarget.texture;
  });
  pmremGenerator.compileEquirectangularShader();
}

function addBackground(Url){
  new EXRLoader().load( Url, function ( texture ) {
    texture = adjustColor(texture, 1.06, 1.03, 0.99);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
    exrBackground = texture;
    scene.background = exrCubeRenderTarget.texture;
  });
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  pmremGenerator.compileEquirectangularShader();
}

function adjustColor(texture, r, g, b) {
  texture.encoding = THREE.LinearEncoding; // Ensure linear encoding for proper color adjustments
  texture = texture.clone(); // Clone the texture to avoid modifying the original
  //texture.image = texture.image.clone(); // Clone the image data
  const imageData = texture.image.data;

  for (let i = 0; i < imageData.length; i += 4) {
    // Adjust RGB channels individually
    imageData[i] *= r; // Red channel
    imageData[i + 1] *= g; // Green channel
    imageData[i + 2] *= b; // Blue channel
  }

  return texture;
}

function addBuilding(){
  let loader = new GLTFLoader(manager);
  loader.load('./Assets/3D/Building/scene.gltf', function (gltf) {
    gltf.scene.scale.set(37,37,37);
    gltf.scene.rotation.y = - Math.PI / 2 - 1.0; 
    gltf.scene.position.set(-10, -47, -100);
    scene.add(gltf.scene);
    //assetList.push(gltf.scene);
  });
}

function addAnimals(){
  let occ = countOccurrences(animalList);
  let loader = new GLTFLoader(manager);
  loader.load('./Assets/3D/Animals/scene.gltf', function (gltf) {
    gltf.scene.traverse(function (object) {
      if (object.isMesh) {
        if (object.name) {
          object.name = object.name.replace(/Final.*/, '');
          if (animalList.includes(object.name)){
            object.scale.set(25, 25, 25);
            object.rotation.x = -Math.PI / 2 ;
            let ypos;
            if (object.name == "07shark" || object.name.endsWith("bird")){
              ypos = 20
            }
            else {
              ypos = -47
            }
            for (let i = 0 ; i < occ[object.name]; i++){
              let clone = object.clone()
              let [pos, vel] = getInitPosVel();
              clone.position.set(pos[0], ypos, pos[1]);
              clone.vel = {"R": vel[0], "T":vel[1]};
              clone.rotation.z = clone.vel.T;
              animalMeshes.push(clone);
              clone.name = "animal_"+object.name +"_"+i ;
              scene.add(clone);
              //console.log("added "+ clone.name)
            }
          }
        }
      }
    });
  });
}

function addFish(){
  let fishList = [];
  //first we create a list of repeated animals to populate the scene
  for (var i = 0; i < sceneParams.fishN; i++) {
    let randomIndex = getRandomNumber(0, info.fishList.length);
    fishList.push(info.fishList[randomIndex]);
  }
  let occ = countOccurrences(fishList);
  let loader = new GLTFLoader(manager);
  loader.load('./Assets/3D/FishGroup/scene.gltf', function(gltf){
    gltf.scene.traverse(function (object) {
      if (object.isMesh ) {
          object.scale.set(info.fishScales[object.name], 
                          info.fishScales[object.name], 
                          info.fishScales[object.name]);
        object.rotation.x = -Math.PI / 2 ;
        for (let i = 0 ; i < occ[object.name]; i++){
          let clone = object.clone()
          let [pos, vel] = getInitPosVel();
          clone.position.set(pos[0], 20, pos[1]);
          clone.vel = {"R": vel[0], "T":vel[1]};
          clone.rotation.z = clone.vel.T;
          animalMeshes.push(clone);
          clone.name = "fish_"+object.name +"_"+i ;
          scene.add(clone);
        }
      }
    })
  })
}


function getInitPosVel(){
  var minR = 300;
  var maxR = 2500;
  var minVel = 0.25;
  var maxVel = 0.5;
  var minT = 0;
  var maxT = 2*Math.PI;
  var minA = -0.77*Math.PI;
  var ARange  = Math.PI*1.85;
  var maxA = minA + ARange; 
  var randomR = Math.random() * (maxR - minR) + minR;
  var randomA = Math.random() * (maxA - minA) + minA;
  var randomX = randomR * Math.cos(randomA);
  var randomZ = randomR * Math.sin(randomA)
  var randomVR = (Math.floor(Math.random() * (maxVel - minVel + 1)) + minVel);
  var randomVT = (Math.floor(Math.random() * (maxT - minT + 1)) + minT);
  return [[randomX, randomZ],[randomVR, randomVT]] 
}

function getInitPosVelTrees(){
  var minPos = 400;
  var maxPos = 2000;
  var minVel = 0.2;
  var maxVel = 0.5;
  var minT = 0;
  var maxT = 2*Math.PI;
  var radius = Math.random() *(maxPos - minPos) + minPos;
  var angle = Math.random()*2*Math.PI; 
  var randomX = radius* Math.sin(angle);
  var randomZ = radius* Math.cos(angle);
  var randomVR = (Math.floor(Math.random() * (maxVel - minVel + 1)) + minVel);
  var randomVT = (Math.floor(Math.random() * (maxT - minT + 1)) + minT);
  return [[randomX, randomZ],[randomVR, randomVT]] 
}

function getRandomDir() {
  var randomValue = Math.random();
  if (randomValue < 0.5) {
    return -1;
  } else {
    return 1;
  }
}

function addTrees(){
  let loaderbirch = new GLTFLoader(manager);
  loaderbirch.load('./Assets/3D/Trees/birch/scene.gltf', function (gltf) {
    gltf.scene.scale.set(9,9,9);
    for (let i = 0; i < sceneParams.treeN; i++) {
      let j = 0;
      gltf.scene.traverse(function (object) {
        object.name = "tree_birch_"+i+"_mesh_"+j;
        j++;
      });
      let birchClone = gltf.scene.clone();
      let [pos, vel] = getInitPosVel();
      birchClone.position.x = pos[0]
      birchClone.position.y = -52; // Set the Y position as needed
      birchClone.position.z = pos[1] 
      scene.add(birchClone);
    }
  });
  
  let loaderpalm = new GLTFLoader(manager);
  loaderpalm.load('./Assets/3D/Trees/palm_tree_tall/scene.gltf', function (gltf) {
    gltf.scene.scale.set(15,15,15);
    for (let i = 0; i < sceneParams.treeN; i++) {
      let j = 0;
      gltf.scene.traverse(function (object) {
        object.name = "tree_palm_"+i+"_mesh_"+j;
        j++;
      });
      let palmClone = gltf.scene.clone();
      let [pos, vel] = getInitPosVel();
      palmClone.position.x = pos[0]
      palmClone.position.y = -52; // Set the Y position as needed
      palmClone.position.z = pos[1] // Replace with your desired Z range
      scene.add(palmClone);
    }
  });
  
  let loaderpine = new GLTFLoader(manager);
  loaderpine.load('./Assets/3D/Trees/pine_tree/scene.gltf', function (gltf) {
    gltf.scene.scale.set(0.7,0.7,0.7);
    for (let i = 0; i < sceneParams.treeN; i++) {
      let j = 0;
      gltf.scene.traverse(function (object) {
        object.name = "tree_pine_"+i+"_mesh_"+j;
        j++;
      });
      let pineTreeClone = gltf.scene.clone();
      let [pos, vel] = getInitPosVel();
      pineTreeClone.position.x = pos[0]
      pineTreeClone.position.y = -52; // Set the Y position as needed
      pineTreeClone.position.z = pos[1] // Replace with your desired Z range
      scene.add(pineTreeClone);
    }
  });
}

function addInstructionSigns(){
  let loader = new GLTFLoader(manager);
  loader.load('./Assets/3D/Signs/comida.glb', function (gltf) {
    gltf.scene.scale.set(3, 3, 3);
    gltf.scene.rotation.x = Math.PI / 2.2;
    gltf.scene.position.set(-13, -5, 0);
    gltf.scene.traverse(function (node) {
      if (node.isMesh) {
        node.material = signMaterial;
        node.name = "comidaSign";
      }
    });
    //assetList.push(gltf.scene);
    gltf.scene.name = "comidaSign";
    scene.add(gltf.scene);
  });
  loader.load('./Assets/3D/Signs/bebida.glb', function (gltf) {
    gltf.scene.scale.set(3,3,3);
    gltf.scene.rotation.x =  Math.PI / 2.2 ; 
    gltf.scene.position.set(13, -5, 0);
    gltf.scene.traverse(function (node) {
      if (node.isMesh) {
        node.material = signMaterial;
        node.name = "bebidaSign";
      }
    });
    //assetList.push(gltf.scene);
    gltf.scene.name = "bebidaSign";
    scene.add(gltf.scene);
  });
}

function addMenu(){
  let mainPlaneGeometry = new THREE.PlaneGeometry(15.4, 20.0);
  let mainPlaneMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa , transparent: true, opacity: 1.0});
  //let sphereGeometry = new THREE.SphereGeometry(0.1,100);
  //let sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  //let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  //sphere.position.set(0, -10, 0);
  //scene.add(sphere);
  let textureLoader = new THREE.TextureLoader(manager);
  let menuPath = './Assets/Img/menu.png';
  if (adds.censor){menuPath ='./Assets/Img/censoredMenu.png';}
  textureLoader.load(menuPath, function(texture) {
  mainPlaneMaterial.map = texture;
  //assetList.push(texture);
  mainPlaneMaterial.needsUpdate = true; // Update material to reflect the changes
  });
  let mainPlane = new THREE.Mesh(mainPlaneGeometry, mainPlaneMaterial);
  mainPlane.name = "Menu";
  //let boundingBox = new THREE.BoxHelper(mainPlane,0xff000);
  //scene.add(boundingBox)
  scene.add(mainPlane);
  rotateAboutPoint(mainPlane, new THREE.Vector3(0, -10, 0) , new THREE.Vector3(1, 0, 0) ,  -Math.PI / 2);
}

function addSelectionPlanes(){
  addSelectionPlane({type :"food", name:"Ramen", position:[-3.25,5.3], dimensions:[6.2,2.5]});
  addSelectionPlane({type :"food", name:"Paketaxo", position:[-3.25,2.5], dimensions:[6.2,2.5]});
  addSelectionPlane({type :"food", name:"Concha", position:[-3.25,-0.1], dimensions:[6.2,2.0]});
  addSelectionPlane({type :"food", name:"Sushi", position:[-3.25,-2.20], dimensions:[6.2,1.8]});
  addSelectionPlane({type :"bev", name:"Guama", position:[3.8,6.25], dimensions:[6.6,1.1]});
  addSelectionPlane({type :"bev", name:"Coca", position:[3.8,4.45], dimensions:[6.6,2.1]});
  addSelectionPlane({type :"bev", name:"Cafe", position:[3.8,1.6], dimensions:[6.6,3.0]});
  addSelectionPlane({type :"bev", name:"Matcha", position:[3.8,-0.95], dimensions:[6.6,1.8]});
  addSelectionPlane({type :"play", name:"Play", position:[-3.6,-6.0], dimensions:[5.0,1.9], selectable:false});
  sceneScript.addedSelectionPlanes = true;
}

function addSelectionPlane({type, name, position, dimensions, selectable = true}){
  let mainPlane = scene.getObjectByName("Menu");
  let smallerPlaneGeometry = new THREE.PlaneGeometry(dimensions[0], dimensions[1]);
  let smallerPlaneMaterial = new THREE.MeshBasicMaterial({ color: 0x7c9072, transparent: true, opacity: 0.0});
  let  smallerPlane = new THREE.Mesh(smallerPlaneGeometry, smallerPlaneMaterial);
  smallerPlane.type = type;
  smallerPlane.name = name;
  smallerPlane.selectable = selectable;
  smallerPlane.selected = false;
  smallerPlane.hover = false;
  smallerPlane.position.x =  position[0];
  smallerPlane.position.y = position[1];
  smallerPlane.position.z = 1.0;
  mainPlane.add(smallerPlane);
}

function addFloor(){
  let rep = 100;
  let planeDims = rep*50
  let loader = new THREE.TextureLoader(manager);
  let metallicRoughnessTexture = loader.load('./Assets/3D/Floor/textures/None_metallicRoughness.png');
  let normalMapTexture = loader.load('./Assets/3D/Floor/textures/None_normal.jpeg');
  let baseColorTexture = loader.load('./Assets/3D/Floor/textures/None_baseColordark.png');
  //let bumpMapTexture = metallicRoughnessTexture;
  metallicRoughnessTexture.repeat.set(rep, rep);
  normalMapTexture.repeat.set(rep, rep); 
  baseColorTexture.repeat.set(rep, rep);
  //bumpMapTexture.repeat.set(rep, rep);
  let material = new THREE.MeshStandardMaterial({
    map: baseColorTexture,
    roughnessMap: metallicRoughnessTexture,
    normalMap: normalMapTexture, 
  });
  var planeGeometry = new THREE.PlaneGeometry(planeDims, planeDims);
  let planeMesh = new THREE.Mesh(planeGeometry, material);
  planeMesh.rotation.x = -Math.PI/2;
  planeMesh.position.y = -48;
  metallicRoughnessTexture.wrapS = THREE.RepeatWrapping;
  metallicRoughnessTexture.wrapT = THREE.RepeatWrapping;
  normalMapTexture.wrapS = THREE.RepeatWrapping;
  normalMapTexture.wrapT = THREE.RepeatWrapping;
  baseColorTexture.wrapS = THREE.RepeatWrapping;
  baseColorTexture.wrapT = THREE.RepeatWrapping;
  planeMesh.name = "Floor";
  scene.add(planeMesh);
}

function addRestaurantScene(){
  if (adds.background) {addBackground("./Assets/Img/sunset_2k.exr");}
  if (adds.building){addBuilding();}
  if (adds.floor) {addFloor();}
  if (adds.animals) {addAnimals();}
  if (adds.fish) {addFish();}
  if (adds.trees) { addTrees();}
  if (adds.signs) {addInstructionSigns();}
  if (adds.menu) {addMenu()};
}

function foodOnBeforeCompile( shader ) {
  var width = window.innerWidth;
  var height = window.innerHeight;
  shader.uniforms.outlineColor = { value: outlineColor };
  shader.uniforms.outlineThickness = foodThicknessUniform;
  shader.uniforms.resolution = { value: new THREE.Vector2(width, height) };
  shader.fragmentShader = 'uniform vec3 outlineColor;\n' + shader.fragmentShader;
  shader.fragmentShader = 'uniform float outlineThickness;\n' + shader.fragmentShader;
  shader.fragmentShader = 'uniform vec2 resolution;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    [
      '#ifdef USE_MAP',
      '	vec4 texelColor = texture2D( map, vMapUv ) ;',
      '	texelColor = texelColor ;',
      ' vec2 texel = vec2( 1.0 / resolution.y, 1.0 / resolution.y );',
      ' #define OFFSET_COUNT 8',
      ' vec2 offsets[OFFSET_COUNT];',
      ' offsets[0] = vec2( 0, 1 );',
      ' offsets[1] = vec2( 0, -1 );',
			' offsets[2] = vec2( 1, 0 );',
			' offsets[3] = vec2( -1, 0 );',
      ' offsets[4] = vec2( -1, 1 );',
      ' offsets[5] = vec2( 1, -1 );',
			' offsets[6] = vec2( 1, 1 );',      
			' offsets[7] = vec2( -1, -1 );',
      '#ifdef INSET_OUTLINE',
      ' float a = 1.0;',
      ' for( int i = 0; i < OFFSET_COUNT; i ++ ) {',
      '  float val = texture2D( map, vMapUv + texel * offsets[i] * outlineThickness ).a;',
      ' // a *= val;',
      ' a = 1;',
      ' }',
      ' texelColor.rgb = mix( outlineColor, texelColor.rgb, a );',
      '#else',
      ' float a = 0.0;',
      ' for( int i = 0; i < OFFSET_COUNT; i ++ ) {',
      '  float val = texture2D( map, vMapUv + texel * offsets[i] * outlineThickness ).a;',
      '  a = max(a, val);',
      ' }',
      'if (outlineThickness > 1.0){',
      ' texelColor = mix( vec4(outlineColor, a), texelColor, texelColor.a );',
      '} else {',
      ' texelColor =  texelColor;}',
      '#endif',
      '	diffuseColor *= texelColor;',
      '#endif'
    ].join( '\n' )
  );
  materialShader = shader;
}

function bevOnBeforeCompile( shader ) {
  var width = window.innerWidth;
  var height = window.innerHeight;
  shader.uniforms.outlineColor = { value: outlineColor };
  shader.uniforms.outlineThickness = bevThicknessUniform;
  shader.uniforms.resolution = { value: new THREE.Vector2(width, height) };
  shader.fragmentShader = 'uniform vec3 outlineColor;\n' + shader.fragmentShader;
  shader.fragmentShader = 'uniform float outlineThickness;\n' + shader.fragmentShader;
  shader.fragmentShader = 'uniform vec2 resolution;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    [
      '#ifdef USE_MAP',
      '	vec4 texelColor = texture2D( map, vMapUv ) ;',
      '	texelColor = texelColor ;',
      ' vec2 texel = vec2( 1.0 / resolution.y, 1.0 / resolution.y );',
      ' #define OFFSET_COUNT 8',
      ' vec2 offsets[OFFSET_COUNT];',
      ' offsets[0] = vec2( 0, 1 );',
      ' offsets[1] = vec2( 0, -1 );',
			' offsets[2] = vec2( 1, 0 );',
			' offsets[3] = vec2( -1, 0 );',
      ' offsets[4] = vec2( -1, 1 );',
      ' offsets[5] = vec2( 1, -1 );',
			' offsets[6] = vec2( 1, 1 );',      
			' offsets[7] = vec2( -1, -1 );',
      '#ifdef INSET_OUTLINE',
      ' float a = 1.0;',
      ' for( int i = 0; i < OFFSET_COUNT; i ++ ) {',
      '  float val = texture2D( map, vMapUv + texel * offsets[i] * outlineThickness ).a;',
      ' // a *= val;',
      ' a = 1;',
      ' }',
      ' texelColor.rgb = mix( outlineColor, texelColor.rgb, a );',
      '#else',
      ' float a = 0.0;',
      ' for( int i = 0; i < OFFSET_COUNT; i ++ ) {',
      '  float val = texture2D( map, vMapUv + texel * offsets[i] * outlineThickness ).a;',
      '  a = max(a, val);',
      ' }',
      'if (outlineThickness > 1.0){',
      ' texelColor = mix( vec4(outlineColor, a), texelColor, texelColor.a );',
      '} else {',
      ' texelColor =  texelColor;}',
      '#endif',
      '	diffuseColor *= texelColor;',
      '#endif'
    ].join( '\n' )
  );
  materialShader = shader;
}

function addToonModel(gltfToonObject, parentGroup, modelName){
    gltfToonObject.name = modelName;
    const modelParts = getLowestChildren(gltfToonObject);
    modelParts.forEach(function(part){
      let toonMaterial = new THREE.MeshToonMaterial();
      if (part.material.map){
        toonMaterial.color = getAvgColor(part.material.map);
        //toonMaterial.normalMap = part.material.normalMap;
        toonMaterial.transparent = part.material.transparent;
        toonMaterial.opacity = part.material.opacity*1.0;
      } else {
        toonMaterial.color = part.material.color;
        //toonMaterial.normalMap = null;
        toonMaterial.transparent = part.material.transparent;
        toonMaterial.opacity = part.material.opacity*2.0;
      }
      part.material = toonMaterial;
    });
    parentGroup.add(gltfToonObject);
}

function addModel(params, parentGroup){
    const modelName = params.name;
    const in_path = "./Assets/3D/FoodBevModels/"+modelName +"/scene.gltf";
    const modelPromise = loadModel(in_path);
    modelPromise.then(function(gltfObject) {
        if (params.type === "food"){
          params.pos[0] = -10;
          params.pos[2] = -12;
          params.pos[1] = -10;
        }
        if (params.type === "bev"){
          params.pos[0] = 10;
          params.pos[2] = -12;
          params.pos[1] = -10;
        }
        params.scale = sceneParams.worldToFoodBevScaling*params.scale;
        gltfObject.scale.x = params.scale;
        gltfObject.scale.y = params.scale;
        gltfObject.scale.z = params.scale;
        const box = new THREE.Box3();
        box.setFromObject(gltfObject);
        const center = new THREE.Vector3();
        box.getCenter(center);
        params.pos[0] = -center.x +params.pos[0]
        //params.pos[1] = -center.y +params.pos[1]
        params.pos[1] = - box.min.y + params.pos[1]
        params.pos[2] = -center.z +params.pos[2]
        gltfObject.position.set(params.pos[0],params.pos[1], params.pos[2]);
        gltfObject.rotation.x = THREE.MathUtils.degToRad(params.rot[0]);
        gltfObject.rotation.y = THREE.MathUtils.degToRad(params.rot[1]);
        gltfObject.rotation.z = THREE.MathUtils.degToRad(params.rot[2]);
        gltfObject.name = "real"+modelName;
        const modelParts = getLowestChildren(gltfObject);
        if (params.name === "Guama"){
          modelParts.forEach(function(part){
          });
        }
        //console.log(gltfObject);
        parentGroup.add(gltfObject);
        let gltfToonObject = gltfObject.clone();
        addToonModel(gltfToonObject, parentGroup, "toon"+modelName);
    }).catch(function(error) {
        console.error('Error loading model:', error);
    });
}

function addRealAndToonModels(){
    modelsParams.forEach(function(params){
      if (params.type == "food"){
        let parentGroup = foodParentGroup;
        addModel(params, parentGroup);
      } else if (params.type =="bev"){
        let parentGroup = bevParentGroup;
        addModel(params, parentGroup);
      }
    });
}

function addFoodnBevSprites(){
  modelsParams.forEach(function(params){
    let spriteName = "sprite"+params.name;
    let source = "./Assets/Img/Sprites/";
    if (params.type === "food"){
      let sourcePath = source + params.name+"/";
      let spriteTexture = new THREE.TextureLoader().load(sourcePath+"0.png");
      let spriteMaterial = new THREE.SpriteMaterial({map:spriteTexture});
      spriteMaterial.depthFunc = THREE.AlwaysDepth;
      spriteMaterial.onBeforeCompile = foodOnBeforeCompile;
      let foodSprite = new rotatableSprite(spriteMaterial);
      foodSprite.name = spriteName;
      foodSprite.source = sourcePath; 
      foodSprite.scale.set(info.spriteScales[params.name][3]*info.spriteScales[params.name][0], 
                           info.spriteScales[params.name][3]*info.spriteScales[params.name][1],
                           info.spriteScales[params.name][3]*info.spriteScales[params.name][2]);
      foodSprite.position.set(info.spritePositions[params.name][0], 
                              info.spritePositions[params.name][1],
                              info.spritePositions[params.name][2]);
      foodParentGroup.add(foodSprite);
    } 
    if (params.type === "bev"){
      let sourcePath = source + params.name+"/";
      let spriteBTexture = new THREE.TextureLoader().load(sourcePath+"0.png");
      let spriteBMaterial = new THREE.SpriteMaterial({map:spriteBTexture});
      spriteBMaterial.depthFunc = THREE.AlwaysDepth;
      spriteBMaterial.onBeforeCompile = bevOnBeforeCompile;
      let bevSprite = new rotatableSprite(spriteBMaterial);
      bevSprite.source = sourcePath
      bevSprite.name = spriteName;
      bevSprite.scale.set(info.spriteScales[params.name][3]*info.spriteScales[params.name][0], 
                          info.spriteScales[params.name][3]*info.spriteScales[params.name][1],
                          info.spriteScales[params.name][3]*info.spriteScales[params.name][2]);
      bevSprite.position.set(info.spritePositions[params.name][0], 
                             info.spritePositions[params.name][1],
                             info.spritePositions[params.name][2]);
      
      bevParentGroup.add(bevSprite);
    }
  })
}


function addFoodBevModelsAndMaterials(){
  addRealAndToonModels();
  foodParentGroup.name = "foodParentGroup";
  bevParentGroup.name = "bevParentGroup"
  //scene.add(foodParentGroup);
  //scene.add(bevParentGroup);
  addFoodnBevSprites();
  foodParentGroup.children.forEach((child)=>{
    //child.position.y +=3

  })
  bevParentGroup.children.forEach((child)=>{
    //child.position.y +=3
  })
}

function sceneObjectsSetup(){
  scene.traverse(function (child) {
    if (child.isMesh) {
      //if (!printed){
        //console.log(child);
      //}
      if (child.name) {
        if (child.name =="comidaSign" ){
          child.rotation.z += 0.04;
          child.material.envMapIntensity = 0.5;
          //child.material.needsUpdate = true;
          child.material.envMap = newEnvMap;
        }
        if(child.name == "bebidaSign"){
          child.rotation.z -= 0.04;
          child.material.envMapIntensity = 0.5;
          //child.material.needsUpdate = true;
          child.material.envMap = newEnvMap;
        }
        if (child.name == "Menu" || child.name =="Play"){
        }
        if (child.name == "Floor" ){
          child.material.envMapIntensity = 0.27;
          //child.material.needsUpdate = true;
          child.material.envMap = newEnvMap;
        }
        if (child.name.startsWith("SM_")){//&& child.name !="comida" && child.name !="bebida") {
          child.material.envMapIntensity = 1.05;
          //child.material.needsUpdate = true;
          child.material.envMap = newEnvMap;
       }
       if (child.name.startsWith("animal_")){
          child.material.envMapIntensity = 1.0;
          //child.material.needsUpdate = true;
          child.material.envMap = newEnvMap;
       }
       if (child.name.startsWith("fish_")){
        child.material.envMapIntensity = 1.0;
        //child.material.needsUpdate = true;
        child.material.envMap = newEnvMap;
     }
       if (child.name.startsWith("tree_")){
          child.material.envMapIntensity = 0.6;
          //child.material.needsUpdate = true;
          child.material.envMap = newEnvMap;
       }
      } 
    }
  });
  foodParentGroup.children.forEach(function(object){
    if (object.name.includes("real")){
      object.traverse(function(child){
        if (child.isMesh && child.material){
          child.material.envMap = newEnvMap;
          child.material.envMapIntensity = 0.5;
        }
      });
    }
  });
  bevParentGroup.children.forEach(function(object){
    if (object.name.includes("real")){
      object.traverse(function(child){
        if (child.isMesh && child.material){
          child.material.envMap = newEnvMap;
          child.material.envMapIntensity = 0.5;
        }
      });
    }
    if (object.name.includes("toon")){
      object.traverse(function(child){
        if (child.isMesh && child.material){
          //child.material.lightMap = newEnvMap;
          //child.material.lightMapIntensity = 1.0;
        }
      });
    }
  });
}

function init(){
  prepareScene();
  addLights();
  if (adds.cameraControl){addControls()};
  addRestaurantScene();
  if (adds.foodbev){addFoodBevModelsAndMaterials();}
}

function render() {
  requestAnimationFrame( render );
  camera.lookAt(0, 0.5, 0);
  let elapsedTime = kronos.getElapsedTime();
  sceneScriptLogic(elapsedTime);
  updatePosVelAnimals(animalMeshes);
  //console.log(exrCubeRenderTarget)
  composer.render();
}

function sceneScriptLogic(elapsedTime){
  if (!sceneScript.eating) {
    checkMenuSetup(elapsedTime);
  } else { 
    /*
    if (adds.screenshot){
      setCameraPosition(elapsedTime, true)
      cooking(elapsedTime)
      scene.background = null;
      if (!setangle){
        setAngle();
        setangle = true;
      }
    }
    */
    updateObjectParentsAngle(elapsedTime); //ADD AGAIN!!!
    oscilateMouse(elapsedTime);
    //if (!sceneScript.fadedIn){fadeIn(elapsedTime)}
  }
  if (sceneScript.cooking) {
    if (!sceneScript.fadedOut) {fadeOut();}
    else {cooking(elapsedTime)}
  }
}

function takeScreenshot() {
  renderer.render(scene,camera)
  var imageIndex = 0
  var dataURL = renderer.domElement.toDataURL('image/png');
  var link = document.createElement('a');
  link.download = cUrl;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function waitingForStart1(){
  bevParentGroup.updateObjectsVisibility();
  foodParentGroup.updateObjectsVisibility();
  newEnvMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
  sceneObjectsSetup();
  console.log(exrCubeRenderTarget, "TARGET")
  osakaSong.volume = 0.8;
  osakaSong.loop = true;
  //let loading = 
  document.getElementById("loadingTextbox").remove();
  //loading.remove()
  let button = document.getElementById("startButton");
  button.addEventListener("click", function(){
    osakaSong.play();
    sfxSteps.play();
    info.startTime = kronos.getElapsedTime()
    button.remove()
    document.getElementById("intro").remove();
    render();
    console.log("Render Started");
  });
  button.style.opacity = 1.0
}


function addAllSounds(){
  if (adds.songs){
  osakaSong = addSound("./Assets/Audio/osaka.mp3", "osakaSong");
  tteokSong = addSound("./Assets/Audio/tteok.mp3", "tteokSong");
  osakaSong.volume = 0.8;
  osakaSong.loop = true;
  }
  if (adds.sfx){
    sfxClick = addSound("./Assets/Audio/click.mp3", "sfxClick");
    sfxShh = addSound("./Assets/Audio/shh.mp3", "sfxShh");
    sfxPop = addSound("./Assets/Audio/pop.mp3", "sfxPop");
    sfxPop.volume = 0.8;
    sfxSteps = addSound("./Assets/Audio/cSteps.mp3", "sfxSteps");
  }
}


function waitingForEXR(){
  if (exrCubeRenderTarget){
    bevParentGroup.updateObjectsVisibility();
    foodParentGroup.updateObjectsVisibility();
    newEnvMap = exrCubeRenderTarget.texture;
    sceneObjectsSetup();
    document.getElementById("loadingTextbox").remove();
    let button = document.getElementById("startButton");
    button.addEventListener("click", function(){
      info.startTime = kronos.getElapsedTime()
      button.remove()
      document.getElementById("intro").remove();
      addAllSounds();
      setTimeout(()=>{
        osakaSong.play();
        sfxSteps.play();
        render();
        console.log("Render Started");
      }, 1000)
    });
    button.style.opacity = 1.0
    clearInterval(EXRInterval);
    console.log("EXR target compiled!")
  }
}

function waitingForStart(){
  EXRInterval = setInterval(waitingForEXR, 500);
}


init();
sceneObjectsSetup();
if (adds.screenshot){
  document.getElementById("shot").addEventListener('click', takeScreenshot);
  setAngle()
}

manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
	console.log( 'Started loading file: ' + url + '.Loaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onProgress = function(url, itemsLoaded, itemsTotal ) {
 console.log( 'Loading file: ' + url + '. Loaded ' + Math.round((itemsLoaded/itemsTotal)*100).toFixed(1) + '% of files.' );
}

manager.onLoad = function(){
  setTimeout(() => {
    waitingForStart();
  }, "2000");
  console.log("Loaded all assets")
  //console.log(foodParentGroup,bevParentGroup)
}
