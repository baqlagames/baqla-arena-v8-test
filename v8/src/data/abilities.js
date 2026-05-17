// Selected active ability data.

export const ARENA_ABILITIES=[
  {id:0,name:'Mortar Strike',desc:'AoE explosion at target area',color:'#ff6600',cost:60,radius:80,damage:180,target:'pos'},
  {id:1,name:'Frost Nova',desc:'Slow all enemies 50% for 6s',color:'#00ccff',cost:55,slowMult:0.5,slowDur:360,target:'self'},
  {id:2,name:'Healing Tide',desc:'Heal all units 40% HP',color:'#2ecc71',cost:60,healPct:0.40,target:'self'},
  {id:3,name:'Lightning Bolt',desc:'280 dmg + chains to 2 enemies',color:'#ffd700',cost:55,damage:280,chainCount:2,chainDmg:120,target:'auto'},
  {id:4,name:'War Drums',desc:'+50% atk speed for 8s',color:'#ff4444',cost:65,atkSpdBoost:1.5,duration:480,target:'self'},
  {id:5,name:'Crystal Surge',desc:'Instantly gain +3 crystals',color:'#9b59b6',cost:45,crystalGain:3,target:'self'}
];
