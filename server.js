// TECNO VENTAS MULTIJUGADOR — servidor de salas WebSocket, sin dependencias externas.
// Node.js 20+ | npm start
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const PORT = Number(process.env.PORT || 3000);
const CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rand=(n=16)=>crypto.randomBytes(n).toString('hex');
const shuffle=(a)=>{let b=[...a];for(let i=b.length-1;i>0;i--){const j=crypto.randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
const sanitize=(v,max=34)=>String(v||'').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,max);
const rooms=new Map();
const QUIZ=[
 ['¿Qué herramienta registra contactos y seguimientos comerciales?',['CRM','GPS','USB','PDF'],0,'El CRM organiza información e interacciones con clientes.'],
 ['¿Qué permite vender en cualquier momento desde internet?',['Tienda virtual','Solo vitrina física','Volante impreso','Catálogo sin contacto'],0,'La tienda virtual recibe pedidos sin depender del horario de un local.'],
 ['¿Qué canal ayuda a mostrar productos y conversar con compradores?',['Redes sociales','Calculadora','Antivirus','Impresora'],0,'Las redes sociales facilitan visibilidad y conversación.'],
 ['¿Qué tecnología responde preguntas frecuentes automáticamente?',['Chatbot','Código de barras','Escáner','Cable HDMI'],0,'Un chatbot puede atender consultas repetitivas.'],
 ['¿Cuál es una ventaja del comercio electrónico?',['Llegar a más clientes','Cerrar la tienda más temprano','Evitar todo contacto','Eliminar devoluciones'],0,'El comercio electrónico amplía el alcance geográfico.'],
 ['¿Qué ventaja aporta automatizar recordatorios comerciales?',['Ahorrar tiempo','Perder seguimientos','Duplicar errores','Borrar datos'],0,'La automatización reduce tareas repetitivas.'],
 ['¿Qué riesgo existe al depender solo de herramientas digitales?',['Caídas del sistema','Más conversación directa','Menos conexión necesaria','Cero fraudes'],0,'Las fallas técnicas pueden interrumpir ventas y atención.'],
 ['¿Qué es conveniente para proteger datos de clientes?',['Contraseñas seguras','Compartir claves','Enlaces desconocidos','Publicar teléfonos'],0,'La seguridad y la privacidad deben acompañar el comercio digital.'],
 ['¿Qué hace la IA al analizar compras anteriores?',['Detectar patrones','Crear productos físicos','Garantizar ventas','Eliminar la competencia'],0,'Puede encontrar tendencias que ayuden a decidir.'],
 ['¿Qué indica la tasa de conversión?',['Porcentaje de visitas que compran','Total de seguidores','Número de empleados','Precio de cada producto'],0,'Mide cuántas visitas realizan la acción buscada.'],
 ['¿Qué debe hacer una empresa ante comentarios de clientes?',['Responder y aprender','Ignorarlos siempre','Eliminar toda crítica','Desactivar la tienda'],0,'Escuchar y responder mejora el servicio.'],
 ['¿Para qué sirve segmentar una campaña digital?',['Llegar al público adecuado','Publicar sin estrategia','Usar menos información','Enviar todo a todos'],0,'La segmentación adapta mensajes a distintos públicos.'],
 ['¿Cuál es una función habitual del CRM?',['Registrar oportunidades','Fabricar embalajes','Lavar productos','Hacer entregas físicas'],0,'Los CRM ayudan a seguir negocios potenciales.'],
 ['¿Qué facilita un pago digital seguro?',['Completar compras en línea','Evitar el envío','Impedir atención','Desactivar inventarios'],0,'Los medios de pago confiables facilitan la compra.'],
 ['¿Qué puede pasar si un algoritmo toma malas decisiones?',['Recomendaciones inadecuadas','Atención perfecta','Riesgo cero','Clientes garantizados'],0,'La IA necesita supervisión humana y datos adecuados.'],
 ['¿Qué ayuda a fidelizar clientes en canales digitales?',['Atención y seguimiento','Mensajes invasivos','Ocultar información','Cambiar precios sin avisar'],0,'Una atención consistente construye confianza.'],
 ['¿Qué red es útil para mostrar productos con fotografías y videos?',['Instagram','Bloc de notas','Reloj','Explorador de archivos'],0,'Las plataformas visuales sirven para mostrar productos.'],
 ['¿Qué permite medir una tienda en línea?',['Visitas y pedidos','Solo el color del logo','Solo el horario laboral','El clima exacto'],0,'Las métricas permiten evaluar resultados comerciales.'],
 ['¿Qué debe conservar una empresa pese a la automatización?',['Trato humano','Respuestas sin revisión','Contraseñas públicas','Solo mensajes masivos'],0,'La tecnología complementa, no sustituye por completo, la empatía.'],
 ['¿Cuál es una barrera para algunos clientes digitales?',['Falta de conexión','Tener más opciones','Comparar precios','Ver horarios'],0,'No todos tienen igual acceso a internet o dispositivos.']
];
const WORDS=[
 ['CRM','Sistema que ayuda a gestionar clientes'],['REDES','Espacios digitales para promocionar productos'],
 ['BOT','Programa que responde de forma automática'],['WEB','Página donde se puede ofrecer productos'],
 ['APP','Aplicación instalada en el celular'],['PAGO','Acción de entregar dinero por una compra'],
 ['DATOS','Información usada para conocer compradores'],['CLAVE','Protege el acceso a una cuenta'],
 ['ENVIO','Entrega de lo comprado en internet'],['TIENDA','Lugar virtual para comprar y vender'],
 ['VENTAS','Actividad comercial que genera ingresos'],['CLICK','Pulsación sobre un enlace'],
 ['NUBE','Servicios para guardar información online'],['FRAUDE','Engaño que puede ocurrir en internet'],
 ['CHAT','Conversación por mensajes en tiempo real'],['IA','Tecnología para aprender de datos y asistir tareas']
];
const PUZZLES=[
 ['CHATBOT',['CHAT','BOT'],'Asistente que contesta preguntas frecuentes','Un chatbot automatiza conversaciones habituales.'],
 ['CRM',['C','R','M'],'Herramienta para organizar la relación con clientes','El CRM permite recordar ventas, datos y seguimientos.'],
 ['TIENDA',['TIEN','DA'],'Página o espacio digital donde se compran productos','Las tiendas virtuales muestran catálogos y reciben pedidos.'],
 ['REDES',['RE','DES'],'Canales sociales para dar a conocer un producto','Las redes facilitan conversar y conectar con compradores.'],
 ['PAGOS',['PA','GOS'],'Transacciones que finalizan una compra','Los pagos digitales pueden hacer más cómoda la compra.'],
 ['DATOS',['DA','TOS'],'Información que se analiza para vender mejor','Los datos requieren cuidado y uso responsable.'],
 ['VENTAS',['VEN','TAS'],'Resultado que busca un proceso comercial','El proceso comercial comprende captar, atender y fidelizar.'],
 ['FRAUDE',['FRA','UDE'],'Riesgo de engaño en compras por internet','La verificación de enlaces y pagos reduce riesgos.'],
 ['NUBE',['NU','BE'],'Lugar virtual donde se almacenan archivos','La nube facilita acceder a información desde varios dispositivos.'],
 ['ENVIO',['EN','VIO'],'Entrega del pedido al comprador','La logística es clave para la experiencia de compra.'],
 ['CLIENTE',['CLI','EN','TE'],'Persona que compra bienes o servicios','Conocer al cliente ayuda a atenderlo mejor.'],
 ['SEGURIDAD',['SE','GU','RI','DAD'],'Protección de cuentas y datos digitales','La protección de datos fortalece la confianza.']
];
const MEMORIES=[
 ['CRM','Organiza información de clientes'],['Chatbot','Contesta preguntas automáticamente'],
 ['IA','Analiza información y encuentra patrones'],['E-commerce','Compra y venta por internet'],
 ['Redes','Difunden contenido y conectan clientes'],['Contraseña','Protege el acceso a una cuenta'],
 ['Automatización','Ejecuta tareas repetitivas'],['Analítica','Mide resultados de una campaña'],
 ['Phishing','Engaño para robar información'],['Tienda virtual','Recibe pedidos en línea']
];
function makeGrid(){
 const N=12,grid=Array.from({length:N},()=>Array(N).fill(''));
 const directions=[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
 const selected=shuffle(WORDS.filter(([w])=>w.length<=8)).slice(0,5),placements=[];
 for(const [word,hint] of selected){
   let found=null;
   for(let attempt=0;attempt<250&&!found;attempt++){
     const [dr,dc]=directions[crypto.randomInt(directions.length)],r=crypto.randomInt(N),c=crypto.randomInt(N);
     const cells=[];let okay=true;
     for(let i=0;i<word.length;i++){
       const y=r+i*dr,x=c+i*dc;if(y<0||x<0||y>=N||x>=N||(grid[y][x]&&grid[y][x]!==word[i])){okay=false;break;}cells.push([y,x]);
     }
     if(okay)found=cells;
   }
   if(!found)continue;
   found.forEach(([r,c],i)=>grid[r][c]=word[i]);
   placements.push({word,hint,cells:found});
 }
 const letters='ABCDEFGHIJKLMNOPRSTUVWXYZ';
 for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!grid[r][c])grid[r][c]=letters[crypto.randomInt(letters.length)];
 return {board:grid.map(r=>r.join('')),placements};
}
function prepareRound(kind,number){
 const seconds=kind==='quiz'?24:kind==='search'?105:kind==='puzzle'?105:90;
 const round={kind,number,seconds,startedAt:Date.now(),endsAt:Date.now()+seconds*1000};
 if(kind==='quiz'){
  const q=QUIZ[(number*7+crypto.randomInt(QUIZ.length))%QUIZ.length];
  const options=shuffle(q[1].map((text,i)=>({text,isCorrect:i===q[2]})));
  round.question=q[0];round.options=options.map(o=>o.text);round.correct=options.findIndex(o=>o.isCorrect);round.explanation=q[3];
 }
 if(kind==='search')Object.assign(round,makeGrid());
 if(kind==='puzzle')round.puzzles=shuffle(PUZZLES).slice(0,4).map(([answer,parts,hint,note])=>({answer,hint,note,parts:shuffle(parts)}));
 if(kind==='memory'){
   round.cards=shuffle(shuffle(MEMORIES).slice(0,5).flatMap(([term,desc],i)=>[
    {key:i,text:term,side:'term'},{key:i,text:desc,side:'definition'}
   ]));
 }
 return round;
}
function newProgress(){return {answered:false,selected:null,found:[],solved:[],matched:[],matchedIndices:[],mistakes:0};}
function scoreTable(room){return [...room.players.values()].sort((a,b)=>b.score-a.score||a.joined-b.joined).map((p,i)=>({id:p.id,name:p.name,score:p.score,rank:i+1,online:!!p.ws&&!p.ws.dead,completed:p.done}));}
function publicRound(room){const r=room.round;if(!r)return null;const base={kind:r.kind,number:r.number,seconds:r.seconds,startedAt:r.startedAt,endsAt:r.endsAt};
 if(r.kind==='quiz')Object.assign(base,{question:r.question,options:r.options,...(room.phase!=='playing'?{correct:r.correct,explanation:r.explanation}:{})});
 if(r.kind==='search')Object.assign(base,{board:r.board,clues:r.placements.map(x=>({word:x.word,hint:x.hint,length:x.word.length}))});
 if(r.kind==='puzzle')base.puzzles=r.puzzles.map(x=>({hint:x.hint,parts:x.parts,...(room.phase!=='playing'?{answer:x.answer,note:x.note}:{})}));
 if(r.kind==='memory'){base.cards=r.cards.map((x,i)=>({index:i,text:x.text,side:x.side}));if(room.phase!=='playing')base.pairs=[...new Set(r.cards.map(x=>x.key))].map(k=>({term:r.cards.find(x=>x.key===k&&x.side==='term').text,definition:r.cards.find(x=>x.key===k&&x.side==='definition').text}));}
 return base;
}
function progressFor(p){return {answered:p.progress.answered,selected:p.progress.selected,found:p.progress.found,solved:p.progress.solved,matched:p.progress.matched,matchedIndices:p.progress.matchedIndices,mistakes:p.progress.mistakes};}
function snapshot(room,viewer){return {room:room.code,role:viewer.role,playerId:viewer.pid||null,hostOnline:!!room.host.ws&&!room.host.ws.dead,phase:room.phase,mode:room.mode,roundNumber:Math.max(0,room.index+1),totalRounds:room.playlist.length,round:publicRound(room),players:scoreTable(room),me:viewer.role==='player'?progressFor(room.players.get(viewer.pid)):null,serverNow:Date.now()};}
function roomBroadcast(room){if(room.host.ws)send(room.host.ws,{type:'sync',state:snapshot(room,{role:'host'})});for(const p of room.players.values())if(p.ws)send(p.ws,{type:'sync',state:snapshot(room,{role:'player',pid:p.id})});}
function emitError(ws,msg){send(ws,{type:'error',message:msg});}
function finishRound(room){if(room.phase!=='playing')return;room.phase='results';clearTimeout(room.timer);room.round.endedAt=Date.now();roomBroadcast(room);}
function checkDone(room){if(room.phase!=='playing')return;const online=[...room.players.values()].filter(p=>p.ws&&!p.ws.dead);if(!online.length)return;
 const all=online.every(p=>p.done);
 if(all) setTimeout(()=>{if(room.phase==='playing'&&[...room.players.values()].filter(p=>p.ws&&!p.ws.dead).every(p=>p.done))finishRound(room);},800);
}
function startRound(room){room.phase='playing';room.round=prepareRound(room.playlist[room.index],room.index);
 for(const p of room.players.values()){p.progress=newProgress();p.done=false;}
 clearTimeout(room.timer);room.timer=setTimeout(()=>finishRound(room),room.round.seconds*1000+150);
 roomBroadcast(room);
}
function uniqRoom(){let code='';do{code=Array.from({length:6},()=>CHARS[crypto.randomInt(CHARS.length)]).join('');}while(rooms.has(code));return code;}
const now=()=>Date.now();
function playerUpdate(room,p,kind,body){
 if(room.phase!=='playing'||room.round.kind!==kind||now()>room.round.endsAt||p.done)return {bad:'Esta prueba ya terminó.'};
 const r=room.round,prog=p.progress,elapsed=Math.max(0,r.endsAt-now()),speed=Math.floor((elapsed/(r.seconds*1000))*150);
 if(kind==='quiz'){
  if(prog.answered)return {bad:'Ya respondiste esta pregunta.'};
  const answer=Number(body.answer);if(!Number.isInteger(answer)||answer<0||answer>3)return {bad:'Respuesta no válida.'};
  prog.answered=true;prog.selected=answer;p.done=true;
  if(answer===r.correct){const points=700+speed;p.score+=points;return {ok:true,correct:true,points,text:'¡Respuesta correcta!'};}
  prog.mistakes++;return {ok:true,correct:false,points:0,text:'Respuesta recibida. Espera los resultados.'};
 }
 if(kind==='search'){
  const a=body.start,b=body.end;
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==2||b.length!==2||![...a,...b].every(n=>Number.isInteger(n)&&n>=0&&n<12))return {bad:'Selección no válida.'};
  const match=r.placements.find(x=>!prog.found.includes(x.word)&&((x.cells[0][0]===a[0]&&x.cells[0][1]===a[1]&&x.cells.at(-1)[0]===b[0]&&x.cells.at(-1)[1]===b[1])||(x.cells[0][0]===b[0]&&x.cells[0][1]===b[1]&&x.cells.at(-1)[0]===a[0]&&x.cells.at(-1)[1]===a[1])));
  if(!match)return {bad:'Esa selección no corresponde a una palabra pendiente.'};
  prog.found.push(match.word);prog.matchedIndices.push(...match.cells.map(([y,x])=>y*12+x));let points=220+Math.floor(speed/5);p.score+=points;p.done=prog.found.length===r.placements.length;return {ok:true,correct:true,points,text:`¡Encontraste ${match.word}!`};
 }
 if(kind==='puzzle'){
  const ix=Number(body.index),answer=sanitize(body.answer,50).toUpperCase().replace(/\s+/g,'');
  if(!Number.isInteger(ix)||ix<0||ix>=r.puzzles.length||prog.solved.includes(ix))return {bad:'Reto no válido.'};
  if(answer!==r.puzzles[ix].answer){prog.mistakes++;return {ok:true,correct:false,points:0,text:'Todavía no. Intenta ordenar las piezas otra vez.'};}
  prog.solved.push(ix);let points=260+Math.floor(speed/4);p.score+=points;p.done=prog.solved.length===r.puzzles.length;return {ok:true,correct:true,points,text:`¡Bien! ${answer}. ${r.puzzles[ix].note}`};
 }
 if(kind==='memory'){
   const a=Number(body.a),b=Number(body.b);
   if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=10||b>=10||a===b)return {bad:'Cartas no válidas.'};
   const x=r.cards[a],y=r.cards[b];if(prog.matched.includes(x.key)||prog.matched.includes(y.key))return {bad:'Esas cartas ya están resueltas.'};
   if(x.key!==y.key){prog.mistakes++;return {ok:true,correct:false,points:0,text:'No son pareja. ¡Prueba con otras!'};}
   prog.matched.push(x.key);prog.matchedIndices.push(a,b);let points=240+Math.floor(speed/4);p.score+=points;p.done=prog.matched.length===5;return {ok:true,correct:true,points,text:'¡Pareja encontrada!'};
 }
 return {bad:'Juego no reconocido.'};
}
function handle(ws,msg){
 if(!msg||typeof msg!=='object'||Array.isArray(msg))return;
 if(!ws.initialized&& !['create','join','resume'].includes(msg.type))return emitError(ws,'Primero crea una sala o únete a una.');
 if(msg.type==='create'){
  if(ws.initialized)return emitError(ws,'Ya estás en una sala. Recarga para crear otra.');
  const code=uniqRoom(),token=rand();const room={code,host:{token,ws},players:new Map(),phase:'lobby',mode:'circuit',playlist:[],index:-1,round:null,timer:null,created:now()};
  rooms.set(code,room);ws.initialized={code,role:'host'};send(ws,{type:'identity',role:'host',room:code,token});roomBroadcast(room);return;
 }
 if(msg.type==='join'){
  if(ws.initialized)return emitError(ws,'Ya estás dentro de una sala.');
  const code=sanitize(msg.room,7).toUpperCase();const room=rooms.get(code);if(!room)return emitError(ws,'No encontramos esa sala. Revisa el código.');
  if(room.players.size>=80)return emitError(ws,'La sala alcanzó el máximo de 80 jugadores.');
  let name=sanitize(msg.name,22)||'Participante';const names=new Set([...room.players.values()].map(p=>p.name.toLowerCase()));if(names.has(name.toLowerCase()))name=(name.slice(0,17)+' '+(room.players.size+1));
  const id=rand(6),token=rand(),player={id,token,name,ws,joined:now(),score:0,progress:newProgress(),done:false};room.players.set(id,player);
  ws.initialized={code,role:'player',pid:id};send(ws,{type:'identity',role:'player',room:code,token,pid:id,name});roomBroadcast(room);return;
 }
 if(msg.type==='resume'){
  const code=sanitize(msg.room,7).toUpperCase(),room=rooms.get(code),token=sanitize(msg.token,90);
  if(!room)return emitError(ws,'La sala ya no está disponible. Crea una nueva o vuelve a unirte.');
  if(token===room.host.token){if(room.host.ws&&room.host.ws!==ws){room.host.ws.initialized=null;room.host.ws.close();}room.host.ws=ws;ws.initialized={code,role:'host'};send(ws,{type:'identity',role:'host',room:code,token});roomBroadcast(room);return;}
  const player=[...room.players.values()].find(p=>p.token===token);
  if(!player)return emitError(ws,'La sesión no se pudo recuperar. Escribe tu nombre para volver a entrar.');
  if(player.ws&&player.ws!==ws){player.ws.initialized=null;player.ws.close();}player.ws=ws;
  ws.initialized={code,role:'player',pid:player.id};send(ws,{type:'identity',role:'player',room:code,token,pid:player.id,name:player.name});roomBroadcast(room);return;
 }
 const info=ws.initialized,room=rooms.get(info.code);if(!room)return emitError(ws,'La sala ya no existe.');
 if(msg.type==='ping'){send(ws,{type:'pong'});return;}
 if(info.role==='host'){
  if(msg.type==='start'){
   if(room.phase!=='lobby'&&room.phase!=='final')return emitError(ws,'La partida está en curso.');
   if(room.players.size===0)return emitError(ws,'Espera a que se una por lo menos un estudiante.');
   const mode=['circuit','quiz','search','puzzle','memory'].includes(msg.mode)?msg.mode:'circuit';
   room.mode=mode;room.playlist=mode==='circuit'?['quiz','search','puzzle','memory','quiz','quiz']:mode==='quiz'?['quiz','quiz','quiz','quiz','quiz','quiz']:mode==='search'?['search','search']:mode==='puzzle'?['puzzle','puzzle']:['memory','memory'];
   room.index=0;for(const p of room.players.values()){p.score=0;p.progress=newProgress();p.done=false;}startRound(room);return;
  }
  if(msg.type==='end'&&room.phase==='playing'){finishRound(room);return;}
  if(msg.type==='next'&&room.phase==='results'){
   if(room.index+1>=room.playlist.length){room.phase='final';roomBroadcast(room);}else{room.index++;startRound(room);}return;
  }
  if(msg.type==='lobby'&&room.phase==='final'){room.phase='lobby';room.index=-1;room.round=null;roomBroadcast(room);return;}
  if(msg.type==='kick'&&room.phase==='lobby'){
   const p=room.players.get(sanitize(msg.pid,20));if(p){send(p.ws,{type:'kicked'});if(p.ws){p.ws.initialized=null;p.ws.close();}room.players.delete(p.id);roomBroadcast(room);}return;
  }
  return;
 }
 if(info.role==='player'&&msg.type==='answer'){
  const p=room.players.get(info.pid);if(!p)return;
  const res=playerUpdate(room,p,sanitize(msg.kind,16),msg||{});
  send(ws,{type:'feedback',...res});if(res.ok){roomBroadcast(room);checkDone(room);}return;
 }
}
// WebSocket RFC 6455 básico con mensajes de texto JSON, y ping/pong.
function encodeFrame(data,opcode=1){const body=Buffer.from(data),size=body.length;let head;if(size<126){head=Buffer.from([0x80|opcode,size]);}else if(size<65536){head=Buffer.alloc(4);head[0]=0x80|opcode;head[1]=126;head.writeUInt16BE(size,2);}else{head=Buffer.alloc(10);head[0]=0x80|opcode;head[1]=127;head.writeBigUInt64BE(BigInt(size),2);}return Buffer.concat([head,body]);}
function send(ws,obj){if(!ws||ws.dead||ws.socket.destroyed)return;try{ws.socket.write(encodeFrame(JSON.stringify(obj)));}catch(e){ws.close();}}
function closeConn(ws){if(ws.dead)return;ws.dead=true;
 if(ws.initialized){const info=ws.initialized,room=rooms.get(info.code);if(room){
 if(info.role==='host'&&room.host.ws===ws)room.host.ws=null;
 if(info.role==='player'){const p=room.players.get(info.pid);if(p&&p.ws===ws)p.ws=null;}
 roomBroadcast(room);
 }}
}
function makeConnection(socket){const ws={socket,buffer:Buffer.alloc(0),dead:false,initialized:null,close:()=>{try{socket.end(encodeFrame('',8));}catch{};try{socket.destroy();}catch{}}};
 socket.on('data',chunk=>{if(ws.dead)return;ws.buffer=Buffer.concat([ws.buffer,chunk]);if(ws.buffer.length>300000){ws.close();return;}
  while(ws.buffer.length>=2){const b=ws.buffer,lenCode=b[1]&127,masked=!!(b[1]&128),fin=!!(b[0]&128),opcode=b[0]&15;let len=lenCode,offset=2;
   if(lenCode===126){if(b.length<4)break;len=b.readUInt16BE(2);offset=4;}
   if(lenCode===127){if(b.length<10)break;const n=b.readBigUInt64BE(2);if(n>200000n){ws.close();return;}len=Number(n);offset=10;}
   if(!masked||!fin){ws.close();return;}
   if(b.length<offset+4+len)break;
   const mask=b.subarray(offset,offset+4),raw=b.subarray(offset+4,offset+4+len);
   const data=Buffer.allocUnsafe(len);for(let i=0;i<len;i++)data[i]=raw[i]^mask[i&3];
   ws.buffer=b.subarray(offset+4+len);
   if(opcode===8){ws.close();return;}if(opcode===9){try{socket.write(encodeFrame(data,10));}catch{}continue;}
   if(opcode!==1)continue;
   try{handle(ws,JSON.parse(data.toString('utf8')));}catch(e){emitError(ws,'No pudimos procesar esa solicitud.');}
  }
 });
 socket.on('close',()=>closeConn(ws));socket.on('end',()=>closeConn(ws));socket.on('error',()=>closeConn(ws));return ws;
}
const STATIC=path.join(__dirname,'public');
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=new URL(req.url,'http://localhost').pathname;}catch{return res.writeHead(400).end('Solicitud no valida');}
 if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,rooms:rooms.size}));}
 if(pathname!=='/'&&pathname!=='/index.html'&&pathname!=='/favicon.ico'){res.writeHead(404).end('No encontrado');return;}
 if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
 fs.readFile(path.join(STATIC,'index.html'),(err,data)=>{if(err){res.writeHead(500).end('Error');return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);});
});
server.on('upgrade',(req,socket,head)=>{
 if(req.url.split('?')[0]!=='/ws'||String(req.headers.upgrade).toLowerCase()!=='websocket'||!req.headers['sec-websocket-key']){socket.destroy();return;}
 const key=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
 socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+key+'\r\n\r\n');
 const ws=makeConnection(socket);if(head.length)socket.emit('data',head);
});
setInterval(()=>{const time=now();for(const [key,room] of rooms){const noOnline=!room.host.ws&&[...room.players.values()].every(p=>!p.ws);if(noOnline&&time-room.created>2*60*60*1000){clearTimeout(room.timer);rooms.delete(key);}}},60000).unref();
server.listen(PORT,'0.0.0.0',()=>console.log(`TECNO VENTAS MULTIJUGADOR listo en http://localhost:${PORT}`));
