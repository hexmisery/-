'use strict';

(() => {
  const brand = document.querySelector('.ocean-brand');
  if (!brand) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {alpha: true, antialias: true, premultipliedAlpha: false});
  if (!gl) return;
  const vertex = `
    attribute vec2 uv;
    uniform float time;
    varying vec3 normal;
    varying vec3 world;
    varying float foam;
    vec3 surface(vec2 p) {
      float pulse=sin(time*1.2+p.y*2.0);
      float a=p.x*(4.5+0.32*pulse);
      float r=0.54+0.035*sin(p.y*9.0-time*1.8);
      return vec3(0.1-r*sin(a)+0.6*pow(1.0-p.x,8.0),-0.52+r*(1.0-cos(a)),(p.y-0.5)*0.85);
    }
    void main(){
      vec3 p=surface(uv);
      vec3 dx=surface(uv+vec2(0.001,0.0))-p;
      vec3 dz=surface(uv+vec2(0.0,0.001))-p;
      normal=normalize(cross(dx,dz));
      world=p;
      foam=smoothstep(0.86,0.98,uv.x);
      float x=p.x*0.87+p.z*0.49;
      float z=-p.x*0.49+p.z*0.87;
      float y=p.y*0.94-z*0.34;
      gl_Position=vec4(x*1.45,y*1.38,(z*0.94+p.y*0.34)*0.5,1.0);
    }`;
  const fragment = `
    precision mediump float;
    varying vec3 normal;
    varying vec3 world;
    varying float foam;
    uniform float time;
    void main(){
      vec3 n=normalize(normal);
      if(!gl_FrontFacing)n=-n;
      vec3 light=normalize(vec3(-0.6,1.0,1.5));
      float diffuse=max(dot(n,light),0.0);
      float shine=pow(max(dot(reflect(-light,n),normalize(vec3(0.5,0.6,2.0))),0.0),38.0);
      float streak=sin(world.y*45.0+world.z*18.0-time*2.0)*0.025;
      vec3 water=mix(vec3(0.008,0.07,0.19),vec3(0.02,0.66,0.86),diffuse);
      water+=vec3(0.7,0.94,1.0)*shine*0.8+streak;
      float froth=foam*(0.85+0.15*sin(world.z*95.0+time*2.0));
      vec3 color=mix(water,vec3(0.8,0.96,1.0)*(0.65+0.35*diffuse),froth);
      gl_FragColor=vec4(color,1.0);
    }`;
  function shader(type, source) {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error('Wave shader unavailable');
    return item;
  }
  try {
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Wave unavailable');
    gl.useProgram(program);
    const vertices = [];
    for (let x=0;x<64;x++) for(let y=0;y<24;y++) {
      const a=x/64,b=y/24,c=(x+1)/64,d=(y+1)/24;
      vertices.push(a,b,c,b,a,d,a,d,c,b,c,d);
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'uv');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0,0,0,0);
    const time = gl.getUniformLocation(program,'time');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0, visible=true, lost=false;
    function draw(now) {
      frame=0;
      if(lost || document.hidden || !visible) return;
      const ratio=Math.min(devicePixelRatio||1,2);
      const width=Math.round(brand.clientWidth*ratio),height=Math.round(brand.clientHeight*ratio);
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(time,reduce.matches?0:now/1000);
      gl.drawArrays(gl.TRIANGLES,0,vertices.length/2);
      if(!reduce.matches)frame=requestAnimationFrame(draw);
    }
    function resume(){cancelAnimationFrame(frame);frame=0;draw(performance.now());}
    brand.append(canvas);
    brand.classList.add('wave-webgl');
    canvas.addEventListener('webglcontextlost',()=>{lost=true;cancelAnimationFrame(frame);brand.classList.remove('wave-webgl');});
    document.addEventListener('visibilitychange',resume);
    reduce.addEventListener('change',resume);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();}).observe(brand);
    resume();
  } catch {
    canvas.remove();
    brand.classList.remove('wave-webgl');
  }
})();
