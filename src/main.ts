import "./style.css";
import * as THREE from "three";
//import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import Stats from "three/addons/libs/stats.module.js";
import JEASINGS from 'jeasings';
//import { cameraPosition } from "three/webgpu";
// import hdr from './img/venice_sunset_1k.hdr'
// import image from './img/grid.png'
// import model from './models/suzanne_no_material.glb'

const scene = new THREE.Scene();

const hdr =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/equirectangular/venice_sunset_1k.hdr";
const image =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/uv_grid_opengl.jpg";
// const model = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Xbot.glb'

//const hdr = 'img/venice_sunset_1k.hdr'
//const image = 'img/grid.png'
const model = "models/crystalslotmachine.glb";

new RGBELoader().load(hdr, (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
});

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2.7, 3.7); //
camera.setRotationFromEuler(new THREE.Euler(-0.15, 0, 0));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//const controls = new OrbitControls(camera, renderer.domElement);
//controls.enableDamping = true;

const material = new THREE.MeshStandardMaterial();
material.map = new THREE.TextureLoader().load(image);
//material.map.colorSpace = THREE.SRGBColorSpace

// const plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), material)
// plane.rotation.x = -Math.PI / 2
// plane.position.y = 0
// scene.add(plane)
let tablet1 = [] as THREE.Object3D[];
let tablet2 = [] as THREE.Object3D[];
let tablet3 = [] as THREE.Object3D[];
let tablet4 = [] as THREE.Object3D[];
let tabletGroup = [tablet1, tablet2, tablet3, tablet4];
let tabletParents = [new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D()];
let floatAnims = [] as JEASINGS.JEasing[];
new GLTFLoader().load(model, (gltf) => {
  const tablet1Names = ['Tab1-0', 'Tab1-7', 'Tab1-L', 'Tab1-P', 'Tab1-Q', 'Tab1-R'];
  const tablet2Names = ['Tab2-0', 'Tab2-7', 'Tab2-L', 'Tab2-P', 'Tab2-Q', 'Tab2-R'];
  const tablet3Names = ['Tab3-0', 'Tab3-7', 'Tab3-L', 'Tab3-P', 'Tab3-Q', 'Tab3-R'];
  const tablet4Names = ['Tab4-0', 'Tab4-7', 'Tab4-L', 'Tab4-P', 'Tab4-Q', 'Tab4-R'];

  tablet1 = tablet1Names.map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  tablet2 = tablet2Names.map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  tablet3 = tablet3Names.map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  tablet4 = tablet4Names.map(name => gltf.scene.getObjectByName(name) as THREE.Object3D);
  // Create parent Object3D for each group of tablets
  
  for (let i = 0; i < tabletGroup.length; i++) {
    tabletParents[i].position.set(0, 0, 0); // Set initial position of each    
  }
  // Add tablets to their respective parent
  tablet1.forEach(tablet => tabletParents[0].add(tablet));
  tablet2.forEach(tablet => tabletParents[1].add(tablet));
  tablet3.forEach(tablet => tabletParents[2].add(tablet));
  tablet4.forEach(tablet => tabletParents[3].add(tablet));

  // Add parent objects to the scene
  scene.add(tabletParents[0]);
  scene.add(tabletParents[1]);
  scene.add(tabletParents[2]);
  scene.add(tabletParents[3]);
  console.log('tablet1:', tablet1);
  console.log('tablet2:', tablet2);
  console.log('tablet3:', tablet3);
  console.log('tablet4:', tablet4);

  // Update tabletGroup with the populated arrays
  tabletGroup[0] = tablet1;
  tabletGroup[1] = tablet2;
  tabletGroup[2] = tablet3;
  tabletGroup[3] = tablet4;

  scene.add(gltf.scene);

  // Call showTablet after models are loaded
  resetTablets();
  floatAnims = [createTabletFloatAnimation(tabletParents[0],0), createTabletFloatAnimation(tabletParents[1],1), createTabletFloatAnimation(tabletParents[2],2), createTabletFloatAnimation(tabletParents[3],3)];
});
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
  cameraShake();
  }).start();
  }).easing(JEASINGS.Cubic.In).start();  
}
const floatDistance =.2;
function createTabletFloatAnimation(tabletParent: THREE.Object3D<THREE.Object3DEventMap>, index:number) {
  // Create the initial float animation
  const floatUp = new JEASINGS.JEasing(tabletParent.position)
    .to({ x: 0, y: floatDistance / 2, z: floatDistance }, 500)
    .easing(JEASINGS.Quadratic.InOut)
    .onComplete(() => {
      // Create the float down animation once the float up completes
      new JEASINGS.JEasing(tabletParent.position)
        .to({ x: 0, y: 0, z: 0 }, 500)
        .easing(JEASINGS.Quadratic.InOut)
        .start()
        .onComplete(() => {
          if (isSpinning)
            floatUp.start();
          else{
            console.log('stop');
            new JEASINGS.JEasing(tabletParent.position)
            .delay(250*index)
            .to({ x: 0, y: floatDistance / 2, z: floatDistance }, 500*(index+1))
            .easing(JEASINGS.Quadratic.InOut).start();
          }
          
             // Restart the float up animation to loop
        });
    });

  return floatUp;
}


  

