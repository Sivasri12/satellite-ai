const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, 700);
document.getElementById("globe").appendChild(renderer.domElement);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Earth
const geometry = new THREE.SphereGeometry(5,64,64);
const texture = new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
const material = new THREE.MeshPhongMaterial({map:texture});
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Light
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(20,20,20);
scene.add(light);

// Stars background
function createStars(){
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1000;
  const positions = [];
  for(let i=0;i<starCount;i++){
    positions.push((Math.random()-0.5)*200);
    positions.push((Math.random()-0.5)*200);
    positions.push((Math.random()-0.5)*200);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  const starMat = new THREE.PointsMaterial({color:0xffffff, size:0.5});
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}
createStars();

// Camera
camera.position.z = 15;

// Satellites and debris
let satellites=[], asteroids=[];
fetch("/api/satellites").then(res=>res.json()).then(data=>{
  data.forEach((sat,i)=>{
    const geo = new THREE.SphereGeometry(0.1,8,8);
    let col = sat.risk=="HIGH"?0xff0000:sat.risk=="MEDIUM"?0xffa500:0x00ff00;
    const mat = new THREE.MeshBasicMaterial({color:col});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(sat.x/200, sat.y/200, sat.z/200);
    mesh.userData = sat;
    scene.add(mesh);
    satellites.push(mesh);
  });
});

// Debris
for(let i=0;i<30;i++){
  const geo = new THREE.SphereGeometry(0.15,8,8);
  const mat = new THREE.MeshBasicMaterial({color:0x888888});
  const asteroid = new THREE.Mesh(geo, mat);
  asteroid.position.set(Math.random()*20-10, Math.random()*20-10, Math.random()*20-10);
  scene.add(asteroid);
  asteroids.push(asteroid);
}

// Animate
function animate(){
  requestAnimationFrame(animate);
  earth.rotation.y += 0.001;

  // Collision check
  satellites.forEach(sat=>{
    asteroids.forEach(ast=>{
      let dist = sat.position.distanceTo(ast.position);
      if(dist<0.5){
        const msg = new SpeechSynthesisUtterance("Collision risk detected. AI adjusting orbit.");
        speechSynthesis.speak(msg);
        sat.position.x += 0.5; sat.position.y += 0.5; sat.position.z += 0.5;
      }
    });
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();
