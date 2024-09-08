// Physics.js
import * as THREE from 'three';
import { Vector } from './Vector.js';

function Physics(boat) {
    calculateMass(boat);
    calculateWeight(boat);
    calculateMmaxToFloat(boat);
    calculateVolumeBe(boat);
    calculateVolumeB(boat);
    calculateBuoyantForce(boat);
    calculateVmax(boat);
    calculateVmaxDrowning(boat);
    console.log("f0 = " + boat.f0);
    calculateEngeinForce(boat);
    calculateWaterForce(boat);
    calculateTotalForce(boat);
    calculateTorqueEngine(boat);
    calculateTorqueRudder(boat);
    calculateTotalTorque(boat);
    calculateAccelrate(boat);
    calculateSpeed(boat);
    calculatePosition(boat);
}

function calculateMass(boat) {
    boat.m = (boat.roAir * boat.volume_air) + (boat.roBoat * boat.volume_body);
    console.log("Mass = " + parseFloat(boat.m.toFixed(2)) + "\n");
}

function calculateMmaxToFloat(boat) {
    boat.maxMassTofloat = boat.roWater * boat.volume;
    console.log("Mmax To Float = " + parseFloat(boat.maxMassTofloat.toFixed(2)) + "\n");
}

function calculateWeight(boat) {
    boat.w.y = -boat.m * boat.g;
    boat.w.printVector("Weight = ");
}

function calculateVolumeBe(boat) {
    const w_length = boat.w.calculateLength();
    const fb_length = boat.fb.calculateLength();

    if (w_length <= fb_length || Math.abs(w_length - fb_length) < 0.1) {
        boat.volumeBe = boat.m / boat.roWater;
        console.log("volumeBe = " + parseFloat(boat.volumeBe).toFixed(2) + " <The boat float> " + "\n");
    }

    else {
        boat.volumeBe = boat.m / boat.roWater;
        if(boat.volumeBe>boat.volume) boat.volumeBe = boat.volume;
        console.log("volumeBe = " + parseFloat(boat.volumeBe).toFixed(2) + " <The boat is sinking> " + "\n");
    }
}

function calculateVolumeB(boat) {
    if (boat.position.y >= (boat.hightBoat / 2) || boat.position.y === ((boat.hightBoat/2) - ((boat.volumeBe/boat.volume) * boat.hightBoat))) {
        boat.volumeB = boat.volumeBe;
        boat.v.y = 0;
        boat.position.y = ((boat.hightBoat/2) - ((boat.volumeBe/boat.volume) * boat.hightBoat));
        console.log("volumeB = " + parseFloat(boat.volumeB).toFixed(2) + " <Float>");
    } else if ((Math.abs(boat.position.y) < (boat.hightBoat / 2))) {
        boat.volumeB = boat.volume * (((boat.hightBoat / 2) - boat.position.y)/boat.hightBoat);
        console.log("volumeB = " + parseFloat(boat.volumeB).toFixed(2) +" <The boat is partially submerged.> ");
        if(Math.abs(boat.volumeB - boat.volumeBe) < 0.01){
            boat.volumeB = boat.volumeBe;
        }
    } else if((Math.abs(boat.position.y) > (boat.hightBoat / 2)) && boat.position.y <= 0 && boat.volumeBe === boat.volume){
        boat.volumeB = boat.volume;
        console.log("volumeB = " + parseFloat(boat.volumeB).toFixed(2) +" <The boat is completely submerged.> ");
    } else {
        console.log("volumeB = " + parseFloat(boat.volumeB).toFixed(2) +" <Under sea> ");
    }
}

function calculateBuoyantForce(boat) {
    boat.fb.y = boat.roWater * boat.g * boat.volumeB;
    boat.fb.printVector("FB = ");
}

