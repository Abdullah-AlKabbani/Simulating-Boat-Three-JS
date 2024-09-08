// Vector.js

class Vector {
    constructor(x=0, y=0, z=0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  
    createVectorFromValues(x, y, z) {
      return new Vector(x, y, z);
    }
  
    createZeroVector() {
      return new Vector(0, 0, 0);
    }
  
    add(otherVector) {
      return new Vector(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
    }
  
    subtract(otherVector) {
      return new Vector(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
    }
  
    calculateLength() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    calculateLength2D() {
      return Math.sqrt(this.x * this.x + this.z * this.z);
    }
  
    calculateAngleWith(otherVector) {
      const dotProduct = this.x * otherVector.x + this.y * otherVector.y + this.z * otherVector.z;
      const lengthProduct = this.calculateLength() * otherVector.calculateLength();
      return Math.acos(dotProduct / lengthProduct);
    }
  
    calculateScalarProduct(otherVector) {
      return this.x * otherVector.x + this.y * otherVector.y + this.z * otherVector.z;
    }
  
    calculateVectorProduct(otherVector) {
      const x = this.y * otherVector.z - this.z * otherVector.y;
      const y = this.z * otherVector.x - this.x * otherVector.z;
      const z = this.x * otherVector.y - this.y * otherVector.x;
      return new Vector(x, y, z);
    }

    printVector(vectorName){
        console.log(vectorName +"Vector(" + this.x.toFixed(2) + ", " + this.y.toFixed(2) + ", " + this.z.toFixed(2) + ")\n");
    }
  }
  
  export { Vector };