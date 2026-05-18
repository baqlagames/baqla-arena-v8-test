export function createArenaAudio() {
  // =====================
  // SOUND SYSTEM Ã¢â‚¬â€ Web Audio procedural SFX (no files needed)
  // =====================
  let _audioCtx=null,_sfxGain=null,_sfxMuted=true,_sfxVol=0.25;
  function _initAudio(){
    if(_audioCtx)return;
    try{
      _audioCtx=new(window.AudioContext||window.webkitAudioContext)();
      _sfxGain=_audioCtx.createGain();
      _sfxGain.gain.value=_sfxVol;
      _sfxGain.connect(_audioCtx.destination);
    }catch(e){_audioCtx=null}
  }
  function _resumeAudio(){if(_audioCtx&&_audioCtx.state==='suspended')_audioCtx.resume()}
  document.addEventListener('pointerdown',()=>{_initAudio();_resumeAudio()},{once:false});
  document.addEventListener('keydown',()=>{_initAudio();_resumeAudio()},{once:false});

  function _playTone(freq,dur,type,vol,ramp){
    if(!_audioCtx||_sfxMuted)return;
    const o=_audioCtx.createOscillator(),g=_audioCtx.createGain();
    o.type=type||'sine';o.frequency.value=freq;
    g.gain.value=(vol||0.3)*_sfxVol;
    if(ramp)g.gain.exponentialRampToValueAtTime(0.001,_audioCtx.currentTime+dur);
    else{g.gain.setValueAtTime((vol||0.3)*_sfxVol,_audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(0,_audioCtx.currentTime+dur)}
    o.connect(g);g.connect(_sfxGain);
    o.start(_audioCtx.currentTime);o.stop(_audioCtx.currentTime+dur);
  }
  function _playNoise(dur,vol,filter,filterFreq){
    if(!_audioCtx||_sfxMuted)return;
    const bufSz=Math.floor(_audioCtx.sampleRate*dur);
    const buf=_audioCtx.createBuffer(1,bufSz,_audioCtx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<bufSz;i++)d[i]=(Math.random()*2-1);
    const src=_audioCtx.createBufferSource();src.buffer=buf;
    const g=_audioCtx.createGain();
    g.gain.setValueAtTime((vol||0.2)*_sfxVol,_audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0,_audioCtx.currentTime+dur);
    if(filter){
      const f=_audioCtx.createBiquadFilter();f.type=filter;f.frequency.value=filterFreq||1000;
      src.connect(f);f.connect(g);
    }else{src.connect(g)}
    g.connect(_sfxGain);src.start();
  }

  const SFX={
    // Melee attacks
    slash(){_playNoise(0.08,0.15,'highpass',2000);_playTone(200,0.06,'sawtooth',0.08)},
    heavySlash(){_playNoise(0.12,0.2,'highpass',1500);_playTone(150,0.1,'sawtooth',0.12)},
    shieldBash(){_playNoise(0.1,0.25,'lowpass',800);_playTone(120,0.15,'square',0.1)},
    // Ranged attacks
    arrowShot(){_playTone(800,0.06,'sine',0.1);_playTone(1200,0.04,'sine',0.06)},
    boltFire(){_playTone(600,0.08,'triangle',0.1);_playNoise(0.05,0.08,'highpass',3000)},
    // Magic
    fireball(){_playTone(300,0.2,'sawtooth',0.12);_playNoise(0.15,0.15,'lowpass',600);_playTone(150,0.3,'sine',0.06)},
    frostBolt(){_playTone(1200,0.15,'sine',0.1);_playTone(900,0.2,'triangle',0.06)},
    lightning(){_playNoise(0.04,0.3,'highpass',4000);_playTone(80,0.08,'square',0.15);_playNoise(0.06,0.2,'bandpass',2500)},
    holyLight(){_playTone(523,0.15,'sine',0.12);_playTone(659,0.15,'sine',0.08);_playTone(784,0.2,'sine',0.06)},
    shadowMagic(){_playTone(100,0.25,'sawtooth',0.1);_playTone(80,0.3,'square',0.06)},
    natureMagic(){_playTone(440,0.15,'sine',0.08);_playTone(554,0.12,'triangle',0.06);_playTone(659,0.1,'sine',0.04)},
    // Abilities
    explosion(){_playNoise(0.3,0.35,'lowpass',400);_playTone(60,0.4,'sine',0.2)},
    heal(){_playTone(660,0.12,'sine',0.1);_playTone(880,0.15,'sine',0.07);_playTone(1100,0.1,'sine',0.04)},
    bigHeal(){_playTone(523,0.15,'sine',0.12);_playTone(784,0.2,'sine',0.1);_playTone(1047,0.25,'sine',0.08)},
    buff(){_playTone(440,0.1,'triangle',0.08);_playTone(660,0.12,'triangle',0.06);_playTone(880,0.08,'sine',0.04)},
    debuff(){_playTone(300,0.2,'sawtooth',0.08);_playTone(200,0.25,'square',0.05)},
    // Tank
    taunt(){_playTone(100,0.2,'square',0.15);_playTone(80,0.25,'sawtooth',0.1);_playNoise(0.1,0.12,'lowpass',500)},
    shieldBlock(){_playNoise(0.06,0.2,'bandpass',1200);_playTone(300,0.08,'square',0.1)},
    cheatDeath(){_playTone(200,0.4,'sine',0.15);_playTone(400,0.35,'sine',0.1);_playTone(800,0.3,'sine',0.08);_playNoise(0.2,0.15,'highpass',3000)},
    // Rogue
    stealth(){_playNoise(0.15,0.08,'highpass',5000);_playTone(2000,0.1,'sine',0.03)},
    backstab(){_playNoise(0.06,0.25,'highpass',3000);_playTone(400,0.05,'sawtooth',0.15)},
    // Summoner
    summon(){_playTone(200,0.2,'triangle',0.1);_playTone(300,0.15,'sine',0.08);_playNoise(0.1,0.06,'lowpass',400)},
    // Boss
    bossSlam(){_playNoise(0.25,0.35,'lowpass',300);_playTone(50,0.5,'sine',0.25);_playTone(40,0.6,'square',0.1)},
    bossRoar(){_playTone(80,0.5,'sawtooth',0.2);_playTone(60,0.6,'square',0.12);_playNoise(0.3,0.2,'lowpass',500)},
    meteor(){_playTone(800,0.1,'sine',0.08);_playTone(200,0.3,'sine',0.15);_playNoise(0.25,0.3,'lowpass',500)},
    // UI
    levelUp(){_playTone(523,0.1,'sine',0.12);_playTone(659,0.1,'sine',0.1);_playTone(784,0.1,'sine',0.08);_playTone(1047,0.15,'sine',0.06)},
    purchase(){_playTone(800,0.08,'triangle',0.1);_playTone(1000,0.06,'sine',0.08)},
    waveStart(){_playTone(440,0.15,'triangle',0.1);_playTone(554,0.12,'triangle',0.08);_playTone(660,0.1,'sine',0.06)},
    victory(){_playTone(523,0.15,'sine',0.12);_playTone(659,0.15,'sine',0.1);_playTone(784,0.15,'sine',0.08);_playTone(1047,0.2,'sine',0.06)},
    defeat(){_playTone(300,0.3,'sawtooth',0.1);_playTone(200,0.4,'sawtooth',0.08);_playTone(100,0.5,'sine',0.12)},
    cobraStrike(){_playTone(1200,0.04,'sine',0.1);_playTone(800,0.06,'sine',0.12);_playNoise(0.08,0.15,'bandpass',3000);_playTone(400,0.1,'sawtooth',0.08)},
    poison(){_playTone(300,0.15,'sine',0.06);_playNoise(0.1,0.08,'highpass',4000);_playTone(250,0.2,'triangle',0.04)},
    chainLightning(){_playNoise(0.03,0.3,'highpass',5000);_playTone(100,0.05,'square',0.2);_playNoise(0.04,0.25,'bandpass',3000);_playTone(60,0.06,'square',0.15)},
    roar(){_playTone(90,0.3,'sawtooth',0.2);_playTone(70,0.4,'square',0.1);_playNoise(0.15,0.15,'lowpass',400)},
    bladeStorm(){_playNoise(0.1,0.15,'bandpass',2000);_playTone(500,0.08,'sawtooth',0.1);_playTone(700,0.06,'sawtooth',0.08)},
    fanOfKnives(){_playNoise(0.06,0.2,'highpass',3000);_playTone(1000,0.04,'sine',0.08);_playTone(1500,0.03,'sine',0.06)},
    drainLife(){_playTone(180,0.3,'sine',0.08);_playTone(220,0.25,'triangle',0.06)},
    resurrect(){_playTone(400,0.2,'sine',0.15);_playTone(600,0.2,'sine',0.12);_playTone(800,0.2,'sine',0.1);_playTone(1200,0.3,'sine',0.08)},
  };

  function toggleSound() {
    _sfxMuted=!_sfxMuted;
    _initAudio();
    _resumeAudio();
    return _sfxMuted;
  }

  function isMuted() {
    return _sfxMuted;
  }

  return { sfx:SFX, toggleSound, isMuted };
}
