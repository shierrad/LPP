const sceneScript = {
    menuStanding : false,
    addedSelectionPlanes : false,
    menuSetup : false,
    sitting :false,
    cooking : false,
    fadedOut : false, 
    fadedIn : false,
    eating : false
}

const adds = {
    censor : false,
    screenshot : false,
    cameraControl: false,
    mouse: true,
    axes : false,
    building : true,
    floor: true,
    background : true,
    signs : true,
    menu: true,
    fish: true,
    animals: false,
    trees: true,
    foodbev: true,
    songs: true,
    sfx: true
}

const sceneParams = {
    animalN : 50, //original 80
    fishN : 80,
    treeN : 35, //
    menuRotationSpeed : 0.02,
    signRotationSpeed: 0.02,
    foodRotationSpeed: 1.5,
    worldToFoodBevScaling : 1.0,
    gltfObjectScale : 1.0,
    hoverColor : 0x85ff00,
    selectColor : 0xff00ff,
    timeToArrive: 12 //original 12
}

const info = {
    startTime: null,
    fishList: ["fish1", "fish3", "fish4", "fish5", "fish6", "shark"],
    fishScales: {"fish1":1.5, 
                 "fish3":0.5, 
                 "fish4":0.7,
                 "fish5":1.5,
                 "fish6":0.25, 
                 "shark":50},
    mouseSpritePosition:  [0,-10,0],
    mouseSpriteScale:  [1.5,1.5],
    defaultChoices : {food : "Concha", bev : "Guama"},
    selections: {food: null, bev: null, play: false}, 
    spritePositions: {"Paketaxo": [-10.1,0,-12], 
                    "Concha":   [-10.2,-8,-12],              
                    "Ramen":   [-10.1,-5.7,-12], 
                    "Sushi":   [-10.5,-9,-12],
                    "Matcha":  [10.2, 0.15,-12] ,
                    "Guama":  [10, 1.2,-12] ,
                    "Cafe":  [10, -7.3,-12] ,
                    "Coca":  [9.9,-2.3,-12] },
    spriteScales: {"Paketaxo": [17,25,1,1.05], 
                    "Concha":   [16.5,10,1,0.85],              
                    "Ramen":   [15,15,1,1.0], 
                    "Sushi":   [26,13,1,0.9],
                    "Matcha":   [11,26,1,0.9],
                    "Guama":  [10,26,1,0.95] ,
                    "Cafe":  [15,10,1,0.95],
                    "Coca":  [5.3,15,1,1.15] }
}

const globals = {
}


export {sceneScript, sceneParams, info, adds, globals}
