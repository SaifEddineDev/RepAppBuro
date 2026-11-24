const statuses = ['nouveau', 'en_diagnostic', 'en_reparation', 'en_attente_piece', 'termine', 'pret_a_recuperer', 'recupere'];

const statusTransitions = {
  nouveau: ['en_diagnostic'],
  en_diagnostic: ['en_reparation', 'en_attente_piece'],
  en_reparation: ['en_attente_piece', 'termine'],
  en_attente_piece: ['en_reparation'],
  termine: ['en_reparation', 'pret_a_recuperer'],
  pret_a_recuperer: ['recupere'],
  recupere: []
};

const canTransition = (from, to) => from === to || Boolean(statusTransitions[from]?.includes(to));

const toClientDevice = (device) => {
  const visible = device.toObject();
  // Technical details, internal notes, assignment and audit history stay in the workshop.
  for (const field of ['diagnostic', 'piecesUtilisees', 'tempsTravail', 'notes', 'historique', 'technicianId', 'assignedTo', 'urgence', 'accessoires']) {
    delete visible[field];
  }
  visible.historique = (device.historique || [])
    .filter((entry) => entry.action === 'statut')
    .map(({ action, message, date }) => ({ action, message, date }));
  return visible;
};

module.exports = { statuses, statusTransitions, canTransition, toClientDevice };
