import "./style.css";
import * as THREE from "three";
//import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import JEASINGS, { Exponential} from 'jeasings';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const scene = new THREE.Scene();
const model = "models/crystalslotmachine.glb";
const camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.1,1000,);
camera.position.set(0, 7, 21); //0, 2.7, 3.7
camera.setRotationFromEuler(new THREE.Euler(-0.15, 0, 0));
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight2.position.set(-5, 10, 7.5);
scene.add(directionalLight);
scene.add(directionalLight2);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight),0.5,.4,0.35);
composer.addPass(bloomPass);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
const fadeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 1 });
const fadePlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMaterial);
fadePlane.position.set(0, 0, -.5);
camera.add(fadePlane);

let tablet1 = [] as THREE.Object3D[];
let tablet2 = [] as THREE.Object3D[];
let tablet3 = [] as THREE.Object3D[];
let tablet4 = [] as THREE.Object3D[];
let intersectObjects = [] as THREE.Object3D[];
let runeReels = [] as THREE.Object3D[];
let crystalGlowMats = [] as THREE.MeshStandardMaterial[];

let doorL: THREE.Object3D;
let doorR: THREE.Object3D;
let spinButton: THREE.Object3D;

let tabletGroup = [tablet1, tablet2, tablet3, tablet4];
let tabletParents = [new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D()];
let floatAnims = [] as JEASINGS.JEasing[];
let spinButtonPosition: THREE.Vector3;
new GLTFLoader().load(model, (gltf) => {
  const tablet1Names = ['Tab1-0', 'Tab1-7', 'Tab1-L', 'Tab1-P', 'Tab1-Q', 'Tab1-R'];
  const tablet2Names = ['Tab2-0', 'Tab2-7', 'Tab2-L', 'Tab2-P', 'Tab2-Q', 'Tab2-R'];
  const tablet3Names = ['Tab3-0', 'Tab3-7', 'Tab3-L', 'Tab3-P', 'Tab3-Q', 'Tab3-R'];
  const tablet4Names = ['Tab4-0', 'Tab4-7', 'Tab4-L', 'Tab4-P', 'Tab4-Q', 'Tab4-R'];

  tablet1 = tablet1Names.map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  tablet2 = tablet2Names.map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  tablet3 = tablet3Names.map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  tablet4 = tablet4Names.map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  runeReels = ['RuneReel1', 'RuneReel2', 'RuneReel3', 'RuneReel4'].map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  const crystalGlow = ['CrystalGlow1', 'CrystalGlow2', 'CrystalGlow3', 'CrystalGlow4', 'CrystalGlow5', 'CrystalGlow6'].map(name => gltf.scene.getObjectByName(name));
  spinButton = gltf.scene.getObjectByName('SpinButton') as THREE.Object3D;
  spinButtonPosition = spinButton.position;

  crystalGlow.forEach(cg => {
    if (!cg) return;
    cg.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
                // If the mesh has multiple materials
                child.material = child.material.map((mat) => {
                    if (mat instanceof THREE.MeshStandardMaterial) {
                        const clonedMat = mat.clone();
                        crystalGlowMats.push(clonedMat);
                        return clonedMat;
                    }
                    return mat;
                });
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
                // If the mesh has a single material
                const clonedMat = child.material.clone();
                crystalGlowMats.push(clonedMat);
                child.material = clonedMat;
            }
        }
    });
});

  intersectObjects = ['SpinButton'].map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  doorL = gltf.scene.getObjectByName('DoorL') as THREE.Object3D;
  doorR = gltf.scene.getObjectByName('DoorR') as THREE.Object3D;
  for (let i = 0; i < tabletGroup.length; i++) {
    tabletParents[i].position.set(0, 0, 0);     
  }

  tablet1.forEach(tablet => tabletParents[0].add(tablet));
  tablet2.forEach(tablet => tabletParents[1].add(tablet));
  tablet3.forEach(tablet => tabletParents[2].add(tablet));
  tablet4.forEach(tablet => tabletParents[3].add(tablet));

  scene.add(tabletParents[0]);
  scene.add(tabletParents[1]);
  scene.add(tabletParents[2]);
  scene.add(tabletParents[3]);

  tabletGroup[0] = tablet1;
  tabletGroup[1] = tablet2;
  tabletGroup[2] = tablet3;
  tabletGroup[3] = tablet4;

  scene.add(gltf.scene);

  resetScene();
  reelSpinAnim();
  showAllReels(false);
  crystalGlowMats.forEach(mat => {
    crystalGlowAnim(mat);
  });
  floatAnims = [createTabletFloatAnimation(tabletParents[0],0), createTabletFloatAnimation(tabletParents[1],1), createTabletFloatAnimation(tabletParents[2],2), createTabletFloatAnimation(tabletParents[3],3)];
});
function crystalGlowAnim(mat: THREE.MeshStandardMaterial){
  var max = 3500;
  var min = 500;
  var onTime = Math.random() * (max - min) + min;
  var offTime = Math.random() * (max - min) + min;
  var onSpeed =Math.random() * (max - min) + min;
  var offSpeed = Math.random() * (max - min) + min;
    mat.transparent = true;
    console.log(mat);
    new JEASINGS.JEasing(mat).to({opacity: 0}, offSpeed).delay(onTime).onComplete(()=>{
      new JEASINGS.JEasing(mat).to({opacity: 1}, onSpeed).delay(offTime).onComplete(()=>{
        crystalGlowAnim(mat);
      }).start();
    }).start();
}
function reelSpinAnim(){
  for (let i = 0; i < 4; i++) {
    const reel = runeReels[i];
    const rotateBy = (i%2 == 0) ? Math.PI*2 : -Math.PI*2;
    new JEASINGS.JEasing(reel.rotation)
      .to({ x: reel.rotation.x + rotateBy, y: reel.rotation.y, z: reel.rotation.z },1500)
      .onComplete(()=>{
        if (i == 0){
          reelSpinAnim();
        }
      }).start();
    }
}
function showAllReels(show:boolean){
  runeReels.forEach(reel => reel.visible = show);
}
function showReels(index:number, show: boolean){
    runeReels[index].visible = show;
}
async function winAnim(){
  await delay(3000);
  new JEASINGS.JEasing(camera.position).to({x:0, y: 6,z:3.7},1000).easing(JEASINGS.Cubic.InOut).start();

  await delay(1000);

  cameraShake();
  new JEASINGS.JEasing(doorL.position).to({x: -.5}, 500).easing(Exponential.InOut).onComplete(()=>{
    cameraShake();
    new JEASINGS.JEasing(doorL.position).to({x: -5}, 3500).easing(JEASINGS.Cubic.In).onComplete(()=>{  cameraShake();}).start();
  }).start();
  await delay(250);
  cameraShake();
  new JEASINGS.JEasing(doorR.position).to({x: .5}, 700).easing(Exponential.InOut).onComplete(()=>{
    new JEASINGS.JEasing(doorR.position).to({x: 5}, 3500).delay(250).easing(JEASINGS.Cubic.In).onComplete(()=>{  cameraShake();}).start();
  }).start();
  await delay(3000);
  new JEASINGS.JEasing(camera.position).to({x:0, y: 6,z:-13.7},4000).easing(JEASINGS.Cubic.InOut).start();
  await delay(3500);
  fadeCamera(true);
  await delay(500);
  resetScene();
}
function fadeCamera(fade:boolean){
  new JEASINGS.JEasing(fadeMaterial).to({opacity: fade ? 1 : 0}, 500).start();
}
function startFloatAnim(){
  floatAnims[0].start();
  new JEASINGS.JEasing(tabletParents[1].position).to({x :0},250).onComplete(()=>{floatAnims[1].start()}).start();
  floatAnims[2].start();
  new JEASINGS.JEasing(tabletParents[3].position).to({x :0},250).onComplete(()=>{floatAnims[3].start()}).start();
}
function startChooseRuneAnim(index: number, runeIndex: number){
  new JEASINGS.JEasing(tabletParents[index].position).to({ x: 0, y: floatDistance / 2+floatDistance, z: floatDistance+floatDistance}, 500).onComplete(()=>{
  new JEASINGS.JEasing(tabletParents[index].position).to({ x: 0, y: 0, z: 0 }, 50).easing(JEASINGS.Circular.In).easing(JEASINGS.Quintic.Out).onComplete(()=>{
  showTablet(index, runeIndex);
  showReels(index, false);
  cameraShake();
  }).start();
  }).easing(JEASINGS.Cubic.In).start();  
}
const floatDistance =.2;
function createTabletFloatAnimation(tabletParent: THREE.Object3D<THREE.Object3DEventMap>, index:number) {
  const floatUp = new JEASINGS.JEasing(tabletParent.position)
    .to({ x: 0, y: floatDistance / 2, z: floatDistance }, 500)
    .easing(JEASINGS.Quadratic.InOut)
    .onComplete(() => {
      new JEASINGS.JEasing(tabletParent.position)
        .to({ x: 0, y: 0, z: 0 }, 500)
        .easing(JEASINGS.Quadratic.InOut)
        .start()
        .onComplete(() => {
          if (isSpinning)
            floatUp.start();
          else{
            new JEASINGS.JEasing(tabletParent.position)
            .delay(250*index)
            .to({ x: 0, y: floatDistance / 2, z: floatDistance }, 500*(index+1))
            .easing(JEASINGS.Quadratic.InOut).start();
          }          
        });
    });

  return floatUp;
}

