'use strict';
const base = document.querySelector('meta[name="app-base"]').content;
const root = document.querySelector('#app');
let state, adminTimer, flushing = false, networkFailed = false, eventOrder = Date.now();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const at = path => base + path;
async function api(path, data) {
  const res = await fetch(at('/api/' + path), {method:data === undefined ? 'GET':'POST', headers:{'Content-Type':'application/json','X-CSRF-Token':state?.csrf || ''}, body:data === undefined ? undefined:JSON.stringify(data)});
  let json; try { json = await res.json(); } catch { throw new Error('O servidor não respondeu corretamente. Verifique a conexão.'); }
  if (!res.ok) { const e=new Error(json.error || 'Não foi possível concluir.'); e.status=res.status; throw e; }
  return json;
}
function toast(message, error = false) {
  document.querySelector('.toast')?.remove(); const el=document.createElement('div'); el.className='toast'+(error?' error':''); el.setAttribute('role','status'); el.textContent=message; document.body.append(el); setTimeout(()=>el.remove(),6500);
}
function bindForm(id, callback) {
  document.querySelector('#'+id)?.addEventListener('submit', async e=>{e.preventDefault(); const button=e.target.querySelector('button[type=submit]'); button.disabled=true; try {await callback(new FormData(e.target));} catch(err){toast(err.message,true);} finally {button.disabled=false;}});
}
function brand() { return '<a class="brand" href="'+at('/')+'"><span class="brand-symbol">a</span>aurora<span class="brand-dot">.</span></a>'; }
function topbar(label='ARQUIVO DE CORRESPONDÊNCIAS') { return `<header>${brand()}<span class="header-label">${label}</span><div class="header-end"><span class="live-dot"></span><span>Serviços operacionais</span>${state.team || state.admin ? '<button class="text-button" id="logout">Sair ↗</button>':''}</div></header>`; }
function footer() { return '<footer><span>AURORA SISTEMAS · AMBIENTE DE INVESTIGAÇÃO</span><span>Algumas respostas ficaram no passado. <span class="muted">v.3.0.0</span></span></footer>'; }
function wireLogout() { document.querySelector('#logout')?.addEventListener('click',async()=>{if(queue().length) return toast('Aguarde o registro das respostas antes de sair.',true); await api('logout',{}); location.href=at('/');}); }
async function refresh() { state=await api('state'); render(); }
function render() {
  clearInterval(adminTimer);
  if (location.pathname.replace(/\/$/,'')===at('/organizacao')) { renderAdmin(); return; }
  if (!state.team) renderLogin();
  else if (!state.attempt.mailbox) renderGate();
  else if (!state.attempt.opened) renderInbox();
  else renderLetter();
  wireLogout();
}
function renderLogin() {
  root.innerHTML=topbar()+`<main class="landing"><section class="intro"><div class="eyebrow"><span class="small-line"></span> PORTAL INTERNO · ACESSO RESTRITO</div><h1>Toda mensagem<br>tem uma <em>história.</em></h1><p>Bem-vindos ao arquivo de correspondências Aurora. Identifiquem a equipe para iniciar a investigação.</p><div class="story-card"><span class="envelope-art">✉</span><div><strong>O que o presente não conta,<br>o passado pode revelar.</strong><span>Arquivo corporativo · desde 1998</span></div></div><div class="intro-bottom">01 / INVESTIGAR <span>02 / INTERPRETAR</span></div></section><section class="access-card"><div class="card-kicker">IDENTIFICAÇÃO DA EQUIPE</div><h2>Vamos começar.</h2><p>Digite o nome da equipe. Se ela já participou, o progresso será recuperado.</p><form id="team-login"><label for="team-name">Nome da equipe</label><input id="team-name" name="name" placeholder="Como se chama sua equipe?" required autocomplete="off" minlength="2" maxlength="80" spellcheck="false"><button type="submit" class="primary">Iniciar investigação <span>↗</span></button></form><div class="access-note"><span>◈</span> Use sempre o mesmo nome. Suas respostas e seu progresso ficam vinculados à equipe.</div></section></main>`+footer();
  bindForm('team-login',async f=>{await api('login',{name:f.get('name')}); await refresh();});
}
function renderGate() {
  root.innerHTML=topbar()+`<main class="landing"><section class="intro"><div class="eyebrow"><span class="small-line"></span> ATO 01 · O ARQUIVO</div><h1>Nem tudo fica<br>na <em>superfície.</em></h1><p>Olá, ${esc(state.team.name)}. A caixa postal da diretoria está protegida. Encontrem a credencial para continuar.</p><div class="story-card"><span class="envelope-art">⌁</span><div><strong>O sistema mudou.<br>O histórico permaneceu.</strong><span>Registro de migração · revisão 04</span></div></div><div class="intro-bottom">HTML / CSS / JAVASCRIPT <span>OU ALGO ANTERIOR?</span></div></section><section class="access-card" data-build="legacy-mail-04"><div class="card-kicker">AURORA MAIL · DIRETORIA</div><h2>Uma porta de entrada.</h2><p>Entre com a credencial do arquivo corporativo.</p><form id="mail-login"><label for="mail-password">Senha de acesso</label><input id="mail-password" name="password" type="password" placeholder="Credencial do ambiente" required autocomplete="off"><button type="submit" class="primary">Abrir caixa postal <span>↗</span></button></form><div class="access-note">◈ &nbsp; Esta interface faz parte de um ambiente fictício de investigação.</div>${state.repository ? `<a class="repository-link" href="${esc(state.repository)}" target="_blank" rel="noopener">Código-fonte e registro de versões ↗</a>`:'<p class="small muted">O repositório será informado pela organização.</p>'}</section></main>`+footer();
  bindForm('mail-login',async f=>{await api('mailbox',{password:f.get('password')}); await refresh();});
}
const mails = [
 {from:'Helena Martins',email:'helena@aurora.example',title:'Carta de amor',preview:'Algumas mensagens só fazem sentido quando chegamos ao fim.',date:'19 out',unread:false,body:'Algumas mensagens só fazem sentido quando chegamos ao fim. Deixei uma carta para sua equipe no arquivo de correspondências. Leiam com o cuidado que toda boa história merece.',letter:true},
 {from:'Infraestrutura',email:'infra@aurora.example',title:'Janela de manutenção',preview:'A atualização dos serviços acontece na sexta-feira.',date:'18 out',unread:true,body:'A manutenção dos serviços está prevista para sexta-feira, às 22h. O histórico de versões foi preservado durante a migração.'},
 {from:'Paulo Nascimento',email:'paulo@aurora.example',title:'Ata da reunião de planejamento',preview:'Encaminho os encaminhamentos aprovados pela diretoria.',date:'18 out',unread:false,body:'Registramos que toda alteração deverá ser precedida de análise dos requisitos. Antes de executar, compreenda o pedido completo.'},
 {from:'Financeiro',email:'financeiro@aurora.example',title:'Conferência de despesas — outubro',preview:'Os relatórios estão disponíveis para conferência.',date:'17 out',unread:true,body:'Os relatórios mensais foram disponibilizados. Pedimos que a conferência seja finalizada até o próximo dia útil.'},
 {from:'Equipe de produto',email:'produto@aurora.example',title:'Revisão da identidade visual',preview:'A nova versão da marca Aurora já está em uso.',date:'16 out',unread:false,body:'A identidade visual foi atualizada. Alteramos cores e tipografia, mas preservamos as histórias que nos trouxeram até aqui.'},
 {from:'Recepção',email:'recepcao@aurora.example',title:'Correspondências recebidas',preview:'Há documentos destinados à diretoria.',date:'15 out',unread:false,body:'As correspondências foram digitalizadas e arquivadas. O acesso ao arquivo acontece por meio dos links nas respectivas mensagens.'},
 {from:'Segurança da informação',email:'seguranca@aurora.example',title:'Boas práticas de configuração',preview:'Revisem os arquivos de ambiente antes de publicar.',date:'14 out',unread:false,body:'Arquivos de ambiente devem permanecer fora do controle de versão. Atenção: remover um arquivo da versão atual não remove suas versões anteriores.'},
 {from:'Recursos humanos',email:'rh@aurora.example',title:'Atualização de cadastro',preview:'Confiram os dados das respectivas equipes.',date:'13 out',unread:true,body:'Solicitamos a conferência dos nomes das equipes antes da abertura dos documentos. Use sempre o nome cadastrado.'},
 {from:'Biblioteca',email:'biblioteca@aurora.example',title:'Novas aquisições',preview:'Leitura, interpretação e análise de sistemas.',date:'12 out',unread:false,body:'As novas aquisições incluem materiais sobre análise de requisitos, comunicação e documentação de sistemas.'},
 {from:'Suporte',email:'suporte@aurora.example',title:'Chamado encerrado #1042',preview:'A migração da caixa postal foi concluída.',date:'11 out',unread:false,body:'A caixa postal foi migrada com sucesso. As configurações legadas foram removidas da distribuição atual.'}
];
function flagCard(label, flag) { return `<div class="flag-card"><div><span class="eyebrow">${label}</span><p>Senha para registrar no sistema do hackaton</p></div><code>${esc(flag)}</code></div>`; }
function renderInbox() {
  root.innerHTML=topbar('AURORA MAIL · DIRETORIA')+`<main class="workspace"><div class="page-heading"><div><div class="eyebrow">ATO 01 · INVESTIGAÇÃO CONCLUÍDA</div><h1>Caixa de entrada<span class="count">10</span></h1></div><span class="team-tag">${esc(state.team.name)}</span></div>${flagCard('DESAFIO 1 CONCLUÍDO',state.attempt.puzzle_flag)}<div class="mail-shell"><aside class="mail-sidebar"><strong>Correspondências</strong><div class="folder active">▣ &nbsp; Caixa de entrada <span>10</span></div><div class="folder">☆ &nbsp; Favoritos</div><div class="folder">↗ &nbsp; Enviados</div><div class="folder">▤ &nbsp; Arquivo</div><div class="sidebar-bottom">diretoria@aurora.example<br><span>Conta institucional fictícia</span></div></aside><section class="mail-list" aria-label="Mensagens">${mails.map((m,i)=>`<button class="mail-row ${m.unread?'unread':''}" data-mail="${i}"><span class="mail-avatar">${esc(m.from[0])}</span><span class="mail-summary"><strong>${esc(m.from)}</strong><span>${esc(m.title)}</span><small>${esc(m.preview)}</small></span><span class="mail-date">${m.date}${m.unread?'<b class="unread-dot"></b>':''}</span></button>`).join('')}</section><article class="mail-detail" id="mail-detail"><div class="empty-state"><span>✉</span><h2>Cada mensagem, uma história.</h2><p>Selecione uma correspondência para ler.</p></div></article></div></main>`+footer();
  document.querySelectorAll('[data-mail]').forEach(b=>b.addEventListener('click',()=>{
    const m=mails[Number(b.dataset.mail)]; b.classList.remove('unread'); document.querySelectorAll('[data-mail]').forEach(x=>x.classList.remove('selected')); b.classList.add('selected');
    document.querySelector('#mail-detail').innerHTML=`<span class="eyebrow">CORRESPONDÊNCIA ARQUIVADA</span><h2>${esc(m.title)}</h2><div class="sender"><span class="mail-avatar">${esc(m.from[0])}</span><div><strong>${esc(m.from)}</strong><small>${esc(m.email)}</small></div><span>${m.date} 2026</span></div><div class="message-body"><p>Olá, equipe.</p><p>${esc(m.body)}</p><p>Com carinho,<br>${esc(m.from)}</p>${m.letter?'<button class="primary" id="open-letter">Abrir correspondência ↗</button>':''}</div>`;
    document.querySelector('#open-letter')?.addEventListener('click',()=>showLetterRequest());
    if(innerWidth<900) document.querySelector('#mail-detail').scrollIntoView({behavior:'smooth'});
  }));
}
function showLetterRequest() {
  document.querySelector('#mail-detail').innerHTML=`<span class="eyebrow">ARQUIVO DE CORRESPONDÊNCIAS</span><h2>Uma carta para vocês.</h2><p>Confirmem o nome cadastrado da equipe para registrar o recebimento.</p><form id="request-letter"><label for="team-name">Nome da equipe</label><input id="team-name" name="name" required autocomplete="off"><button class="primary" type="submit">Receber e ler a carta ↗</button></form>`;
  bindForm('request-letter',async f=>{await api('letter',{name:f.get('name')}); await refresh();});
}
const queuePrefix = 'aurora-event-';
function eventId() { return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(20)),n=>n.toString(16).padStart(2,'0')).join(''); }
function queue() {
  if(!state?.attempt) return [];
  try {return Object.keys(localStorage).filter(k=>k.startsWith(queuePrefix)).map(k=>JSON.parse(localStorage.getItem(k))).filter(e=>e.attempt===state.attempt.id).sort((a,b)=>a.order-b.order);} catch {return [];}
}
function updateSaveStatus() {
  const el=document.querySelector('#save-state'); if(!el) return;
  const n=queue().length;
  el.className='save-state'+(networkFailed?' failed':''); el.textContent=networkFailed?'Falha de conexão · novas respostas suspensas':n?'Registrando respostas…':'Todas as respostas registradas';
  document.querySelectorAll('.answer-input').forEach(el=>el.disabled=networkFailed || state.attempt.state!=='open');
  const b=document.querySelector('#finish'); if(b)b.disabled=networkFailed || n>0;
  document.querySelector('#retry-save')?.toggleAttribute('hidden',!networkFailed);
}
async function flush() {
  if(flushing || !state?.attempt) return;
  flushing=true;
  try { for(const e of queue()) {await api('answer',e); localStorage.removeItem(queuePrefix+e.event);} networkFailed=false; }
  catch(e) {networkFailed=true; toast(e.message,true);}
  finally {flushing=false; updateSaveStatus(); if(queue().length && !networkFailed) void flush();}
}
function renderLetter() {
  const a=state.attempt;
  if(a.state==='finished') {renderResult(); return;}
  const answers=Object.fromEntries(a.answers.map(x=>[x.item,x.value])); for(const e of queue())answers[e.item]=e.value;
  root.innerHTML=topbar('ARQUIVO DE CORRESPONDÊNCIAS')+`<main class="letter-workspace"><div class="page-heading"><div><div class="eyebrow">ATO 02 · LEITURA E ANÁLISE</div><h1>Uma carta para sua equipe.</h1></div><span class="team-tag">${esc(state.team.name)}</span></div><div class="rules-banner"><span>ⓘ</span><p>Esta atividade registra as respostas recebidas pelo servidor. Apagar ou alterar um campo não remove o histórico. A equipe possui uma tentativa. Leia com atenção antes de começar. A navegação e a leitura, por si só, não contam como resposta.</p></div><div class="letter-layout"><aside class="letter-aside"><span class="eyebrow">CORRESPONDÊNCIA 024</span><h2>Antes de agir,<br>compreenda.</h2><p>Uma atividade sobre atenção, interpretação e as decisões que tomamos ao longo do caminho.</p><div class="letter-meta">DE<br><strong>Helena Martins</strong><br><br>PARA<br><strong>${esc(state.team.name)}</strong></div><div class="seal">A</div></aside><article class="paper"><div class="paper-top"><span>AURORA · CORRESPONDÊNCIAS</span><span>DOCUMENTO 024</span></div><h2>Carta de amor</h2><p class="letter-greeting">À equipe que chegou até aqui,</p><p>Algumas histórias exigem mais do que encontrar uma resposta. Exigem que saibamos quando responder. Abaixo estão as instruções desta correspondência.</p><div class="questions">${Object.entries(a.questions).map(([n,q])=>`<section class="question ${n==='2'?'read-first':''}"><span class="question-number">${String(n).padStart(2,'0')}</span><div><label ${![2,27].includes(+n)?`for="answer-${n}"`:''}>${esc(q)}</label>${![2,27].includes(+n)?`<input class="answer-input" id="answer-${n}" data-item="${n}" value="${esc(answers[n]||'')}" maxlength="1000" autocomplete="off" spellcheck="false" aria-label="Resposta do item ${n}">`:''}</div></section>`).join('')}</div><p class="signature">Com carinho,<br><em>Helena Martins</em></p><div class="finish-row"><span id="save-state" role="status" class="save-state">Todas as respostas registradas</span><button id="retry-save" class="secondary" hidden>Reconectar</button><button id="finish" class="primary">Concluir análise ↗</button></div></article></div></main>`+footer();
  document.querySelectorAll('.answer-input').forEach(el=>el.addEventListener('input',()=>{
    eventOrder=Math.max(Date.now(),eventOrder+1);
    const event={event:eventId(),attempt:a.id,item:Number(el.dataset.item),value:el.value,order:eventOrder};
    try { localStorage.setItem(queuePrefix+event.event,JSON.stringify(event)); }
    catch {networkFailed=true; toast('Não foi possível preservar a resposta no navegador. Procure a organização.',true); updateSaveStatus(); return;}
    updateSaveStatus(); void flush();
  }));
  document.querySelector('#retry-save').addEventListener('click',()=>void flush());
  document.querySelector('#finish').addEventListener('click',()=>{
    if(queue().length || networkFailed)return toast('Aguarde a confirmação do registro de todas as respostas.',true);
    showModal('<h2>Concluir a análise?</h2><p>A tentativa será encerrada e o histórico será avaliado. Depois da conclusão, não será possível alterar as respostas.</p><div class="modal-actions"><button class="secondary" id="cancel-modal">Continuar leitura</button><button class="primary" id="confirm-finish">Concluir tentativa ↗</button></div>');
    document.querySelector('#confirm-finish').addEventListener('click',async e=>{e.target.disabled=true; try {await flush(); if(queue().length || networkFailed)throw new Error('Há respostas pendentes de registro.'); await api('finish',{attempt:a.id}); closeModal(); await refresh();}catch(err){toast(err.message,true); e.target.disabled=false;}});
  });
  updateSaveStatus(); void flush();
}
function renderResult() {
  const a=state.attempt, passed=a.result==='approved';
  root.innerHTML=topbar()+`<main class="result-page"><div class="result-symbol">${passed?'✓':'✉'}</div><div class="eyebrow">ATO 02 · ANÁLISE CONCLUÍDA</div><h1>${passed?'A atenção fez a diferença.':'Sua análise foi registrada.'}</h1><p>${passed?'Vocês interpretaram as instruções e responderam aos itens solicitados. Registrem a senha abaixo no sistema do hackaton.':'A tentativa não atendeu a todos os critérios da carta. O histórico foi preservado e pode ser consultado pela organização.'}</p>${passed?flagCard('DESAFIO 2 CONCLUÍDO',a.flag):''}${flagCard('DESAFIO 1 CONCLUÍDO',a.puzzle_flag)}<span class="team-tag">${esc(state.team.name)} · tentativa ${a.number}</span></main>`+footer();
}
function showModal(html) {document.querySelector('dialog')?.remove(); const d=document.createElement('dialog');d.innerHTML=html;document.body.append(d);d.showModal();d.querySelector('#cancel-modal')?.addEventListener('click',closeModal);}
function closeModal(){document.querySelector('dialog')?.remove();}
function formatDate(s){return s?new Date(s).toLocaleString('pt-BR',{timeZone:'America/Bahia'}):'—';}
function teamStatus(t){return t.state==='finished'?t.result==='approved'?'Aprovada':t.result==='rejected'?'Não aprovada':'Substituída':t.opened_at?'Lendo a carta':t.mailbox_at?'Caixa postal':'Não iniciou';}
function renderAdmin() {
  if(!state.admin) {
    root.innerHTML=topbar('ORGANIZAÇÃO')+`<main class="admin-login access-card"><div class="card-kicker">UNIAENE · HACKATON</div><h2>Painel da organização.</h2><p>Acompanhe as equipes e os registros da atividade.</p><form id="admin-login"><label for="admin-password">Senha da organização</label><input id="admin-password" type="password" name="password" required autocomplete="current-password"><button class="primary" type="submit">Entrar no painel ↗</button></form></main>`+footer();
    bindForm('admin-login',async f=>{await api('admin/login',{password:f.get('password')});await refresh();}); return;
  }
  root.innerHTML=topbar('ORGANIZAÇÃO · ACOMPANHAMENTO')+`<main class="admin-workspace"><div class="page-heading"><div><div class="eyebrow">UNIAENE · ANÁLISE DE SISTEMAS</div><h1>Central da organização.</h1></div><a class="secondary button" href="${at('/api/admin/export')}">Exportar CSV ↗</a></div><div id="admin-stats" class="stats"></div><div class="admin-grid"><section class="panel"><h2>Cadastrar equipe</h2><p>As equipes também podem se cadastrar pelo nome na página inicial.</p><form id="new-team" class="inline-form"><input aria-label="Nome da nova equipe" name="name" placeholder="Nome da equipe" required minlength="2" maxlength="80"><button class="primary" type="submit">Cadastrar ↗</button></form><div id="created-team"></div></section><section class="panel"><h2>Repositório do desafio</h2><p>Este endereço aparece na tela de investigação dos alunos.</p><form id="repo-settings" class="inline-form"><input aria-label="URL do repositório público" id="repo-url" name="repository" placeholder="https://github.com/uniaene/aurora-mail"><button class="secondary" type="submit">Salvar</button></form></section></div><section class="panel"><div class="panel-heading"><h2>Senhas estáticas dos desafios</h2><span>Repasse ao responsável pelo sistema do hackaton</span></div><div id="admin-flags" class="admin-flags"></div></section><section class="panel"><div class="panel-heading"><h2>Equipes e tentativas</h2><span>Atualização automática a cada 5 segundos</span></div><div class="table-scroll"><table><thead><tr><th>Equipe</th><th>Situação</th><th>Caixa postal</th><th>Carta</th><th>Conclusão</th><th>Ações</th></tr></thead><tbody id="teams-body"></tbody></table></div></section><section class="panel"><h2>Conferir senha recebida</h2><form id="verify-flag" class="inline-form"><input aria-label="ID da equipe" name="team" type="number" placeholder="ID da equipe" required><input aria-label="Senha recebida" name="flag" placeholder="Senha recebida" required><button class="secondary" type="submit">Conferir</button></form><p id="verify-result" role="status"></p></section></main>`+footer();
  bindForm('new-team',async f=>{const r=await api('admin/teams',{name:f.get('name')});document.querySelector('#created-team').innerHTML=`<div class="created-code"><strong>${esc(r.name)}</strong><span>Equipe cadastrada. Basta usar este nome na página inicial.</span></div>`;document.querySelector('#new-team').reset(); await loadTeams();});
  bindForm('repo-settings',async f=>{await api('admin/settings',{repository:f.get('repository')});toast('Repositório atualizado.');});
  bindForm('verify-flag',async f=>{const r=await api('admin/verify',{team:Number(f.get('team')),flag:f.get('flag')});document.querySelector('#verify-result').textContent=r.valid?'Aprovação confirmada para '+r.team+'.':'Senha ou aprovação não encontrada para essa equipe.';});
  void loadTeams(true); adminTimer=setInterval(()=>{if(!document.hidden)void loadTeams();},5000);wireLogout();
}
async function loadTeams(initial=false) {
  try {
    const r=await api('admin/teams'), teams=r.teams;
    document.querySelector('#admin-stats').innerHTML=[['Equipes',teams.length],['Investigação concluída',teams.filter(t=>t.mailbox_at).length],['Cartas abertas',teams.filter(t=>t.opened_at).length],['Aprovadas na carta',teams.filter(t=>t.result==='approved').length]].map(([label,n])=>`<div class="stat"><span>${label}</span><strong>${n}</strong></div>`).join('');
    if(initial) {document.querySelector('#repo-url').value=r.repository; document.querySelector('#admin-flags').innerHTML=`<div><span>Desafio 1 · Histórico Git</span><code>${esc(r.puzzle_flag)}</code></div><div><span>Desafio 2 · Carta</span><code>${esc(r.letter_flag)}</code></div>`;}
    document.querySelector('#teams-body').innerHTML=teams.length?teams.map(t=>`<tr><td><strong>${esc(t.name)}</strong><small>ID ${t.team_id} · tentativa ${t.number}</small></td><td><span class="status ${t.result==='approved'?'approved':t.result==='rejected'?'rejected':''}">${teamStatus(t)}</span></td><td>${formatDate(t.mailbox_at)}</td><td>${formatDate(t.opened_at)}</td><td>${formatDate(t.finished_at)}</td><td><button class="text-button" data-events="${t.id}" data-name="${esc(t.name)}">Histórico</button><button class="text-button" data-reset="${t.team_id}">Nova tentativa</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty-table">Cadastre a primeira equipe para começar.</td></tr>';
    document.querySelectorAll('[data-events]').forEach(b=>b.addEventListener('click',async()=>{try {const r=await api('admin/events?attempt='+b.dataset.events);showModal(`<h2>Histórico · ${esc(b.dataset.name)}</h2><p>Alterações recebidas pelo servidor, incluindo respostas apagadas.</p><div class="event-list">${r.events.length?r.events.map(e=>`<div><strong>Tentativa ${e.number} · item ${e.item}</strong><time>${formatDate(e.created_at)}</time><pre>${esc(e.value || '(campo apagado)')}</pre></div>`).join(''):'Nenhuma resposta registrada.'}</div><button class="secondary" id="cancel-modal">Fechar</button>`);}catch(e){toast(e.message,true);}}));
    document.querySelectorAll('[data-reset]').forEach(b=>b.addEventListener('click',()=>{showModal(`<h2>Nova tentativa por intervenção</h2><p>A tentativa anterior será preservada. Use apenas em caso de falha técnica ou decisão da organização.</p><form id="reset-attempt"><label for="reset-reason">Motivo da intervenção</label><textarea id="reset-reason" name="reason" required minlength="8" maxlength="500"></textarea><div class="modal-actions"><button class="secondary" type="button" id="cancel-modal">Cancelar</button><button class="primary" type="submit">Criar nova tentativa</button></div></form>`);bindForm('reset-attempt',async f=>{await api('admin/reset',{team:Number(b.dataset.reset),reason:f.get('reason')});closeModal();await loadTeams();});}));
  }catch(e){toast(e.message,true);}
}
window.addEventListener('online',()=>void flush());
window.addEventListener('beforeunload',e=>{if(queue().length){e.preventDefault();e.returnValue='';}});
// legacyAuth was retired during migration. Recovery note: btoa('consulte o histórico').
refresh().catch(e=>{root.innerHTML='<main class="result-page"><h1>Não foi possível conectar.</h1><p>'+esc(e.message)+'</p><button id="reload" class="primary">Tentar novamente</button></main>';document.querySelector('#reload').onclick=()=>location.reload();});
