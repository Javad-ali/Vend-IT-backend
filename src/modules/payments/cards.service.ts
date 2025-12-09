import { apiError, ok } from '../../utils/response.js';
import {
  tapCreateCardToken,
  tapCreateCustomer,
  tapCreateSavedCardToken,
  tapListCards,
  tapDeleteCard
} from './tap.client.js';
import {
  getUser,
  listCardsForUser,
  updateUserTapId,
  upsertCard,
  deleteCardByTapId
} from './payments.repository.js';
export const createCard = async (userId, input) => {
  const user = await getUser(userId);
  if (!user) throw new apiError(404, 'User not found');
  let tapCustomerId = user.tapCustomerId;
  if (!tapCustomerId) {
    const customer = await tapCreateCustomer({
      firstName: user.firstName ?? 'Vend',
      lastName: user.lastName ?? 'User',
      email: user.email ?? 'missing@vendit.com',
      phone: user.phoneNumber ?? '0000000',
      userId
    });
    tapCustomerId = customer.id;
    await updateUserTapId(userId, tapCustomerId);
  }
  const token = await tapCreateCardToken({
    number: input.number,
    expMonth: input.expMonth,
    expYear: input.expYear,
    cvc: input.cvc,
    name: input.name
  });
  const saved = await tapCreateSavedCardToken({ cardId: token.card.id, customerId: tapCustomerId });
  const card = await upsertCard({
    userId,
    tapCardId: token.card.id,
    last4: token.card.last_four,
    brand: token.card.brand,
    holderName: token.card.name,
    expMonth: token.card.exp_month,
    expYear: token.card.exp_year
  });
  return ok({ card, tapResponse: saved }, 'Card created successfully');
};
export const listCards = async (userId) => {
  const user = await getUser(userId);
  if (!user?.tapCustomerId) {
    return ok([], 'No cards found');
  }
  const remote = await tapListCards(user.tapCustomerId);
  const cards = await listCardsForUser(userId);
  const merged = remote.map((r) => ({
    tapCardId: r.id,
    brand: r.brand,
    last4: r.last_four,
    expMonth: r.exp_month,
    expYear: r.exp_year,
    name: r.name
  }));
  return ok(merged.length ? merged : cards, 'Cards found');
};
export const deleteCard = async (userId, tapCardId) => {
  const user = await getUser(userId);
  if (!user?.tapCustomerId) throw new apiError(400, 'Customer ID not set');
  const deleted = await tapDeleteCard(user.tapCustomerId, tapCardId);
  if (!deleted) throw new apiError(400, 'Card not deleted');
  await deleteCardByTapId(userId, tapCardId);
  return ok(null, 'Card deleted');
};
