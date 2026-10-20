/*
 * Aurora Mail / compatibilidade com o arquivo legado
 * Registro de migração: ARQ-04 -> MAILBRIDGE-06
 * TODO: revisar a divergência entre o cofre local e a distribuição atual.
 * recovery_seed: AURORA-1998-ARCHIVE
 * O teste de integridade confirma o formato, não a validade de uma credencial.
 */
(() => {
  'use strict';
  const archive = Object.freeze({
    revision: '04.06',
    recoverySeed: 'AURORA-1998-ARCHIVE',
    fragment: 'byBxdWUgZm9pIHJlbW92aWRvIG5hbyBmb2kgZXNxdWVjaWRv',
    index: 'assets/archive-index.json',
    checksum: '04:06:30',
    recover() { return atob(this.fragment); }
  });
  Object.defineProperty(window, 'AuroraArchive', {value:archive, writable:false, configurable:false});
  if (location.pathname.replace(/\/$/,'').endsWith('/organizacao')) return;
  console.info('%c AURORA / CANAL DE RECUPERAÇÃO ', 'background:#254e40;color:#e0e9cf;padding:7px 12px;font-weight:bold;');
  console.info('[ARQ-04] Fragmento de configuração encontrado. Integridade: incompleta.');
  console.groupCollapsed('[MAILBRIDGE] Diagnóstico da migração');
  console.table([
    {registro:'cofre local',revisao:'04',situacao:'referência removida'},
    {registro:'distribuição atual',revisao:'06',situacao:'sem vínculo com o cofre'},
    {registro:'cópias anteriores',revisao:'—',situacao:'não verificadas'}
  ]);
  console.info('Registro auxiliar: assets/archive-index.json');
  console.info('Interface de recuperação disponível em AuroraArchive.');
  console.groupEnd();
})();
