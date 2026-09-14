// CB400 Super Four: candy red / silver tank panels, black chassis, polished 4-into-1.
// Modelled from the user's reference photo. +Z forward, dimensions in metres.
export function buildCB400(THREE, car, chrome, Reflector) {
  const mirrorSurfaces=[];
  const material = (color, roughness = 0.5, metalness = 0.1) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const red = new THREE.MeshPhysicalMaterial({ color: 0xa70820, roughness: 0.22, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.13 });
  const silver = material(0xd5d8dc, 0.3, 0.65), black = material(0x16191d, 0.65, 0.3);
  const rubber = material(0x101215, 0.93, 0), seatMat = material(0x22242a, 0.96, 0);
  const engineMat = material(0x3b3d43, 0.4, 0.58), alloy = material(0x868b92, 0.32, 0.7);
  const polished = material(0xe1e3e7, 0.2, 0.6);
  function named(obj, label) { obj.name = label; obj.userData.partName = label; return obj; }
  function group(parent, label) { const g = named(new THREE.Group(), label); parent.add(g); return g; }
  function mesh(parent, label, geometry, mat, x = 0, y = 0, z = 0) {
    const m = named(new THREE.Mesh(geometry, mat), label); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const box = (p, n, w, h, d, m, x, y, z) => mesh(p, n, new THREE.BoxGeometry(w, h, d), m, x, y, z);
  function tube(parent, label, points, radius, mat) {
    return mesh(parent, label, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 40, radius, 8, false), mat);
  }
  function rod(parent, label, a, b, radius, mat) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const m = mesh(parent, label, new THREE.CylinderGeometry(radius, radius, delta.length(), 16), mat);
    m.position.copy(start.add(end).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
  }
  function ellipsoid(parent, label, sx, sy, sz, mat, x, y, z) {
    const m = mesh(parent, label, new THREE.SphereGeometry(1, 36, 24), mat, x, y, z); m.scale.set(sx, sy, sz); return m;
  }
  // Smooth longitudinal sections keep the tank and stepped saddle narrow across X.
  function shell(parent, label, sections, mat) {
    const positions = [], indices = [], segments = 40;
    for (const [z, w, low, high] of sections) for (let i = 0; i < segments; i++) {
      const a = i / segments * Math.PI * 2;
      positions.push(Math.cos(a) * w, (high + low) / 2 + Math.sin(a) * (high - low) / 2, z);
    }
    for (let j = 0; j < sections.length - 1; j++) for (let i = 0; i < segments; i++) {
      const a = j * segments + i, b = j * segments + (i + 1) % segments;
      indices.push(a, b, b + segments, a, b + segments, a + segments);
    }
    for (let i = 1; i < segments - 1; i++) { indices.push(0, i + 1, i); const last = (sections.length - 1) * segments; indices.push(last, last + i, last + i + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals();
    return mesh(parent, label, geo, mat);
  }
  const motorcycleRoot = group(car, 'motorcycleRoot'); motorcycleRoot.userData.previewPathAlias = 'cb400';
  const bikeCockpitRoot = group(car, 'bikeCockpitRoot'); bikeCockpitRoot.userData.previewPathAlias = 'cb400Cockpit';
  const tank = shell(motorcycleRoot, 'candyRedTank', [[-.28,.065,.77,.86],[-.16,.135,.76,.93],[0,.205,.77,1.02],[.19,.218,.8,1.064],[.34,.184,.83,1.052],[.46,.09,.84,.98],[.49,.025,.87,.93]], red);
  // Surface-following paint livery, sampled from the same tank section surface.
  const tankSections = [[-.28,.065,.77,.86],[-.16,.135,.76,.93],[0,.205,.77,1.02],[.19,.218,.8,1.064],[.34,.184,.83,1.052],[.46,.09,.84,.98],[.49,.025,.87,.93]];
  function tankPoint(z, angle, side, offset) {
    let i = 0; while (i < tankSections.length - 2 && tankSections[i + 1][0] < z) i++;
    const a = tankSections[i], b = tankSections[i + 1], t = (z - a[0]) / (b[0] - a[0]);
    const w = THREE.MathUtils.lerp(a[1],b[1],t), low = THREE.MathUtils.lerp(a[2],b[2],t), high = THREE.MathUtils.lerp(a[3],b[3],t);
    return [side * (Math.cos(angle) * w + offset), (high + low) / 2 + Math.sin(angle) * (high - low) / 2, z];
  }
  for (const side of [-1,1]) {
    for (const [label, inset, offset, mat] of [['whitePinstripe',0,.004,silver],['blackSweep',.025,.005,black],['silverPanel',.064,.006,silver]]) {
      const positions=[],indices=[];
      const samples=[[-.215,-.65,.06],[-.15,-.82,.34],[0,-.75,.65],[.18,-.5,.77],[.29,-.24,.65],[.38,.05,.22]];
      for(const [z,bottom,top] of samples)for(let j=0;j<=12;j++)positions.push(...tankPoint(z,THREE.MathUtils.lerp(bottom+inset,top-inset,j/12),side,offset));
      for(let i=0;i<samples.length-1;i++)for(let j=0;j<12;j++){const a=i*13+j,b=a+13;indices.push(a,b,a+1,a+1,b,b+1);}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
      const paint=mat.clone();paint.side=THREE.DoubleSide;mesh(motorcycleRoot,`${label}${side}`,geo,paint);
    }
  }
  const fuelCap=mesh(motorcycleRoot,'fuelCap',new THREE.CylinderGeometry(.043,.043,.009,32),silver,0,1.068,.18);
  mesh(fuelCap,'lock',new THREE.BoxGeometry(.018,.004,.008),black,0,.007,0);
  shell(motorcycleRoot,'steppedSaddle',[[-.96,.085,.88,.94],[-.85,.145,.855,.966],[-.63,.153,.82,.95],[-.45,.125,.775,.867],[-.27,.108,.775,.837],[-.19,.07,.8,.837]],seatMat);
  shell(motorcycleRoot,'redTailCowl',[[-1.02,.035,.86,.91],[-.93,.11,.815,.88],[-.73,.151,.76,.849],[-.5,.125,.73,.81],[-.31,.08,.725,.77]],red);
  for(const side of [-1,1]) {
    tube(motorcycleRoot,`tailSilverStripe${side}`,[[side*.11,.85,-.94],[side*.153,.82,-.76],[side*.13,.78,-.52],[side*.09,.75,-.35]],.012,silver);
    tube(motorcycleRoot,`grabRail${side}`,[[side*.14,.87,-.65],[side*.18,.92,-.86],[side*.12,.94,-1.0]],.014,alloy);
    const coverShape=new THREE.Shape();coverShape.moveTo(-.50,.80);coverShape.quadraticCurveTo(-.34,.82,-.17,.78);coverShape.lineTo(-.25,.60);coverShape.quadraticCurveTo(-.37,.60,-.50,.80);
    const coverGeo=new THREE.ExtrudeGeometry(coverShape,{depth:.015,bevelEnabled:true,bevelSegments:3,bevelSize:.008,bevelThickness:.008,curveSegments:16});
    const panel=mesh(motorcycleRoot,`sideCover${side}`,coverGeo,red,side*.14);panel.rotation.y=Math.PI/2;panel.scale.x=-1;
    tube(motorcycleRoot,`frameCradle${side}`,[[side*.12,.94,.38],[side*.16,.72,.3],[side*.18,.3,.15],[side*.17,.29,-.25],[side*.14,.71,-.48],[side*.12,.87,-.7]],.018,black);
    rod(motorcycleRoot,`seatSubframe${side}`,[side*.12,.63,-.35],[side*.12,.88,-.94],.019,black);
    rod(motorcycleRoot,`swingarm${side}`,[side*.13,.43,-.2],[side*.135,.315,-.715],.024,alloy);
    rod(motorcycleRoot,`shockShaft${side}`,[side*.168,.36,-.72],[side*.168,.79,-.55],.017,chrome);
    const spring=[];const start=new THREE.Vector3(side*.168,.39,-.71),end=new THREE.Vector3(side*.168,.74,-.57);
    for(let i=0;i<=144;i++){const t=i/144,a=t*Math.PI*2*12,p=start.clone().lerp(end,t);spring.push([p.x+Math.cos(a)*.033,p.y+Math.sin(a)*.013,p.z+Math.sin(a)*.031]);}
    tube(motorcycleRoot,`redShockSpring${side}`,spring,.0065,red);
    rod(motorcycleRoot,`footpeg${side}`,[side*.15,.44,-.23],[side*.29,.44,-.23],.017,black);
    box(motorcycleRoot,`heelPlate${side}`,.016,.11,.19,silver,side*.19,.45,-.32);
  }
  ellipsoid(motorcycleRoot,'crankcase',.225,.17,.24,engineMat,0,.48,0);
  for(const side of [-1,1]) {
    const cover=mesh(motorcycleRoot,`engineCover${side}`,new THREE.CylinderGeometry(.124,.124,.045,40),engineMat,side*.228,.46,-.05);cover.rotation.z=Math.PI/2;
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2;mesh(motorcycleRoot,`caseBolt${side}:${i}`,new THREE.SphereGeometry(.008,8,6),silver,side*.254,.46+Math.sin(a)*.107,-.05+Math.cos(a)*.107);}
    const small=mesh(motorcycleRoot,`clutchCover${side}`,new THREE.CylinderGeometry(.073,.073,.026,32),alloy,side*.236,.43,.135);small.rotation.z=Math.PI/2;
  }
  for(let i=0;i<4;i++) {
    const x=(i-1.5)*.095;
    box(motorcycleRoot,`cylinder${i}`,.084,.21,.18,engineMat,x,.65,.115);
    for(let j=0;j<7;j++)box(motorcycleRoot,`coolingFin${i}:${j}`,.091,.008,.19,alloy,x,.58+j*.024,.12);
    tube(motorcycleRoot,`header${i}`,[[x,.715,.22],[x,.64,.33],[x,.4,.34],[x,.235,.2],[x*.65,.225,-.13],[-.16,.26,-.37]],.022,polished);
  }
  box(motorcycleRoot,'camCover',.43,.065,.235,engineMat,0,.802,.12);
  box(motorcycleRoot,'radiator',.32,.20,.055,black,0,.70,.335);
  for(let i=0;i<12;i++)box(motorcycleRoot,`radiatorFin${i}`,.295,.003,.014,alloy,0,.613+i*.015,.366);
  tube(motorcycleRoot,'collector',[[-.16,.26,-.37],[-.24,.3,-.48],[-.26,.39,-.62]],.041,polished);
  rod(motorcycleRoot,'chromeSilencer',[-.265,.37,-.49],[-.265,.56,-.98],.063,polished);
  rod(motorcycleRoot,'exhaustOutlet',[-.265,.56,-.98],[-.265,.57,-1.01],.045,black);
  for(const z of [-.57,-.87]){const band=mesh(motorcycleRoot,`mufflerBand${z}`,new THREE.TorusGeometry(.064,.005,8,32),alloy,-.265,.37+(-z-.49)*.388,z);band.rotation.x=.37;}
  function wheel(parent,label,width) {
    const g=group(parent,label);
    const tire=mesh(g,'tire',new THREE.TorusGeometry(.262,.053,16,64),rubber);tire.rotation.y=Math.PI/2;tire.scale.z=width/.106;
    const rim=mesh(g,'rim',new THREE.TorusGeometry(.218,.014,10,48),black);rim.rotation.y=Math.PI/2;
    const hub=mesh(g,'hub',new THREE.CylinderGeometry(.048,.048,width+.018,24),alloy);hub.rotation.z=Math.PI/2;
    for(const side of [-1,1]) {
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;rod(g,`spoke${side}:${i}`,[side*.026,Math.sin(a)*.047,Math.cos(a)*.047],[side*.044,Math.sin(a+.13)*.211,Math.cos(a+.13)*.211],.014,black);}
      const disc=mesh(g,`brakeDisc${side}`,new THREE.RingGeometry(.093,.146,48),silver,side*(width/2+.014));disc.rotation.y=side*Math.PI/2;
      for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const hole=mesh(g,`discDrill${side}:${i}`,new THREE.CircleGeometry(.0045,6),black,side*(width/2+.015),Math.sin(a)*.128,Math.cos(a)*.128);hole.rotation.y=side*Math.PI/2;}
    }
    return {group:g,tire,rim,hub};
  }
  const bikeFrontWheelPivot=group(motorcycleRoot,'bikeFrontWheelPivot');bikeFrontWheelPivot.position.set(0,.315,.72);
  const bikeFrontWheelAssembly=wheel(bikeFrontWheelPivot,'frontWheel',.12);
  const bikeRearWheelMount=group(motorcycleRoot,'bikeRearWheelMount');bikeRearWheelMount.position.set(0,.315,-.715);
  const bikeRearWheelAssembly=wheel(bikeRearWheelMount,'rearWheel',.16);
  mesh(bikeRearWheelMount,'rearSprocket',new THREE.RingGeometry(.048,.12,40),alloy,.096,0,0).rotation.y=Math.PI/2;
  tube(motorcycleRoot,'driveChain',[[.105,.40,-.71],[.105,.50,-.24],[.105,.42,-.15],[.105,.23,-.69],[.105,.25,-.82],[.105,.35,-.83],[.105,.40,-.71]],.009,alloy);
  // Brand/model markings are the same physical decals in all three locales.
  for(const side of [-1,1]) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');
    c.fillStyle='#f5f5f4';c.textAlign='center';c.font='bold italic 50px sans-serif';c.fillText('HONDA',256,202);
    for(let i=0;i<5;i++){c.beginPath();c.moveTo(191,132-i*12);c.lineTo(349-i*9,38+i*10);c.lineTo(301-i*11,109+i*3);c.lineTo(204,147);c.closePath();c.fill();}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const decal=mesh(motorcycleRoot,`HondaWing${side}`,new THREE.PlaneGeometry(.103,.052),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}),side*.166,.96,.345);decal.rotation.y=side*Math.PI/2;
  }
  for(const side of [-1,1]) {
    rod(bikeFrontWheelPivot,`forkChrome${side}`,[side*.095,.08,-.03],[side*.095,.63,-.27],.021,chrome);
    rod(bikeFrontWheelPivot,`forkSlider${side}`,[side*.095,0,0],[side*.095,.32,-.137],.031,black);
    box(bikeFrontWheelPivot,`brakeCaliper${side}`,.048,.10,.056,black,side*.098,.04,-.115);
  }
  // Front fender follows the wheel pivot; upper circular arc, open below.
  const fenderMat=red.clone();fenderMat.side=THREE.DoubleSide;
  const fenderPoints=[],fenderIndices=[];
  for(let i=0;i<=40;i++){const a=-1.13+i/40*2.26;for(let j=0;j<=8;j++){const x=(j/8-.5)*.15;fenderPoints.push(x,Math.cos(a)*(.359-.01*(x/.075)**2),Math.sin(a)*.359);}}
  for(let i=0;i<40;i++)for(let j=0;j<8;j++){const a=i*9+j;fenderIndices.push(a,a+9,a+1,a+1,a+9,a+10);}
  const fenderGeometry=new THREE.BufferGeometry();fenderGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fenderPoints,3));fenderGeometry.setIndex(fenderIndices);fenderGeometry.computeVertexNormals();
  mesh(bikeFrontWheelPivot,'redFrontFender',fenderGeometry,fenderMat);
  box(motorcycleRoot,'rearMudguard',.14,.035,.27,black,0,.68,-.94).rotation.x=.5;
  box(motorcycleRoot,'plateBracket',.13,.15,.015,black,0,.69,-1.045).rotation.x=-.32;
  function makeBar(parent,label,y,z) {
    const g=group(parent,label);g.position.set(0,y,z);
    tube(g,'chromeHandlebar',[[-.36,0,-.06],[-.24,.014,-.04],[-.12,-.035,.025],[.12,-.035,.025],[.24,.014,-.04],[.36,0,-.06]],.012,chrome);
    for(const side of [-1,1]) {
      rod(g,`grip${side}`,[side*.26,.009,-.05],[side*.37,0,-.065],.022,rubber);
      box(g,`switchBlock${side}`,.045,.041,.052,black,side*.235,.013,-.04);
      tube(g,`lever${side}`,[[side*.21,.013,-.006],[side*.30,.019,.017],[side*.37,.014,-.005]],.0065,silver);
      rod(g,`mirrorStem${side}`,[side*.21,.027,-.006],[side*.31,.22,.025],.006,chrome);
      const mirror=ellipsoid(g,`ovalMirror${side}`,.05,.069,.014,chrome,side*.32,.255,.025);mirror.rotation.z=side*.23;
      const geo=new THREE.CircleGeometry(1,40);
      const mirrorSurface=named(Reflector?new Reflector(geo,{color:0xb6b6b6,textureWidth:256,textureHeight:256,multisample:0,clipBias:.001}):new THREE.Mesh(geo,material(0xa7bbc8,.08,.8)),`mirrorGlass${side}`);
      mirrorSurface.position.set(side*.32,.255,.005);mirrorSurface.scale.set(.044,.061,1);mirrorSurface.rotation.set(0,Math.PI,-side*.23);g.add(mirrorSurface);mirrorSurfaces.push(mirrorSurface);
      const bezel=mesh(g,`mirrorBezel${side}`,new THREE.RingGeometry(1,1.1,40),alloy,side*.32,.255,.003);
      bezel.scale.copy(mirrorSurface.scale);bezel.rotation.copy(mirrorSurface.rotation);
      if(Reflector){const reflect=mirrorSurface.onBeforeRender;mirrorSurface.onBeforeRender=function(renderer,scene,camera){
        if(camera.userData.skipCarMirrors)return;
        const visible=mirrorSurfaces.map(m=>m.visible),viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),test=renderer.getScissorTest();
        mirrorSurfaces.forEach(m=>{if(m!==mirrorSurface)m.visible=false;});renderer.setScissorTest(false);
        try{reflect.call(this,renderer,scene,camera);}finally{mirrorSurfaces.forEach((m,i)=>m.visible=visible[i]);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(test);}
      };}
    }
    box(g,'barClamp',.12,.037,.045,alloy,0,-.03,.026);
    return g;
  }
  const bikeHandlebar=makeBar(motorcycleRoot,'bikeHandlebar',1.035,.40);
  const headBucket=mesh(motorcycleRoot,'roundHeadlightBucket',new THREE.CylinderGeometry(.095,.092,.105,48),chrome,0,.947,.585);headBucket.rotation.x=Math.PI/2;
  const lampMat=new THREE.MeshStandardMaterial({color:0xf4f5ec,emissive:0xffffe1,emissiveIntensity:.5,roughness:.15});
  mesh(motorcycleRoot,'headlightLens',new THREE.CircleGeometry(.086,48),lampMat,0,.947,.64);
  mesh(motorcycleRoot,'headlightRim',new THREE.TorusGeometry(.09,.006,8,48),chrome,0,.947,.645);
  let speed=0,rpm=.22;const displays=[];
  function meter(parent,label,x,y,z,max,isRpm) {
    const g=group(parent,label);g.position.set(x,y,z);g.rotation.x=-.42;
    const bucket=mesh(g,'meterBucket',new THREE.CylinderGeometry(.068,.068,.065,32),black,0,0,.018);bucket.rotation.x=Math.PI/2;
    mesh(g,'chromeMeterRim',new THREE.TorusGeometry(.065,.005,8,40),chrome,0,0,-.019);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const dial=mesh(g,'instrumentFace',new THREE.CircleGeometry(.061,40),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),0,0,-.02);dial.rotation.y=Math.PI;
    displays.push({ctx,texture,max,isRpm});
    return g;
  }
  meter(motorcycleRoot,'speedometer',-.079,1.071,.515,180,false);meter(motorcycleRoot,'tachometer',.079,1.071,.515,13,true);
  // Same sculpted tank and detailed controls are used in the close rider view.
  const cockpitTank=tank.clone();cockpitTank.name='cockpitTank';cockpitTank.userData.partName='cockpitTank';cockpitTank.position.set(0,.16,.08);bikeCockpitRoot.add(cockpitTank);
  const cockpitCap=named(fuelCap.clone(),'cockpitFuelCap');cockpitCap.position.add(new THREE.Vector3(0,.16,.08));bikeCockpitRoot.add(cockpitCap);
  const bikeCockpitBar=makeBar(bikeCockpitRoot,'bikeCockpitBar',1.17,.52);
  meter(bikeCockpitRoot,'cockpitSpeedometer',-.083,1.205,.665,180,false);meter(bikeCockpitRoot,'cockpitTachometer',.083,1.205,.665,13,true);
  let old='';
  function updateBikeCockpit(ms,rpmRatio) {
    speed=Math.round(Math.abs(ms)*3.6);rpm=Math.round(rpmRatio*40)/40;const key=`${speed}/${rpm}`;if(key===old)return;old=key;
    for(const d of displays){const c=d.ctx;c.fillStyle='#10171d';c.fillRect(0,0,256,256);c.textAlign='center';
      for(let i=0;i<=12;i++){const a=Math.PI*(.75+1.5*i/12);c.strokeStyle=i>10?'#ee4a50':'#d7e3e9';c.lineWidth=i%2?2:4;c.beginPath();c.moveTo(128+Math.cos(a)*91,128+Math.sin(a)*91);c.lineTo(128+Math.cos(a)*109,128+Math.sin(a)*109);c.stroke();if(i%2===0){c.fillStyle='#e3eaef';c.font='15px sans-serif';c.fillText(String(Math.round(i/12*d.max)),128+Math.cos(a)*76,133+Math.sin(a)*76);}}
      const value=d.isRpm?rpm*12:speed,a=Math.PI*(.75+1.5*Math.min(value/d.max,1));c.strokeStyle='#ff5147';c.lineWidth=4;c.beginPath();c.moveTo(128,128);c.lineTo(128+Math.cos(a)*90,128+Math.sin(a)*90);c.stroke();c.fillStyle='#c5d7df';c.font='14px sans-serif';c.fillText(d.isRpm?'×1000':'km/h',128,176);c.fillStyle='#172c31';c.fillRect(94,189,68,25);c.fillStyle='#b6e2d4';c.font='18px monospace';c.fillText(d.isRpm?String(Math.round(rpm*12000)):String(speed),128,208);d.texture.needsUpdate=true;}
  }
  updateBikeCockpit(0,.22);
  function signal(label,x,y,z,color,w=.056) {
    const mat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.02,roughness:.25});const m=box(motorcycleRoot,label,w,.034,.036,mat,x,y,z);
    const light=new THREE.PointLight(color,0,3.5,2);light.position.copy(m.position);motorcycleRoot.add(light);return {mesh:m,light};
  }
  const bikeSignalLamps={left:[signal('frontLeftSignal',.16,.905,.584,0xffa52a),signal('rearLeftSignal',.16,.78,-.985,0xffa52a)],right:[signal('frontRightSignal',-.16,.905,.584,0xffa52a),signal('rearRightSignal',-.16,.78,-.985,0xffa52a)]};
  const bikeBrakeLamp=signal('tailLamp',0,.849,-1.012,0xe51b2b,.16);
  return {motorcycleRoot,bikeCockpitRoot,bikeCockpitBar,bikeHandlebar,bikeFrontWheelPivot,bikeFrontWheelAssembly,bikeRearWheelAssembly,bikeRearWheelMount,bikeSignalLamps,bikeBrakeLamp,updateBikeCockpit};
}