function calculateEngeinForce(boat) {
    const v_length_engine = boat.v.calculateLength2D();

    // Check if the engine is on
    if (boat.f0 !== 0) {
        // Maintain engine force at maximum speed
        if (v_length_engine >= boat.v_max) {
            boat.f0 = boat.f0; // Remains constant
        }
        // Increase engine force when below maximum speed
        else if (v_length_engine < (boat.v_max * 0.87)) {
            boat.f0 += 2;
        }
        // Decrease engine force slightly as it approaches maximum speed
        else if(v_length_engine >= (boat.v_max * 0.87) && v_length_engine < boat.v_max) {
            boat.f0 -= 3;
        }

        // Convert theta to radians
        const thetaRad = THREE.MathUtils.degToRad(boat.theta);

        // Calculate the engine force components
        boat.fe.x = (boat.r + boat.n) * boat.f0 * Math.sin(thetaRad);
        boat.fe.z = (boat.r + boat.n) * boat.f0 * Math.cos(thetaRad);
    }
    // Engine is off, so force is zero
    else {
        boat.fe.x = 0;
        boat.fe.y = 0;
        boat.fe.z = 0;
    }

    // Stop engine force if the boat is submerged
    if (boat.position.y < -(boat.hightBoat / 2)) {
        boat.fe.x = 0;
        boat.fe.y = 0;
        boat.fe.z = 0;
    }

    // Optionally scale the forces
    boat.fe.x *= 15;
    boat.fe.z *= -15;

    boat.fe.printVector("FE = ");
}

function calculateWaterForce(boat) {
    // Calculate the reverse angle (opposite direction of travel)
    const thetaRad = THREE.MathUtils.degToRad(boat.theta);
    const reverseThetaRad = thetaRad + Math.PI; // Opposite direction in radians

    // Calculate water resistance force components
    const vSquaredX = boat.v.x * boat.v.x;
    const vSquaredZ = boat.v.z * boat.v.z;
    const resistanceX = 0.5 * boat.roWater * vSquaredX * boat.s * boat.cd;
    const resistanceZ = 0.5 * boat.roWater * vSquaredZ * boat.s * boat.cd;

    // Apply the calculated resistance forces
    boat.fw.x = resistanceX * Math.sin(reverseThetaRad);
    boat.fw.z = resistanceZ * Math.cos(reverseThetaRad);

    // Optionally scale the forces
    boat.fw.x /= 2000;
    boat.fw.z /= -2000;

    // If the engine is off, increase water resistance
    if (boat.f0 === 0) {
        boat.fw.x *= 10;
        boat.fw.z *= 10;
    }

    boat.fw.printVector("FW = ");
}

function calculateTotalForce(boat) {
    boat.f.y = boat.w.y + boat.fb.y + boat.fe.y + boat.fw.y;
    boat.f.x = boat.w.x + boat.fb.x + boat.fe.x + boat.fw.x;
    boat.f.z = boat.w.z + boat.fb.z + boat.fe.z + boat.fw.z;

    boat.f.printVector("F Total = ");
}

function calculateTorqueEngine(boat) {
    const fe_length = boat.fe.calculateLength();
    boat.torqueE = fe_length * boat.r * Math.sin(boat.theta); // من قانون حساب العزم نضرب ب ساين الزاوية الناتجة عن هذا العزم

    console.log("TorqueEngine = " + boat.torqueE + "\n");
}

function calculateTorqueRudder(boat) {
    const fe_length = boat.fe.calculateLength();
    boat.torqueR = fe_length * boat.d * Math.sin(boat.theta);
    console.log("TorqueRudder = " + boat.torqueR + "\n");
}

function calculateTotalTorque(boat) {
    boat.totalTorque = boat.torqueE + boat.torqueR;
    console.log("TotalTorque = " + boat.totalTorque + "\n");
}

function calculateVmax(boat) {
    console.log("Vmax = " + boat.v_max + "\n");
}

function calculateVmaxDrowning(boat) {
    boat.v_max_drowning = ((boat.m * boat.g) - (boat.roWater * boat.volume * boat.g))/(6 * Math.PI * boat.water_viscosity * boat.width);
    console.log("v_max_drowning = " + parseFloat(boat.v_max_drowning).toFixed(2));
}

