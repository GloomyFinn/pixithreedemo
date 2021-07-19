import * as PIXI from "pixi.js";
import * as THREE from "three";
import {GLTF, GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

const width: number = 800;
const height: number = 600;

// 3D canvas
const scene_3D: THREE.Scene = new THREE.Scene();
const light: THREE.PointLight = new THREE.PointLight(0xFF0000, 10, 10000);
light.position.set(50, 75, 100);
scene_3D.add(light);
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, width/height, 1, 10000);
const canvas_3D: THREE.WebGLRenderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
canvas_3D.setSize(width, height);

// Add Ninja
let mixer: THREE.AnimationMixer;
let modelReady = false;
let animationActions: THREE.AnimationAction[] = new Array();
let activeAction: THREE.AnimationAction;
let lastAction: THREE.AnimationAction;
const gltfLoader: GLTFLoader = new GLTFLoader();
let playerGltf: GLTF;

gltfLoader.load(
    './models/cibus_ninja.glb',
    (gltf) => {
        playerGltf = gltf;

        mixer = new THREE.AnimationMixer(gltf.scene);

        for (let i: number = 0; i < gltf.animations.length; i++)
        {
            let animationAction = mixer.clipAction((gltf as any).animations[i]);
            animationActions.push(animationAction);
        }

        activeAction = animationActions[animationActions.length-1];
        activeAction.play();
        gltf.scene.position.z = -10;
        gltf.scene.position.y = -5;
        scene_3D.add(gltf.scene);
        modelReady = true;
    }
)

const setAnimation = (toAction: THREE.AnimationAction) => {
    if (toAction != activeAction)
    {
        lastAction = activeAction;
        activeAction = toAction;
        lastAction.fadeOut(0.3);
        activeAction.reset();
        activeAction.fadeIn(0.3);
        activeAction.play();
    }
}

// 2D canvas
let scene_2D: PIXI.Container = new PIXI.Container;
const canvas_2D: PIXI.AbstractRenderer = PIXI.autoDetectRenderer({width: width, height: height});
canvas_2D.backgroundColor = 0x000000;
document.body.appendChild(canvas_2D.view);

// Map 3D canvas to 2D canvas
const texture_3D: PIXI.Texture = PIXI.Texture.from(canvas_3D.domElement);
const sprite_3D: PIXI.Sprite = new PIXI.Sprite(texture_3D);
sprite_3D.x = (width - sprite_3D.width) / 2;
sprite_3D.y = (height - sprite_3D.height) / 2;

// Parallaxing Background
let bgBackTexture: PIXI.Texture = PIXI.Texture.from('./images/treesBack_b.png');
let bgMiddleTexture: PIXI.Texture = PIXI.Texture.from('./images/treesMiddle_b.png');
let bgFrontTexture: PIXI.Texture = PIXI.Texture.from('./images/treesFront_b.png');

let bgBackTiling: PIXI.TilingSprite = new PIXI.TilingSprite(bgBackTexture, width, height);
let bgMiddleTiling: PIXI.TilingSprite = new PIXI.TilingSprite(bgMiddleTexture, width, height);
let bgFrontTiling: PIXI.TilingSprite = new PIXI.TilingSprite(bgFrontTexture, width, height);

// Add 3D model behind the front background image. Behind the trees...
scene_2D.addChild(bgBackTiling, bgMiddleTiling, sprite_3D, bgFrontTiling);

function moveBackground(direction: number)
{
    bgFrontTiling.tilePosition.x += direction;
    bgMiddleTiling.tilePosition.x += direction / 2;
    bgBackTiling.tilePosition.x += direction / 4;
}

window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);

// Get player input
let arrowLeftDown: boolean = false;
let arrowRightDown: boolean = false;
let arrowUpDown: boolean = false;
let arrowDownDown: boolean = false;

function keyDown(e: KeyboardEvent)
{
    if (e.code == "ArrowLeft") arrowLeftDown = true;
    if (e.code == "ArrowRight") arrowRightDown = true;
    if (e.code == "ArrowUp") arrowUpDown = true;
    if (e.code == "ArrowDown") arrowDownDown = true;
}

function keyUp(e: KeyboardEvent)
{
    if (e.code == "ArrowLeft") arrowLeftDown = false;
    if (e.code == "ArrowRight") arrowRightDown = false;
    if (e.code == "ArrowUp") arrowUpDown = false;
    if (e.code == "ArrowDown") arrowDownDown = false;
}

// Player movement
const playerXMovementSpeed: number = 2;
const playerYMovementSpeed: number = 0.1;
const playerZMovementSpeed: number = 0.05;
const faceLeft: number = -90;
const faceRight: number = 90;
const faceFront: number = 110;
const faceBack: number = 0;
const areaXLimit: number = 150;
const areaYLimitTop: number = -5;
const areaYLimitDown: number = 0;

function playerMovement()
{  
    if (!modelReady) return;

    const player: PIXI.DisplayObject = scene_2D.children[2];

    if (arrowLeftDown)
    {
        playerGltf.scene.rotation.y = faceLeft;
        setAnimation(animationActions[4]);

        if (player.position.x  > -areaXLimit)
        {
            player.position.x -= playerXMovementSpeed;
        }
        else
        {
            moveBackground(playerXMovementSpeed);
        }
    }

    if (arrowRightDown)
    {
        playerGltf.scene.rotation.y = faceRight;
        setAnimation(animationActions[4]);

        if (player.position.x  < areaXLimit)
        {
            player.position.x += playerXMovementSpeed;
        }
        else
        {
            moveBackground(-playerXMovementSpeed);
        }
    }

    if (!arrowLeftDown && !arrowRightDown && !arrowUpDown && !arrowDownDown)
    {
        playerGltf.scene.rotation.y = faceFront;
        setAnimation(animationActions[1]);
    }

    if (arrowUpDown)
    {
        if (player.position.y > areaYLimitTop)
        {
            player.position.y -= playerYMovementSpeed;
            playerGltf.scene.position.z -= playerZMovementSpeed;
            playerGltf.scene.rotation.y = faceBack;
            setAnimation(animationActions[4]);
        }
    }

    if (arrowDownDown)
    {
        if (player.position.y < areaYLimitDown)
        {
            player.position.y += playerYMovementSpeed;
            playerGltf.scene.position.z += playerZMovementSpeed;
            playerGltf.scene.rotation.y = faceFront;
            setAnimation(animationActions[4]);
        }
    }
}

const clock: THREE.Clock = new THREE.Clock();

function animate()
{
    if (modelReady)
    {
        mixer.update(clock.getDelta());
    }  

    playerMovement();

    canvas_3D.render(scene_3D, camera);
    sprite_3D.texture.update();
    canvas_2D.render(scene_2D);
    requestAnimationFrame(animate);
}

animate();