function showTablet(groupIndex: number, tabletIndex: number) {
  if (groupIndex < 0 || groupIndex >= tabletGroup.length) return;
  tabletGroup[groupIndex].forEach((tablet, index) => {
   // console.log(`Tablet ${index} in group ${groupIndex} visibility set to ${index === tabletIndex}`);
    if (tablet) {
      if (index === tabletIndex) {
        tablet.visible = true;
      } else {
        tablet.visible = false;
      }
    } else {
      console.log(`Tablet ${index} in group ${groupIndex} is undefined`);
    }
  });
}
let isSpinning = false;
let spinCount = 0;
async function onSpinButtonClick() {
  clearTablets();
  isSpinning = true;
  var freeWin = spinCount>2;
  window.removeEventListener("click", onMouseClick, false);
  startFloatAnim();
  spinButtonPushAnimation(true);
  showAllReels(true);
  await delay(2250);
  isSpinning = false;
  await delay(1000);
  var random1 = freeWin?1 :Math.floor(Math.random() * 5)+1;
  var random2 = freeWin?1 :Math.floor(Math.random() * 5)+1;
  var random3 = freeWin?1 :Math.floor(Math.random() * 5)+1;
  var random4 = freeWin?1 :Math.floor(Math.random() * 5)+1;
  startChooseRuneAnim(0, random1);
  const max = 1000;
  const min = 750;
  await delay(Math.random() * (max - min) + min);
  startChooseRuneAnim(1, random2);
  await delay(Math.random() * (max - min) + min);
  startChooseRuneAnim(2, random3);
  await delay(Math.random() * (max - min) + min);
  startChooseRuneAnim(3, random4);
  var win = random1 == random2 && random2 == random3 && random3 == random4;
  if (win) {
    winAnim();
  }
  await delay(2000);
  spinButtonPushAnimation(false);

  if (freeWin){
    spinCount=0;
  }else{
    spinCount++;
  }
  if (!win){
    window.addEventListener("click", onMouseClick, false);
  }
}

