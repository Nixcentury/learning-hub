/* SI units; +x right and +y up, unless explicitly using the slope coordinate. */
const Equilibrium43Model = (() => {
  const rad = d => d * Math.PI / 180;
  const vector = (magnitude, angle) => ({x:magnitude*Math.cos(rad(angle)),y:magnitude*Math.sin(rad(angle))});
  const sum = forces => forces.reduce((a,b)=>({x:a.x+b.x,y:a.y+b.y}),{x:0,y:0});
  const magnitude = f => Math.hypot(f.x,f.y);
  const balanced = f => magnitude(f)<1e-8;
  function advance(body,force,mass,dt) {
    if (!(mass>0 && dt>=0 && Number.isFinite(dt))) throw Error('Invalid step');
    const ax=force.x/mass,ay=force.y/mass;
    return {x:body.x+body.vx*dt+.5*ax*dt*dt,y:body.y+body.vy*dt+.5*ay*dt*dt,vx:body.vx+ax*dt,vy:body.vy+ay*dt};
  }
  const table = (mass=2,press=0,g=10) => ({weight:mass*g,press,normal:mass*g+press});
  function ropes(weight,alpha,beta) {
    if (!(weight>0 && alpha>0 && alpha<90 && beta>0 && beta<90)) throw Error('Invalid rope setup');
    const denominator=Math.sin(rad(alpha+beta));
    const left=weight*Math.cos(rad(beta))/denominator,right=weight*Math.cos(rad(alpha))/denominator;
    return {left,right,forces:[vector(left,180-alpha),vector(right,beta),{x:0,y:-weight}]};
  }
  function incline(angle,mass=2,muStatic=.5,muKinetic=.3,g=10) {
    const normal=mass*g*Math.cos(rad(angle)),down=mass*g*Math.sin(rad(angle)),limit=muStatic*normal;
    const resting=down<=limit+1e-10,friction=resting?down:muKinetic*normal;
    return {normal,down,limit,friction,resting,acceleration:(down-friction)/mass,weight:mass*g};
  }
  return {rad,vector,sum,magnitude,balanced,advance,table,ropes,incline};
})();
