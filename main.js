//import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/three.module";
//import { boatLoder } from './Boat.js';
//import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import './index.css'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import * as THREE from 'three';
import * as dat from 'dat.gui';
//import { Boat } from './Boat.js';
import { Vector } from './Vector.js';
import { Physics } from './Physics.js';

// كود الرسم
let camera, scene, renderer;
let controls1, water, sun;

const loader = new GLTFLoader();

function random(min, max) {
  return Math.random() * (max - min) + min;
}

const gui = new dat.GUI();
const boatFolder = gui.addFolder('Boat');

class Boat {
  constructor() {
    // Dat GUI Controls
    this.controlsDat = {
      hightBoat: 1,
      widthBoat: 1,
      roBoat: 'Blastic',
      volume_air: 1,
      volume_body: 0.5,
      v_max: 80,
      d: 2,
      s: 3.5,
      r: 1,
      n: 1,
      f0_average_theoritical: 500,
      boat_angle: 0,
      engine: 'OFF'
    };

    // GUI Controls Setup
    boatFolder.add(this.controlsDat, 'hightBoat', 0.1, 10);
    boatFolder.add(this.controlsDat, 'widthBoat', 0.1, 10);
    boatFolder.add(this.controlsDat, 'roBoat', ['AL', 'FE', 'Fiber', 'Blastic']).onChange((value) => {
      this.volumeB = this.volume;
      this.a = new Vector(0, 0, 0);
      this.v = new Vector(0, 0, 0);
      console.log('Values reset: a = 0, v = 0');
    });
    boatFolder.add(this.controlsDat, 'volume_air', 0.1, 10);
    boatFolder.add(this.controlsDat, 'volume_body', 0.1, 10);
    boatFolder.add(this.controlsDat, 'v_max', 50, 300);
    boatFolder.add(this.controlsDat, 'd', 1, 100);
    boatFolder.add(this.controlsDat, 's', 1, 1000);
    boatFolder.add(this.controlsDat, 'r', 1, 10);
    boatFolder.add(this.controlsDat, 'n', 1, 10);
    boatFolder.add(this.controlsDat, 'f0_average_theoritical', 10, 1000);
    boatFolder.add(this.controlsDat, 'boat_angle', -179, 180);
    boatFolder.add(this.controlsDat, 'engine', ['ON', 'OFF']);

    // Load boat model
    loader.load("/riva_aquarama_lamborghini_board.glb", (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(3, 3, 3);
      gltf.scene.position.set(20, -1, 50);
      gltf.scene.rotation.y = THREE.MathUtils.degToRad(87.5);

      this.boat = gltf.scene;
      this.rot = 0;

      // Constants
      this.g = 9.81; // gravitational constant
      this.roWater = 1020; // water density constant
      this.roAir = 1.2754; // Air density constant
      this.roAL = 2700; // Aleminum ro
      this.roFE = 7874; // Fe ro
      this.roFiber = 1500; // Fiber ro
      this.roBlastic = 1420; // Blastic ro
      this.cd = 0.5; // water resistance coefficient
      this.water_viscosity = 12 //Water viscosity constant

      // Half constants
      this.maxPositionLimit = 10000; // Limits of simulation space
      this.hightBoat = this.controlsDat.hightBoat; // hight of boat
      this.width = this.controlsDat.widthBoat; // boat width
      this.theta = this.controlsDat.boat_angle; // angle between ox and boat direction
      this.volume_air = this.controlsDat.volume_air; // air volume inside boat
      this.volume_body = this.controlsDat.volume_body; // metal volume boat
      this.v_max = this.controlsDat.v_max + (this.controlsDat.f0_average_theoritical * 0.01) + 1; // maximum engine speed
      this.delta_time = 0.016; // time change
      this.d = this.controlsDat.d; // distance between the rudder and the boat center
      this.s = this.controlsDat.s; // boat area
      this.r = this.controlsDat.r; // propeller diameter
      this.n = this.controlsDat.n; // number of propellers
      this.f0_average_theoritical = this.controlsDat.f0_average_theoritical; // average engine thrust force to calculate v_max

      // Engine ON or OFF
      if (this.controlsDat.engine === 'ON') this.f0 = this.controlsDat.f0_average_theoritical / 2; // initial engine thrust force ON
      else this.f0 = 0; // initial engine thrust force OFF

      // Boat body ro
      if (this.controlsDat.roBoat === 'AL') this.roBoat = this.roAL; // boat body is AL
      else if (this.controlsDat.roBoat === 'FE') this.roBoat = this.roFE; // boat body is FE
      else if (this.controlsDat.roBoat === 'Fiber') this.roBoat = this.roFiber; // boat body is Fiber
      else if (this.controlsDat.roBoat === 'Blastic') this.roBoat = this.roBlastic; // boat body is Blastic

      // Variables
      this.maxMassTofloat = 0; // max mass to float
      this.v_max_drowning = 0; // Maximum drowning speed
      this.m = 0; // boat mass
      this.volume = this.volume_air + this.volume_body; // body volume
      this.volumeB = this.volume; // submerged body volume
      this.volumeBe = this.volume; // submerged body volume theoretical
      this.w = new Vector(); // weight vector
      this.fb = new Vector(); // buoyant force vector
      this.fe = new Vector(); // engine thrust force vector
      this.fw = new Vector(); // water resistance force vector
      this.f = new Vector(); // resultant forces
      this.v = new Vector(); // velocity vector
      this.a = new Vector(); // acceleration vector
      this.position = new Vector(20, -1, 50); // position vector
      this.torqueE = 0; // engine torque
      this.torqueR = 0; // rudder torque
      this.totalTorque = 0; // resultant torques
    });

    //change theta
    // Add key press event listeners change theta
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        this.controlsDat.boat_angle += 1; // Decrease angle by 2 degrees
        if (this.controlsDat.boat_angle < -180) this.controlsDat.boat_angle = -180; // Clamp value
        this.v.x = this.v.x * 0.95;
        this.v.z = this.v.z * 0.95;
        //this.boat.rotateX(0.1);
      } else if (event.key === 'ArrowRight') {
        this.controlsDat.boat_angle -= 1; // Increase angle by 2 degrees
        if (this.controlsDat.boat_angle > 180) this.controlsDat.boat_angle = 180; // Clamp value
        this.v.x = this.v.x * 0.95;
        this.v.z = this.v.z * 0.95;
        //this.boat.rotateX(0.1);
      }
    });
  }

  stop() {
    this.rot = 0;
    // this.theta = this.theta;
  }

  update() {
    if (this.boat) {

      Physics(boat);
      this.boat.position.set(boat.position.x, boat.position.y, boat.position.z);
      camera.position.set(this.boat.position.x, this.boat.position.y + 20, this.boat.position.z + 50);
      console.log("theta = " + this.theta);

      const v_length = this.v.calculateLength2D();

      // حركة التشبيب رفع مقدمة القارب
      if (v_length >= (0.5 * this.v_max) && this.boat.rotation.z < 0.2) {
        this.boat.rotation.z += 0.01; // Increment rotation
        if (this.boat.rotation.z > 0.2) this.boat.rotation.z = 0.2; // Clamp value
      }

      if (v_length < (0.5 * this.v_max)) {
        this.boat.rotation.z -= 0.01; // Decrement rotation
        if (this.boat.rotation.z < 0) this.boat.rotation.z = 0; // Clamp value
      }

      // حركة الغرق
      if (this.volumeBe >= this.volume && this.boat.rotation.z <= 0.6) {
        this.boat.rotation.z += 0.025; // Increment rotation
        if (this.boat.rotation.z > 0.6) this.boat.rotation.z = 0.6; // Clamp value
        console.log("rot = " + this.boat.rotation.z);
      }

      if (this.boat.rotation.z > 0 && this.position.y >= (-(this.hightBoat / 2) && this.volumeBe < boat.volume)) {
        this.boat.rotation.z -= 0.025; // Decrement rotation
        if (this.boat.rotation.z < 0) this.boat.rotation.z = 0; // Clamp value
        console.log("rot = " + this.boat.rotation.z);
      }


      // Apply the rotation based on theta
      this.boat.rotation.y = THREE.MathUtils.degToRad(this.controlsDat.boat_angle + 87.5);

      // Match camera rotation to boat rotation
      //camera.rotation.y = boat.rotation.y;

      // Update dat
      this.hightBoat = this.controlsDat.hightBoat; // height of boat
      this.width = this.controlsDat.widthBoat; // boat width
      this.theta = this.controlsDat.boat_angle; // angle between ox and boat direction
      this.theta = -this.theta;
      this.volume_air = this.controlsDat.volume_air; // air volume inside boat
      this.volume_body = this.controlsDat.volume_body; // metal volume boat
      this.v_max = this.controlsDat.v_max + (this.controlsDat.f0_average_theoritical * 0.1) + 1; // maximum engine speed
      this.d = this.controlsDat.d; // distance between the rudder and the boat center
      this.s = this.controlsDat.s; // boat area
      this.r = this.controlsDat.r; // propeller diameter
      this.n = this.controlsDat.n; // number of propellers
      this.f0_average_theoritical = this.controlsDat.f0_average_theoritical; // average engine thrust force to calculate v_max

      // Engine ON or OFF
      if (this.controlsDat.engine === 'ON' && this.f0 === 0) {
        this.f0 = this.f0_average_theoritical;
      } // initial engine thrust force ON
      if (this.controlsDat.engine === 'OFF') {
        this.f0 = 0;
      } // initial engine thrust force OFF

      // Boat body ro
      if (this.controlsDat.roBoat === 'AL') {
        this.roBoat = this.roAL;
      }
      else if (this.controlsDat.roBoat === 'FE') {
        this.roBoat = this.roFE;
      }
      else if (this.controlsDat.roBoat === 'Fiber') {
        this.roBoat = this.roFiber;
      }
      else if (this.controlsDat.roBoat === 'Blastic') {
        this.roBoat = this.roBlastic;
      }
      console.log("***********************************************************");
    }
  }
}

