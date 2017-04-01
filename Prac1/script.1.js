function webGLStart() {
    var canvas = document.getElementById('scene');
    var glInstance = new GLInstance(canvas);
    var gl = glInstance.gl;

    var shaderProgram = new ShaderProgram(gl);

    var cameraTranslationArray = [
        [-1.5, 0.0, -7.0],
        [3.0, 0.0, 0.0]
    ]

    var positionBufferArray = getVertexPositionBuffers();

    var scene = new Scene(glInstance.gl, shaderProgram, cameraTranslationArray, positionBufferArray);

    scene.reset();
    scene.drawScene();

}

function getVertexPositionBuffers() {
    var triangleVertexPositionBuffer = new Buffer(gl, gl.TRIANGLES, 3, 3, [
        0.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ]);

    var squareVertexPositionBuffer = new Buffer(gl, gl.TRIANGLE_STRIP, 3, 4, [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ]);

    return [
        triangleVertexPositionBuffer,
        squareVertexPositionBuffer
    ];
}

// ================ GL instance object ===================

function GLInstance(canvas) {
    this.gl = canvas.getContext('webgl');
    this.gl.viewportWidth = canvas.width;
    this.gl.viewportHeight = canvas.height;
}

// ================ Shader object ===================

// This "function" is the contructor for the Shader object
// All of the "var" variables are private variables
// All of the "this" variables are public
//      Remember that functions can be assigned to variables in JS so:
//      var funcName = function () {...} is a private function called funcName
//          and
//      this.funcName = function () {...} is a public function called funcName

// We can create a new Shader object with "new Shader(gl, "id", gl.TYPE)"
function Shader(gl, id, type) {

    // We are getting the <script id="id" type="type"> tag from the HTML
    // and saving it to a private variable
    var shaderScript = document.getElementById(id);
    var shaderString = ""; // Private variable for the text content

    // Private function that will get the C code out of the script tag
    var extractString = function () {
        var child = shaderScript.firstChild;

        while (child != null) {
            if (child.nodeType === 3) {
                shaderString += child.textContent;
            }
            child = child.nextSibling;
        }
    }

    // This is the public variable for the shader
    // In Prac 1 this is the shader that is returned from the "getShader" function
    // After calling var fragmentShader = new Shader(...)
    // You can access the shader with fragmentShader.shader
    // So this using our Shader object:
    //      var fragmentShader = new Shader(gl, "fragment-shader", gl.FRAGMENT_SHADER);
    //      console.log(fragmentShader);
    // Is the same as if you had used this in the prac one code:
    //      var fragmentShader = getShader(gl, "fragment-shader");
    //      console.log(fragmentShader);
    this.shader = gl.createShader(type);

    // Calling the private methods to get and compile the C code
    extractString();
    gl.shaderSource(this.shader, shaderString);
    gl.compileShader(this.shader);

    // This checks to make sure nothing went wrong
    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(this.shader));
        //Removed return null because we're working with objects instead
        //of functions.
    }

}

// You can do this love :) I am here and happy to help you, and I know that you can
// I believe in you and I am proud that you are trying!
// You will get it right eventually! 
// I love you
// Thank you for your help. It means more than you know.

// ================ Shader program object ===================

function ShaderProgram(gl) {

    var fragmentShader = new Shader(gl, "fragment-shader", gl.FRAGMENT_SHADER);
    var vertexShader = new Shader(gl, "vertex-shader", gl.VERTEX_SHADER);

    this.program = gl.createProgram();

    gl.attachShader(this.program, fragmentShader.shader);
    gl.attachShader(this.program, vertexShader.shader);

    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        alert('Could not init shader program');
    }

    gl.useProgram(this.program);

    this.program.vertexPositionAttribute = gl.getAttribLocation(this.program, "vertexPosition");
    gl.enableVertexAttribArray(this.program.vertexPositionAttribute);

    this.program.pMatrixLocation = gl.getUniformLocation(this.program, "projectionMatrix");
    this.program.mvMatrixLocation = gl.getUniformLocation(this.program, "modelViewMatrix");

}

// ================ Buffer object ===================

// gl and vertices are now private variables
function Buffer(gl, type, itemSize, numItems, vertices) {

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    this.vertices = vertices;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    this.buffer.itemSize = itemSize;
    this.buffer.numItems = numItems;

    this.drawArrays = function () {
        gl.drawArrays(type, 0, this.buffer.numItems);
    }

}

// ================ Scene object ===================

function Scene(gl, shaderProgram, cameraTranslationArray, positionBufferArray) {

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var pMatrix;
    var mvMatrix;

    this.drawScene = function () {

        this.reset();

        pMatrix = mat4.create();
        mvMatrix = mat4.create();

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

        for (var i = 0; i < positionBufferArray.length; i++) {
            var positionBuffer = positionBufferArray[i];

            mat4.translate(mvMatrix, cameraTranslationArray[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer.buffer);

            gl.vertexAttribPointer(
                shaderProgram.program.vertexPositionAttribute,
                positionBuffer.buffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            );

            this.setMatrixUniforms();

            positionBuffer.drawArrays();
        }

    };

    this.setMatrixUniforms = function () {
        gl.uniformMatrix4fv(shaderProgram.program.pMatrixLocation, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.program.mvMatrixLocation, false, mvMatrix);
    };

    this.reset = function () {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };


}