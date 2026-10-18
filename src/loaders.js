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

  loader.load('/3d_room.glb', (gltf) => {
    const model = gltf.scene;

    model.position.set(0, -9, 0);
    model.scale.set(1, 1, 1);
    scene.add(model);
    model.updateMatrixWorld(true);

    model.traverse((child) => {
      if (child.isMesh) {
        const isPainting = child.name.startsWith('p1') || 
                           child.name.startsWith('p2') || 
                           child.name.startsWith('p3') || 
                           child.name.startsWith('p4');

        if (isPainting) {
          // Paintings should never be occluded by shadows from ceiling or frames
          child.castShadow = false;
          child.receiveShadow = false;
        } else {
          child.castShadow = true;
          child.receiveShadow = true;
        }

        if (child.geometry) {
          child.geometry.computeVertexNormals();
        }

        if (child.material) {
          child.material.side = THREE.DoubleSide;
          child.material.shadowSide = THREE.DoubleSide;

          if (isPainting) {
            child.material = child.material.clone();
            child.material.roughness = 0.3;
            child.material.metalness = 0.0;
            // Soft self-illumination so the artwork pops vibrantly in gallery lighting
            if (child.material.map) {
              child.material.emissiveMap = child.material.map;
              child.material.emissive = new THREE.Color(0xffffff);
              child.material.emissiveIntensity = 0.22;
            }
          } else if (child.material.roughness !== undefined && child.material.roughness > 0.8) {
            child.material.roughness = 0.65;
          }

          child.material.needsUpdate = true;
        }
      }
    });

    const nameMesh = model.getObjectByName('name');
    if (nameMesh) {
      nameMesh.material = nameMesh.material.clone();
      nameMesh.material.emissive = new THREE.Color(0x8ecfff);
      nameMesh.material.emissiveIntensity = 0.7;
    }

    const doorMesh = model.getObjectByName('door');
    let doorPivot = null;

    if (doorMesh) {
      doorMesh.geometry.computeBoundingBox();
      const box = doorMesh.geometry.boundingBox.clone();
      box.applyMatrix4(doorMesh.matrixWorld);

      const size = box.getSize(new THREE.Vector3());

      doorPivot = new THREE.Group();
      doorPivot.position.set(
        box.min.x + size.x / 2,
        box.min.y,
        box.min.z
      );
      scene.add(doorPivot);
      doorPivot.attach(doorMesh);
    }

    const laptopMesh = model.getObjectByName('laptop') || model.getObjectByName('laptop.001') || model.getObjectByName('table');
    const galleryMesh = model.getObjectByName('p1') || model.getObjectByName('p3') || model.getObjectByName('p2.001');
    const phoneMesh = model.getObjectByName('telephone');

    if (onLoaded) {
      onLoaded({
        model,
        nameMesh,
        doorMesh,
        doorPivot,
        laptopMesh,
        galleryMesh,
        phoneMesh
      });
    }
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