var boat = new Boat()

class Trash {
  constructor(_scene) {
    scene.add(_scene)
    _scene.scale.set(10, 10, 10)
    if (Math.random() > 1) {
      _scene.position.set(random(-100, 100), 0, random(-100, 100))
    } else {
      _scene.position.set(random(-500, 500), 0, random(-1000, 1000))
    }

    this.trash = _scene
  }
}

async function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      resolve(gltf.scene)
    })
  })
}

let boatModel = null
async function createTrash() {
  if (!boatModel) {
    boatModel = await loadModel("/simple_mountain.glb")
  }
  return new Trash(boatModel.clone())
}

let trashes = []
const TRASH_COUNT = 20

init();
animate();

async function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(0, 30, 100);

  sun = new THREE.Vector3();

  // Water
  const waterGeometry = new THREE.PlaneGeometry(20000, 20000);

  const waterNormals = new THREE.TextureLoader().load('/waternormals.jpg', function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  });

  water = new Water(
    waterGeometry,
    {
      side: THREE.DoubleSide,
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('/waternormals.jpg', function (texture) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 10,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = -Math.PI / 2;

  scene.add(water);

  // Skybox
  const sky = new Sky();
  sky.scale.setScalar(20000);
  sky.position.set(0, 8000, 0);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;

  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  function updateSun() {

    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;
  }

  updateSun();

  controls1 = new OrbitControls(camera, renderer.domElement);
  controls1.maxPolarAngle = Math.PI * 0.495;
  controls1.target.set(0, 10, 0);
  controls1.minDistance = 40.0;
  controls1.maxDistance = 200.0;
  controls1.update();

  const waterUniforms = water.material.uniforms;

  for (let i = 0; i < TRASH_COUNT; i++) {
    const trash = await createTrash()
    trashes.push(trash)
  }

  window.addEventListener('resize', onWindowResize);
  //document.addEventListener('keyup', onKeyUp);

  window.addEventListener('keydown', function (e) {

  })
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// الصدم مع الجبال العائمة يؤدي لإختفائها
function isColliding(obj1, obj2) {
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 100 &&
    Math.abs(obj1.position.z - obj2.position.z) < 100
  )
}

function checkCollisions() {
  if (boat.boat) {
    trashes.forEach(trash => {
      console.log("trash mountain")
      if (trash.trash) {
        if (isColliding(boat.boat, trash.trash)) {
          scene.remove(trash.trash)
        }
      }
    })
  }
}

function animate() {

  requestAnimationFrame(animate);
  render();
  boat.update()

  //camera movment
  camera.position.x = boat.position.x;
  camera.position.y = boat.position.y;
  camera.position.z = boat.position.z;
  camera.rotation.y = boat.boat.rotation.y - 1.5271630954950384;
  camera.translateY(20);
  camera.translateZ(60);

  checkCollisions()
}

function render() {
  water.material.uniforms['time'].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}

export { loader };