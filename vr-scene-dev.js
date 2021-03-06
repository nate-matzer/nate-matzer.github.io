import * as THREE from './three.module.js';
import { AmmoPhysics } from './lib/ammo/AmmoPhysics.js';
import {VRButton} from './VRButton.js';
import { Lensflare, LensflareElement } from './Lensflare.js';


class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  pick(normalizedPosition, scene, camera, time) {
    // restore the color if there is a picked object
    if (this.pickedObject) {
      this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      this.pickedObject = undefined;
    }
 
    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
      // save its color
      this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // set its emissive color to flashing red/yellow
      this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
    }
  }
}
const textureLoader = new THREE.TextureLoader();
const textureFlare0 = textureLoader.load( 'textures/lensflare0.png' );
const textureFlare3 = textureLoader.load( 'textures/lensflare3.png' );

function addLight( h, s, l, x, y, z ) {

const pointLight = new THREE.PointLight( 0xffffff, 1.5, 2000 );
pointLight.color.setHSL( h, s, l );
pointLight.position.set( x, y, z );

const lensflare = new Lensflare();
lensflare.addElement( new LensflareElement( textureFlare0, 700, 0, pointLight.color ) );
lensflare.addElement( new LensflareElement( textureFlare3, 60, 0.6 ) );
lensflare.addElement( new LensflareElement( textureFlare3, 70, 0.7 ) );
lensflare.addElement( new LensflareElement( textureFlare3, 120, 0.9 ) );
lensflare.addElement( new LensflareElement( textureFlare3, 70, 1 ) );
pointLight.add( lensflare );
return pointLight;
}

async function main() {
    document.title = "Dim: " + location.hostname;
  const canvas = document.querySelector('#vr-scene-canvas');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));


  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 50;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 1.6, 0);

  const scene = new THREE.Scene();
//  const pickHelper = new PickHelper();


const physics = await AmmoPhysics();


const geoFloor = new THREE.BoxGeometry(5, 0.01, 5);
const matFloor = new THREE.MeshPhongMaterial({color:0x999999});
const floor = new THREE.Mesh(geoFloor, matFloor);
    floor.position.y = -0.005;
    scene.add(floor);
    physics.addMesh(floor);

  const geoCone = new THREE.ConeGeometry(0.1, 0.4, 32);
  const geoSphere = new THREE.SphereGeometry(0.03, 32, 16);
  const matController = new THREE.MeshBasicMaterial({color:0x555555});
  var controller;
  var i = 0;
  do {
    controller = renderer.xr.getController(i);
    if (controller) {

        scene.add(controller);
        const contGroup = new THREE.Group();
        controller.add(contGroup);
        const cone = new THREE.Mesh(geoCone, matController);
        cone.rotation.x = -Math.PI/2;
        contGroup.add(cone);
        const sphere = new THREE.Mesh(geoSphere, matController);
        sphere.position.z = -0.2;
        contGroup.add(sphere);
        //controllers.push()
        physics.addMesh(cone,1);
    }
    i++;
  } while (i < 2);

  const pointLight = addLight(0.55, 0.9, 0.5, 0, 10, 0);
  const sunRotationGroup = new THREE.Group();
  sunRotationGroup.add(pointLight);
  scene.add(sunRotationGroup);

  const color = 0xFFFFFF;
//    const intensity = 2;
//    const light = new THREE.PointLight(color, intensity);
//    light.position.x = camera.position.x;
//    light.position.y = camera.position.y;
//    light.position.z = camera.position.z;
//    scene.add(light);

  const boxWidth = 0.5;
  const boxHeight = 0.5;
  const boxDepth = 0.5;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;
    cube.position.y = 1;
    cube.position.z = 0;

    return cube;
  }

  const cubes = [
    physics.addMesh(makeInstance(geometry, 0x44aa88,  0),1),
    physics.addMesh(makeInstance(geometry, 0x8844aa, -1.5),1),
    physics.addMesh(makeInstance(geometry, 0xaa8844,  1.5),1),
  ];

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // cubes.forEach((cube, ndx) => {
    //   const speed = 1 + ndx * .1;
    //   const rot = time * speed;
    //   cube.rotation.x = rot;
    //   cube.rotation.y = rot;
    // });

//    light.position.x = camera.position.x;
//    light.position.y = camera.position.y;
//    light.position.z = camera.position.z;

    // 0, 0 is the center of the view in normalized coordinates.
    //pickHelper.pick({x: 0, y: 0}, scene, camera, time);
    sunRotationGroup.rotation.x += 0.001;

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(render);
}

main();