function calculateAccelrate(boat) {
    const v_length_engine = boat.v.calculateLength2D();
    const f_total_length = boat.f.calculateLength2D();

    // الحركة على سطح الماء
    if(f_total_length <= 0) {
        boat.a.x = 0;
        boat.a.z = 0; 
    } else {
        // اذا السرعة قصوى الحركة مستقيمة منتظمة التسارع معدوم
        if(v_length_engine >= boat.v_max && boat.f0 !== 0){
            boat.a.x = 0;
            boat.a.z = 0;
        } else {
            boat.a.x = boat.f.x / boat.m;
            boat.a.z = boat.f.z / boat.m;
        }
    }

    // حركة الطفو والغرق
    if(Math.abs(boat.f.y) <= 0){
        boat.a.y = 0;
    } else {
        // عند بلوغ السرعة القصوى لغرق الجسم نجعل التسارع معدوم
        if(Math.abs(boat.v.y) >= Math.abs(boat.v_max_drowning)){
            boat.a.y = 0;
        } else {
            boat.a.y = boat.f.y / boat.m;
        }
    }

    boat.a.printVector("Accelrate = ");
}

function calculateSpeed(boat) {
    const v_length_engine = boat.v.calculateLength2D();
    const f_total_length = boat.f.calculateLength2D();

    // الحركة على سطح الماء
    if(f_total_length <= 0){
        boat.v.x = 0;
        boat.v.z = 0;
    } else {
        // اذا السرعة قصوى الحركة مستقيمة منتظمة السرعة ثابتة قصوى
        if(v_length_engine >= boat.v_max && boat.f0 !== 0){
            console.log("reach to the max speed" + "\n");
        } else {
            boat.v.x = boat.v.x + (boat.a.x * boat.delta_time);
            boat.v.z = boat.v.z + (boat.a.z * boat.delta_time);
        }
    }

    // حركة الطفو والغرق
    if(Math.abs(boat.f.y) <= 0){
        boat.v.y = 0;
    } else {
        // عند بلوغ السرعة القصوى لغرق الجسم نجعل السرعة ثابتة تساوي سرعة الغرق العظمى
        if(Math.abs(boat.v.y) >= Math.abs(boat.v_max_drowning)){
            console.log("Reach to the max speed of drowing !! ");
        } else {
            boat.v.y = boat.v.y + boat.a.y * boat.delta_time;
        }
    }

    boat.v.printVector("Speed = ");
}

function calculatePosition(boat) {

    // دستور الحركة المتغيرة بانتظام في حال الحركة منظمة تكون الحدود التي تحوي سرعة أو تسارع معدومة تلقائياً
    boat.position.x = boat.position.x + (boat.v.x * boat.delta_time) + (0.5 * boat.a.x * boat.delta_time * boat.delta_time);
    boat.position.y = boat.position.y + (boat.v.y * boat.delta_time) + (0.5 * boat.a.y * boat.delta_time * boat.delta_time);
    boat.position.z = boat.position.z + (boat.v.z * boat.delta_time) + (0.5 * boat.a.z * boat.delta_time * boat.delta_time);

    // حالة تجاوز القارب  فضاء المحاكاة
    if (boat.position.x > boat.maxPositionLimit) { 
        boat.position.x = boat.maxPositionLimit;
        console.log("The limits of the simulation space have been exceeded from +x" + "\n"); 
    }
    if (boat.position.x < -boat.maxPositionLimit) { 
        boat.position.x = -boat.maxPositionLimit; 
        console.log("The limits of the simulation space have been exceeded from -x" + "\n"); 
    }
    if (boat.position.z > boat.maxPositionLimit) { 
        boat.position.z = boat.maxPositionLimit; 
        console.log("The limits of the simulation space have been exceeded from +z" + "\n"); 
    }
    if (boat.position.z < -boat.maxPositionLimit) { 
        boat.position.z = -boat.maxPositionLimit; 
        console.log("The limits of the simulation space have been exceeded from -z" + "\n"); 
    }

    // منع القارب من الطيران فوق سطح الماء
    if (boat.position.y > (boat.hightBoat / 2)) { 
        boat.position.y = (boat.hightBoat / 2); 
        console.log("boat can not fly !! " + "\n"); 
    }
    // الوصول لقاع البحر والتوقف عنده
    if (boat.position.y < -(boat.maxPositionLimit - 8000)) {
        boat.position.y = -(boat.maxPositionLimit - 8000); 
        console.log("reach to the sea floor !!" + "\n"); 
    }

    

    boat.position.printVector("position = ");
}

export { Physics };