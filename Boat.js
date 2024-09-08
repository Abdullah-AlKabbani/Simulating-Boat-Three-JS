//Boat.js
import './index.css'
import { Vector } from './Vector.js';
import { loader } from './main.js';
import * as dat from 'dat.gui';

const gui = new dat.GUI();
const boatFolder = gui.addFolder('Boat');

//this.boat.rotation.y += this.speed.rot
//this.boat.translateX(this.speed.vel)

export default class Boat {
  constructor() {

    // GUI Controls
    this.controls = {
      hightBoat: 1,
      roBoat: 'AL',
      volume_air: 10,
      volume_body: 5,
      v_max: 80,
      delta_time: 0.016,
      d: 2,
      s: 20,
      r: 1,
      n: 1,
      f0_average_theoritical: 80,
      f0: 'OFF'
    };

    boatFolder.add(this.controls, 'hightBoat', 1, 10);
    boatFolder.add(this.controls, 'roBoat', ['AL', 'FE', 'Fiber', 'Blastic']);
    boatFolder.add(this.controls, 'volume_air', 1, 100);
    boatFolder.add(this.controls, 'volume_body', 1, 100);
    boatFolder.add(this.controls, 'v_max', 50, 300);
    boatFolder.add(this.controls, 'delta_time', 0.1, 2.0);
    boatFolder.add(this.controls, 'd', 1, 100);
    boatFolder.add(this.controls, 's', 1, 1000);
    boatFolder.add(this.controls, 'r', 1, 10);
    boatFolder.add(this.controls, 'n', 1, 10);
    boatFolder.add(this.controls, 'f0_average_theoritical', 10, 500);
    boatFolder.add(this.controls, 'f0', ['ON', 'OFF']);
    
    //************************************************************************************************ 
    // load boat model
    loader.load("public/riva_aquarama_lamborghini_board.glb", (gltf) => {
      scene.add(gltf.scene)
      gltf.scene.scale.set(3, 3, 3)
      gltf.scene.position.set(20, -1, 50)
      gltf.scene.rotation.y = 1.5

      this.boat = gltf.scene
      this.speed = {
        vel: 0,
        rot: 0
      }

      //************************************************************************************************ 
      // constant values
      this.g = 9.81; // gravitational constant
      this.ro = 1020; // water density constant
      this.roAir = 1.2754; // Air density constant
      this.roAL = 2700; // Aleminum ro
      this.roFE = 7874; // Fe ro
      this.roFiber = 1500; // Fiber ro
      this.roBlastic = 1420; // Blastic ro
      this.cd = 0.5; // water resistance coefficient

      //************************************************************************************************
      // half constant values
      this.maxPositionLimit = 5000; // Limits of simulation space
      this.hightBoat = hightBoat; // hight of boat
      this.volume_air = volume_air; // air volume inside boat
      this.volume_body = volume_body; // metal volume boat
      this.v_max = v_max; // maximum speed
      this.delta_time = 0.016; // time change
      this.d = d; // distance between the rudder and the boat center
      this.s = s; // boat area
      this.r = r; // propeller diameter
      this.n = n; // number of propellers
      this.f0_average_theoritical = f0_average_theoritical; // average engine thrust force to calculate v_max

      //Engien ON or OF
      if(f0 === 'ON') this.f0 = f0_average_theoritical/2; // initial engine thrust force ON
      else this.f0 = 0; // initial engine thrust force OFF

      // boat body ro
      if(roBoat === 'AL') this.roBoat = this.roAL; // boat body is AL
      else if(roBoat === 'FE') this.roBoat = this.roFE; // boat body is FE
      else if(roBoat === 'Fiber') this.roBoat = this.roFiber; // boat body is Fiber
      else if(roBoat === 'Blastic') this.roBoat = this.roBlastic; // boat body is Blastic

      //************************************************************************************************ 
      // variables
      this.maxMassTofloat = 0; // max mass to folat
      this.m = 0; // boat mass
      this.theta = 0; // angle between ox and boat direction
      this.volume = this.volume_air + this.volume_body; // body volume
      this.volumeB = this.volume; // submerged body volume
      this.volumeBe = this.volume; // submerged body volume theoritical
      this.w = new Vector(0,0,0); // weight vector
      this.fb = new Vector(); // buoyant force vector
      this.fe = new Vector(); // engine thrust force vector
      this.fw = new Vector(); // water resistance force vector
      this.f = new Vector(); // resultant forces
      this.v = new Vector(); // velocity vector
      this.a = new Vector(); // acceleration vector
      this.position = new Vector(); // position vector
      this.torqueE = 0; // engine torque
      this.torqueR = 0; // rudder torque
      this.totalTorque = 0; // resultant torques
    })
  }


  stop() {
    this.speed.vel = 0
    this.speed.rot = 0
  }

  update() {
    if (this.boat) {
      this.boat.rotation.y += this.speed.rot
      this.boat.translateX(this.speed.vel)
    }
  }
}

export { loader };
