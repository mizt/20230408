const loadScript = (url,callback)=>{
  const srcipt = document.createElement("script");
  srcipt.type = "text/javascript";
  srcipt.src = url;
  document.body.appendChild(srcipt);
  srcipt.onload = callback;
}

loadScript("twgl.js",()=>{
  loadScript("Data.js",()=>{
    
    const width = 1920;
    const height = 1080;
    const div = document.createElement("div");
    Object.assign(div.style,{"display":"flex","width":"100vw","height":"100vh"});
    
    const canvas = document.createElement("canvas");
    Object.assign(canvas,{"width":width,"height":height});
    Object.assign(canvas.style,{"vertical-align":"top","outline":"1px solid #555"});
    const resize = (e)=>{
      Object.assign(canvas.style,(window.innerWidth/width<window.innerHeight/height)?{"width":"100vw","height":"auto","margin":"auto 0"}:
        {"width":"auto","height":"100vh","margin":"0 auto"});
    }
    let tid = 0;
    window.addEventListener("resize",(e)=>{
      clearTimeout(tid);
      tid = setTimeout(()=>resize(),33);
    });
    resize();
    
    document.body.appendChild(div);
    div.appendChild(canvas);
    
    const gl = canvas.getContext("experimental-webgl",{antialias:false});
    
    const vert = `
        precision mediump float;
        uniform mat4 u_projectionMatrix;
        uniform float u_fov;
        uniform float u_thickness;
        uniform vec2 u_resolution;
        uniform float u_offset;
        uniform mat4 u_rotationMatrix;
        attribute vec3 vertices;
        attribute vec3 targets;
        attribute float types;
        varying vec4 color;
        void main() {
          float W = u_resolution.x;
          float H = u_resolution.y;
          float Z = -(H*0.5)/u_fov;
          vec4 vertice = u_projectionMatrix*((u_rotationMatrix*(vec4(vertices,1.0)+vec4(0,0,u_offset,0)))+vec4(0,0,-u_offset,0));
          float px = (vertice.x/vertice.z)*(W*0.5);
          float py = (vertice.y/vertice.z)*(H*0.5);
          vec4 target = u_projectionMatrix*((u_rotationMatrix*(vec4(targets,1.0)+vec4(0,0,u_offset,0)))+vec4(0,0,-u_offset,0));
          float nx = (target.x/target.z)*(W*0.5)-px;
          float ny = (target.y/target.z)*(H*0.5)-py;
          float len = sqrt(nx*nx+ny*ny);
          if(len!=0.0) {
            nx/=len;
            ny/=len;
          }
          nx*=u_thickness*0.5;
          ny*=u_thickness*0.5;
          gl_Position = u_projectionMatrix*((types==1.0||types==2.0)?vec4(px-ny,-(py+nx),Z,1.0):vec4(px+ny,-(py-nx),Z,1.0));
        
        }`
    const frag = `
        precision mediump float;
        void main() { 
          gl_FragColor = vec4(1.0);
        }`
    
    const program = twgl.createProgramFromSources(gl,[vert,frag]);
    if(program) {
      
      const programInfo = twgl.createProgramInfoFromProgram(gl,program);
      const bufferInfo = twgl.createBufferInfoFromArrays(gl,{
        vertices:{ numComponents:3, data:Data.vertices },
        targets:{ numComponents:3, data:Data.targets },
        types:{ numComponents:1, data:Data.types },
        indices:{ numComponents:3, data:Data.indices }
      });
      
      const Y = 2.531836;
      
      const uniforms = {
        u_projectionMatrix:[
          1.424158,0,0,0,
          0,Y,0,0,
          -0.001591,0.006291,-1.000000,-1.000000,
          0.000000,0.000000,-0.001000,0.000000,
        ],
        u_fov:Math.tan(Math.atan(1.0/Y)),
        u_resolution:[width,height],
        u_thickness:3,
        u_offset:-3.0
      };
      
      let timer = 0.0;
      let rotationMatrix = [
        1.0,0.0,0.0,0.0,
        0.0,1.0,0.0,0.0,
        0.0,0.0,1.0,0.0,
        0.0,0.0,0.0,1.0,
      ];
      
      const init_rotation = function(matrix,x,y,z,angle) {
        const len = Math.sqrt(x*x+y*y+z*z);
        if(len!=0) {
          x/=len;
          y/=len;
          z/=len;
          const radian = Math.PI*(angle/180.0);
          const s = Math.sin(radian);
          const c = Math.cos(radian);
          const oc = 1.0-c;
          matrix[0] = oc*x*x+c;
          matrix[1] = oc*x*y-z*s;
          matrix[2] = oc*z*x+y*s;
          matrix[4] = oc*x*y+z*s;
          matrix[5] = oc*y*y+c;
          matrix[6] = oc*y*z-x*s;
          matrix[8] = oc*z*x-y*s;
          matrix[9] = oc*y*z+x*s;
          matrix[10] = oc*z*z+c;
        }
      };
      
      setInterval(()=>{
        
        const bounds = canvas.getBoundingClientRect();
        let thickness = ((2.0*(width/bounds.width))*2.0);
        thickness = (thickness>=3)?3:thickness;
        gl.viewport(0,0,width,height);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        
        init_rotation(rotationMatrix,1.0,1.0,0.0,Math.PI*0.85*Math.sin(timer));
        timer+=(Math.PI/31.0);

        uniforms.u_rotationMatrix = rotationMatrix;
        uniforms.u_thickness = (thickness>=4)?4:thickness;
        
        gl.useProgram(program);
        twgl.setBuffersAndAttributes(gl,programInfo,bufferInfo);
        twgl.setUniforms(programInfo,uniforms);
        gl.drawElements(gl.TRIANGLES,bufferInfo.numElements,gl.UNSIGNED_SHORT,0);
        
      },33);
    }
  });
});