function clearTablets(){
  for (let i = 0; i < tabletGroup.length; i++) {
    
    showTablet(i, 0);
  }
}
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function resetTablets(){
  for (let i = 0; i < tabletGroup.length; i++) {
    showTablet(i, 0);
  }
}
function resetScene(){
  window.addEventListener("click", onMouseClick, false);
  resetTablets();
  doorL.position.set(0, 0, 0);
  doorR.position.set(0, 0, 0);
  camera.position.set(0, 7, 21); //0, 2.7, 3.7
  fadeCamera(false);
  new JEASINGS.JEasing(camera.position).to({x:0, y: 2.7,z:3.7},2500).easing(JEASINGS.Cubic.InOut).onComplete(()=>{
    
  }).start();
}
function cameraShake(){
  const pos = camera.position;
  new JEASINGS.JEasing(camera.position).to({x:pos.x+0.1, y: pos.y+.05},50).easing(JEASINGS.Circular.InOut).onComplete(()=>{
    new JEASINGS.JEasing(camera.position).to({x:pos.x-0.1,y:pos.y-.05},50).easing(JEASINGS.Circular.InOut).onComplete(()=>{
      new JEASINGS.JEasing(camera.position).to({x:pos.x, y:pos.y},50).easing(JEASINGS.Circular.InOut).start();
    }).start();
  }).start();
}

function spinButtonPushAnimation(pushed: boolean) {
  const targetY = pushed? (spinButtonPosition.z - .1) :  (spinButtonPosition.z + .1);
  new JEASINGS.JEasing(spinButton.position)
      .to({ z:targetY }, 500) // Move along Y axis
      .onComplete(() => {
      })
      .start();
}
window.addEventListener("click", onMouseClick, false);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  console.log(mouse);
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(intersectObjects, true);

    if (intersects.length > 0) {
      onSpinButtonClick();
    }
  
}
const stats = new Stats();
function animate() {
  requestAnimationFrame(animate);
  composer.render();
  // controls.update()

  //renderer.render(scene, camera);
  JEASINGS.update();
  stats.update();
}

animate();
