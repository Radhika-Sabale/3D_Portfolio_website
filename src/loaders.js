import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export function loadHDRI(scene) {
  new RGBELoader().load('/hdri.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  });
}

export function loadRoom(scene, onLoaded) {
  const loader = new GLTFLoader();

  loader.load('/room.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    model.position.set(0, -9, 0);
    model.scale.set(1, 1, 1);
    scene.add(model);

    const nameMesh = model.getObjectByName('name');
    if (nameMesh) {
      // Give the name a soft glowing material
      nameMesh.material = nameMesh.material.clone(); // clone so we don't affect other objects sharing this material
      nameMesh.material.emissive = new THREE.Color(0x8ecfff); // soft blue glow — change to any hex you like
      nameMesh.material.emissiveIntensity = 0.6;
    }
    const doorMesh = model.getObjectByName('door'); // the actual mesh, not the group

    let doorPivot = null;

if (doorMesh) {
  doorMesh.geometry.computeBoundingBox();
  const box = doorMesh.geometry.boundingBox.clone();
  box.applyMatrix4(doorMesh.matrixWorld);

  const size = box.getSize(new THREE.Vector3());

  console.log('door box.min:', box.min.x, box.min.y, box.min.z);
  console.log('door box.max:', box.max.x, box.max.y, box.max.z);
  console.log('door size:', size.x, size.y, size.z);

  doorPivot = new THREE.Group();
  doorPivot.position.set(
    box.min.x + size.x / 2,  // center on the thin thickness axis
    box.min.y,                // bottom of the door
    box.min.z                 // hinge edge — now on the correct WIDE axis
  );
  scene.add(doorPivot);
  doorPivot.attach(doorMesh);
}

    // model.traverse((child) => {
    //   if (child.isMesh) console.log(child.name);
    // });

    model.traverse((child) => {
  console.log(child.name, '| type:', child.type, '| isMesh:', child.isMesh);
});

    if (onLoaded) onLoaded(model, nameMesh, doorMesh, doorPivot);
  });
}

export function addGround(scene, groundY) {
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load('/grass.jpg');
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(40, 40);

  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({ map: grassTexture });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY;
  ground.receiveShadow = true;
  scene.add(ground);

  return ground;
}

export function addSky(scene) {
  const sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  const sun = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(90 - 10);
  const theta = THREE.MathUtils.degToRad(180);
  sun.setFromSphericalCoords(1, phi, theta);

  sky.material.uniforms['sunPosition'].value.copy(sun);
  sky.material.uniforms['turbidity'].value = 3;
  sky.material.uniforms['rayleigh'].value = 1;

  return sky;
}