function showTablet(groupIndex: number, tabletIndex: number) {
  // Ensure groupIndex is within range
  if (groupIndex < 0 || groupIndex >= tabletGroup.length) return;

  // Iterate through the tablets in the selected group
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
async function onSpinButtonClick() {
  clearTablets();
  //punchFOV();
  isSpinning = true;
  window.removeEventListener("click", onMouseClick, false);
  startFloatAnim();
  await delay(2250);
  isSpinning = false;
  await delay(1000);
  startChooseRuneAnim(0, Math.floor(Math.random() * 5)+1);
  const max = 1000;
  const min = 750;
  await delay(Math.random()*(max-min)+min);
  startChooseRuneAnim(1, Math.floor(Math.random() * 5)+1);
  await delay(Math.random()*(max-min)+min);
    startChooseRuneAnim(2, Math.floor(Math.random() * 5)+1);
    await delay(Math.random()*(max-min)+min);
      startChooseRuneAnim(3, Math.floor(Math.random() * 5)+1);
  await delay(2000);
  window.addEventListener("click", onMouseClick, false);
}
// function punchFOV(){

//   new JEASINGS.JEasing(camera).to({fov: 90}, 3250).easing(JEASINGS.Quartic.Out).onUpdate(() => {
//     camera.updateProjectionMatrix();
//   }).onComplete(()=>{
//     new JEASINGS.JEasing(camera).to({fov: 75}, 100).easing(JEASINGS.Quartic.In).onUpdate(() => {
//       camera.updateProjectionMatrix()}).start();
//   }).start();
// }
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
function cameraShake(){
  const pos = camera.position;
  new JEASINGS.JEasing(camera.position).to({x:pos.x+0.1, y: pos.y+.05},50).easing(JEASINGS.Circular.InOut).onComplete(()=>{
    new JEASINGS.JEasing(camera.position).to({x:pos.x-0.1,y:pos.y-.05},50).easing(JEASINGS.Circular.InOut).onComplete(()=>{
      new JEASINGS.JEasing(camera.position).to({x:pos.x, y:pos.y},50).easing(JEASINGS.Circular.InOut).start();
    }).start();
  }).start();
}
// Add event listener for mouse clicks
window.addEventListener("click", onMouseClick, false);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event: MouseEvent) {
  // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the raycaster
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object.name === "SpinButton") {
      onSpinButtonClick();
      break;
    }
  }
}
const stats = new Stats();
function animate() {
  requestAnimationFrame(animate);

  // controls.update()

  renderer.render(scene, camera);
  JEASINGS.update();
  stats.update();
}

animate();
