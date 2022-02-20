import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

const scene = new THREE.Scene()

// wtf Y is up???



const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const geometry = new THREE.BoxGeometry(0.2,0.2,0.4)
const material = new THREE.MeshStandardMaterial({
    color: 0x94D0FF,
    // wireframe: true,
    opacity: 0.5,
    transparent: true,
    roughness: 1
})
const material2 = new THREE.MeshStandardMaterial({
    color: 0x000,
    wireframe: true,
    // opacity: 0.5,
    // transparent: true,
    // roughness: 1
})
const cube = new THREE.Mesh(geometry, material)
const cube2 = new THREE.Mesh(geometry, material2)
cube.position.x = 4
cube.position.y = 0.1
cube.position.z = 1.8
cube.rotation.y = Math.PI / 2;
cube2.position.x = 4
cube2.position.y = 0.1
cube2.position.z = 1.8
cube2.rotation.y = Math.PI / 2;
scene.add(cube)
scene.add(cube2)


const geometry6 = new THREE.BoxGeometry(0.2,0.2,0.4)
const material6 = new THREE.MeshStandardMaterial({
    color: 0x966BFF, //FFDE8B
    opacity: 0.5,
    transparent: true,
    roughness: 1
})
const cube3 = new THREE.Mesh(geometry6, material6)
const cube4 = new THREE.Mesh(geometry6, material2)
cube3.visible = false;
cube4.visible = false;
scene.add(cube3)
scene.add(cube4)

const geometry7 = new THREE.BoxGeometry(0.2,0.2,0.4)
const material7 = new THREE.MeshStandardMaterial({
    color: 0xFFDE8B, //
    opacity: 0.5,
    transparent: true,
    roughness: 1
})
const cube5 = new THREE.Mesh(geometry7, material7)
const cube6 = new THREE.Mesh(geometry7, material2)
cube5.visible = false;
cube6.visible = false;
scene.add(cube5)
scene.add(cube6)



const light = new THREE.PointLight(0xffffff, 2)
light.position.set(10, 10, 10)
scene.add(light)

const light2 = new THREE.PointLight(0xff00ff, 2)
light.position.set(-10, 10, 10)
scene.add(light2)

const light3 = new THREE.PointLight(0x00ffff, 2)
light.position.set(10, 10, -10)
scene.add(light3)

const light4 = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light4)

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );


window.addEventListener(
    'resize',
    () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        render()
    },
    false
)

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cubeFolder = gui.addFolder('Cube')
cubeFolder.add(cube.scale, 'x', -5, 5)
cubeFolder.add(cube.scale, 'y', -5, 5)
cubeFolder.add(cube.scale, 'z', -5, 5)
cubeFolder.open()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'z', 0, 10)
cameraFolder.open()


const geometry2 = new THREE.PlaneGeometry(10, 10); // width, height, no depth for plane
var texture = new THREE.TextureLoader().load(
    "./img.png"
); // remove color = ...

const material3 = new THREE.MeshBasicMaterial({
    // color: 0xeba6f5,
    side: THREE.DoubleSide,
    map: texture // texture as a map for material
});
const plane = new THREE.Mesh(geometry2, material3); // mesh takes just two parameters
plane.position.y = 0;
plane.rotation.x = Math.PI / 2;

scene.add(plane);

var transitioned = false;
function animate() {
    requestAnimationFrame(animate)

    if (cube.position.x > 3) {
        cube.position.x -= 0.01
        cube.position.z -= 0.0005
        cube2.position.x -= 0.01
        cube2.position.z -= 0.0005

    } else {
        if (!transitioned) {
            cube.visible = false;
            cube2.visible = false;
            cube3.visible = true;
            cube4.visible = true;
            cube5.visible = true;
            cube6.visible = true;
            transitioned = true;
            cube3.position.copy(cube.position);
            cube3.rotation.copy( cube.rotation);
            cube4.position.copy(cube.position);
            cube4.rotation.copy( cube.rotation);
            cube5.position.copy( cube.position);
            cube5.rotation.copy( cube.rotation);
            cube6.position.copy( cube.position);
            cube6.rotation.copy( cube.rotation);
        }
        cube3.position.x -= 0.01
        cube3.position.z -= 0.0005
        cube4.position.x -= 0.01
        cube4.position.z -= 0.0005

        cube5.position.x -= 0.015
        cube5.position.z -= 0.0007
        cube6.position.x -= 0.015
        cube6.position.z -= 0.0007

    }
    controls.update()
    render()
    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()
