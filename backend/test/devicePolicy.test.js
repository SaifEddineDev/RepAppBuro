const test = require('node:test');
const assert = require('node:assert/strict');
const { statuses, canTransition, toClientDevice } = require('../src/domain/devicePolicy');

test('repair workflow accepts only declared statuses', () => {
  assert.deepEqual(statuses, [
    'nouveau', 'en_diagnostic', 'en_reparation', 'en_attente_piece',
    'termine', 'pret_a_recuperer', 'recupere'
  ]);
});

test('repair workflow allows forward and waiting transitions only', () => {
  assert.equal(canTransition('nouveau', 'en_diagnostic'), true);
  assert.equal(canTransition('en_diagnostic', 'en_attente_piece'), true);
  assert.equal(canTransition('en_attente_piece', 'en_reparation'), true);
  assert.equal(canTransition('termine', 'pret_a_recuperer'), true);
  assert.equal(canTransition('pret_a_recuperer', 'recupere'), true);
  assert.equal(canTransition('termine', 'en_reparation'), true);
  assert.equal(canTransition('nouveau', 'recupere'), false);
  assert.equal(canTransition('recupere', 'en_reparation'), false);
});

test('client device responses omit workshop-only and audit fields', () => {
  const visible = toClientDevice({
    toObject: () => ({
      _id: 'repair-id', name: 'Imprimante', status: 'en_reparation',
      diagnostic: 'Internal diagnosis', piecesUtilisees: [{ nom: 'roller', prix: 20 }],
      tempsTravail: 40, notes: [{ message: 'Private' }], historique: [{ action: 'assignation' }],
      technicianId: 'tech-id', assignedTo: 'Technicien', urgence: 'urgent', accessoires: 'internal notes',
      facture: { montant: 120, payee: false }
    }),
    historique: [
      { action: 'statut', message: 'en_diagnostic → en_reparation', date: '2026-01-01' },
      { action: 'mise_a_jour', message: 'diagnostic, piecesUtilisees', userId: 'private-id' }
    ]
  });

  assert.equal(visible.name, 'Imprimante');
  assert.equal(visible.status, 'en_reparation');
  assert.deepEqual(visible.facture, { montant: 120, payee: false });
  for (const key of ['diagnostic', 'piecesUtilisees', 'tempsTravail', 'notes', 'technicianId', 'assignedTo', 'urgence', 'accessoires']) {
    assert.equal(Object.hasOwn(visible, key), false, `${key} should be private`);
  }
  assert.deepEqual(visible.historique, [{ action: 'statut', message: 'en_diagnostic → en_reparation', date: '2026-01-01' }]);
});
