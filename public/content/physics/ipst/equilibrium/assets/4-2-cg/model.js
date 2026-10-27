/* Uniform thin rigid laminas. Coordinates in metres, x right / y down.
   No external dependencies; shared by the activity and its numerical tests. */
const CGLabModel = (() => {
  const shapes = [
    {id:'irregular', th:'แผ่นไม่สมมาตร', en:'Irregular lamina',
      points:[[0,0],[.19,.01],[.28,.10],[.23,.25],[.10,.29],[-.03,.16]],
      holes:[[.018,.018],[.255,.105],[.108,.268]]},
    {id:'triangle',th:'แผ่นสามเหลี่ยม',en:'Triangle',
      points:[[.03,0],[.29,.26],[0,.26]],holes:[[.032,.028],[.257,.245],[.018,.243]]},
    {id:'ell',th:'แผ่นรูปตัว L',en:'L-shaped lamina',
      points:[[0,0],[.28,0],[.28,.08],[.08,.08],[.08,.28],[0,.28]],
      holes:[[.018,.018],[.259,.039],[.039,.259]]}
  ];
  function properties(points) {
    let twiceArea=0,cx=0,cy=0,integral=0;
    points.forEach(([x,y],i)=>{
      const [u,v]=points[(i+1)%points.length],cross=x*v-u*y;
      twiceArea+=cross;cx+=(x+u)*cross;cy+=(y+v)*cross;
      integral+=cross*(x*x+x*u+u*u+y*y+y*v+v*v);
    });
    const signedArea=twiceArea/2;
    if(Math.abs(signedArea)<1e-12)throw Error('Degenerate polygon');
    const center={x:cx/(6*signedArea),y:cy/(6*signedArea)};
    return {area:Math.abs(signedArea),center,inertia:integral/(12*signedArea)-center.x**2-center.y**2};
  }
  const rotate=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function suspension(shape,hole) {
    const {center,inertia}=properties(shape.points),[x,y]=shape.holes[hole];
    const delta={x:center.x-x,y:center.y-y},distance=Math.hypot(delta.x,delta.y);
    return {center,pivot:{x,y},delta,distance,inertia:inertia+distance**2,equilibrium:Math.atan2(delta.x,delta.y)};
  }
  function acceleration(shape,hole,angle,omega,damping=2.6,g=9.81) {
    const p=suspension(shape,hole);
    return g*rotate(p.delta,angle).x/p.inertia-damping*omega;
  }
  function step(shape,hole,s,dt,damping=2.6,g=9.81) {
    // RK4 for theta'=omega and I_p theta''=mg*r_x - b*omega.
    const f=([a,w])=>[w,acceleration(shape,hole,a,w,damping,g)];
    const v=[s.angle,s.omega],k1=f(v),k2=f(v.map((x,i)=>x+dt*k1[i]/2));
    const k3=f(v.map((x,i)=>x+dt*k2[i]/2)),k4=f(v.map((x,i)=>x+dt*k3[i]));
    return {angle:wrap(v[0]+dt*(k1[0]+2*k2[0]+2*k3[0]+k4[0])/6),omega:v[1]+dt*(k1[1]+2*k2[1]+2*k3[1]+k4[1])/6};
  }
  function energy(shape,hole,s,g=9.81) {
    const p=suspension(shape,hole);
    return .5*p.inertia*s.omega**2-g*rotate(p.delta,s.angle).y;
  }
  function mark(shape,hole,angle) {
    return {hole,angle:wrap(angle),point:{x:shape.holes[hole][0],y:shape.holes[hole][1]},direction:{x:Math.sin(angle),y:Math.cos(angle)}};
  }
  function intersection(a,b) {
    const det=a.direction.x*b.direction.y-a.direction.y*b.direction.x;
    if(Math.abs(det)<1e-5)return null;
    const dx=b.point.x-a.point.x,dy=b.point.y-a.point.y;
    const t=(dx*b.direction.y-dy*b.direction.x)/det;
    return {x:a.point.x+t*a.direction.x,y:a.point.y+t*a.direction.y};
  }
  function inside(points,p) {
    let yes=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const [xi,yi]=points[i],[xj,yj]=points[j];
      if((yi>p.y)!==(yj>p.y)&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)yes=!yes;
    }
    return yes;
  }
  return {shapes,properties,rotate,wrap,suspension,acceleration,step,energy,mark,intersection,inside};
})();
globalThis.CGLabModel=CGLabModel;
